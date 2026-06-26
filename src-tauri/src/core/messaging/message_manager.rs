use crate::core::database::connection::Database;
use crate::core::messaging::encryption::{
    decrypt_message, encrypt_message, generate_messaging_keypair,
};
use crate::core::messaging::errors::MessagingError;
use crate::core::messaging::types::{Message, MessageStatus, MessageType};
use rusqlite::params;
use std::time::{SystemTime, UNIX_EPOCH};

/// Get or create X25519 messaging keys for a node.
/// Returns (private_key_bytes, public_key_bytes).
fn get_or_create_keys(
    db: &Database,
    node_id: &str,
) -> Result<([u8; 32], [u8; 32]), MessagingError> {
    let conn = db
        .conn
        .lock()
        .map_err(|_| MessagingError::EncryptionFailed("db lock".into()))?;

    // Try to load existing keys
    let result = conn.query_row(
        "SELECT x25519_private, x25519_public FROM messaging_keys WHERE node_id = ?1",
        params![node_id],
        |row| {
            let priv_bytes: Vec<u8> = row.get(0)?;
            let pub_bytes: Vec<u8> = row.get(1)?;
            Ok((priv_bytes, pub_bytes))
        },
    );

    match result {
        Ok((priv_bytes, pub_bytes)) => {
            let mut pk = [0u8; 32];
            let mut pubk = [0u8; 32];
            if priv_bytes.len() != 32 || pub_bytes.len() != 32 {
                return Err(MessagingError::EncryptionFailed(
                    "invalid key length".into(),
                ));
            }
            pk.copy_from_slice(&priv_bytes);
            pubk.copy_from_slice(&pub_bytes);
            Ok((pk, pubk))
        }
        Err(_) => {
            // Generate new keypair
            let (priv_key, pub_key) = generate_messaging_keypair();
            let now = SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .unwrap_or_default()
                .as_secs() as i64;
            conn.execute(
                "INSERT OR IGNORE INTO messaging_keys (node_id, x25519_public, x25519_private, created_at)
                 VALUES (?1, ?2, ?3, ?4)",
                params![node_id, pub_key.to_vec(), priv_key.to_vec(), now],
            ).map_err(|e| MessagingError::EncryptionFailed(e.to_string()))?;
            Ok((priv_key, pub_key))
        }
    }
}

fn now_secs() -> i64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs() as i64
}

fn make_conversation_id(a: &str, b: &str) -> String {
    let mut parts = [a, b];
    parts.sort();
    format!("conv-{}-{}", parts[0], parts[1])
}

/// Send an encrypted message, storing it in the database.
pub fn send_message(
    db: &Database,
    sender_id: &str,
    recipient_id: &str,
    content: &str,
) -> Result<Message, MessagingError> {
    let (sender_priv, _sender_pub) = get_or_create_keys(db, sender_id)?;
    let (_recipient_priv, recipient_pub) = get_or_create_keys(db, recipient_id)?;

    // Encrypt with real X25519 ECDH + XChaCha20
    let plaintext = content.as_bytes();
    let encrypted = encrypt_message(plaintext, &sender_priv, &recipient_pub)?;

    let content_hash = blake3::hash(plaintext).to_hex().to_string();
    let now = now_secs();
    let msg_id = format!("msg-{}", uuid::Uuid::new_v4());
    let conv_id = make_conversation_id(sender_id, recipient_id);

    let conn = db
        .conn
        .lock()
        .map_err(|_| MessagingError::EncryptionFailed("db lock".into()))?;

    // Store encrypted message
    conn.execute(
        "INSERT INTO messages (id, conversation_id, sender_id, recipient_id, content, content_hash,
         msg_type, status, sent_at, delivered_at, read_at, reply_to, media_ref, encrypted)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, NULL, NULL, NULL, NULL, 1)",
        params![
            msg_id,
            conv_id,
            sender_id,
            recipient_id,
            encrypted,
            content_hash,
            "Text",
            "Sent",
            now,
        ],
    )
    .map_err(|e| MessagingError::EncryptionFailed(e.to_string()))?;

    // Upsert conversation
    let participants = if sender_id < recipient_id {
        format!("{},{}", sender_id, recipient_id)
    } else {
        format!("{},{}", recipient_id, sender_id)
    };
    conn.execute(
        "INSERT INTO conversations (id, participants, name, is_group, created_at, last_message_at, unread_count, encrypted)
         VALUES (?1, ?2, NULL, 0, ?3, ?3, 0, 1)
         ON CONFLICT(id) DO UPDATE SET last_message_at = ?3, unread_count = unread_count + 1",
        params![conv_id, participants, now],
    ).map_err(|e| MessagingError::EncryptionFailed(e.to_string()))?;

    Ok(Message {
        id: msg_id,
        conversation_id: conv_id,
        sender_id: sender_id.to_string(),
        recipient_id: recipient_id.to_string(),
        msg_type: MessageType::Text,
        content: plaintext.to_vec(),
        content_hash,
        status: MessageStatus::Sent,
        sent_at: now,
        delivered_at: None,
        read_at: None,
        reply_to: None,
        media_ref: None,
    })
}

/// Retrieve decrypted messages with a specific peer.
pub fn get_messages(
    db: &Database,
    my_id: &str,
    peer_id: &str,
    limit: i64,
) -> Result<Vec<Message>, MessagingError> {
    let (my_priv, _my_pub) = get_or_create_keys(db, my_id)?;
    let (_peer_priv, peer_pub) = get_or_create_keys(db, peer_id)?;

    let conn = db
        .conn
        .lock()
        .map_err(|_| MessagingError::EncryptionFailed("db lock".into()))?;
    let conv_id = make_conversation_id(my_id, peer_id);

    let mut stmt = conn
        .prepare(
            "SELECT id, conversation_id, sender_id, recipient_id, content, content_hash,
                msg_type, status, sent_at, delivered_at, read_at, reply_to, media_ref
         FROM messages
         WHERE conversation_id = ?1
         ORDER BY sent_at ASC
         LIMIT ?2",
        )
        .map_err(|e| MessagingError::EncryptionFailed(e.to_string()))?;

    let rows = stmt
        .query_map(params![conv_id, limit], |row| {
            let id: String = row.get(0)?;
            let conv_id: String = row.get(1)?;
            let sender_id: String = row.get(2)?;
            let recipient_id: String = row.get(3)?;
            let encrypted_content: Vec<u8> = row.get(4)?;
            let content_hash: String = row.get(5)?;
            let msg_type: String = row.get(6)?;
            let status: String = row.get(7)?;
            let sent_at: i64 = row.get(8)?;
            let delivered_at: Option<i64> = row.get(9)?;
            let read_at: Option<i64> = row.get(10)?;
            let reply_to: Option<String> = row.get(11)?;
            let media_ref: Option<String> = row.get(12)?;
            Ok((
                id,
                conv_id,
                sender_id,
                recipient_id,
                encrypted_content,
                content_hash,
                msg_type,
                status,
                sent_at,
                delivered_at,
                read_at,
                reply_to,
                media_ref,
            ))
        })
        .map_err(|e| MessagingError::EncryptionFailed(e.to_string()))?;

    let mut messages = Vec::new();
    for row in rows {
        let (
            id,
            conv_id,
            sender_id,
            recipient_id,
            encrypted_content,
            content_hash,
            msg_type,
            status,
            sent_at,
            delivered_at,
            read_at,
            reply_to,
            media_ref,
        ) = row.map_err(|e| MessagingError::EncryptionFailed(e.to_string()))?;

        // Determine which keys to use for decryption.
        // X25519 ECDH is symmetric: my_priv + peer_pub == peer_priv + my_pub
        let decrypted = if sender_id == my_id {
            // I sent this — decrypt with my_priv + peer_pub
            decrypt_message(&encrypted_content, &my_priv, &peer_pub)
        } else {
            // Peer sent this — decrypt with my_priv + peer_pub (same shared secret)
            decrypt_message(&encrypted_content, &my_priv, &peer_pub)
        };

        let content = match decrypted {
            Ok(c) => c,
            Err(_) => b"[decryption failed]".to_vec(),
        };

        let parsed_type = match msg_type.as_str() {
            "Image" => MessageType::Image,
            "File" => MessageType::File,
            "Audio" => MessageType::Audio,
            "Video" => MessageType::Video,
            "System" => MessageType::System,
            "Encrypted" => MessageType::Encrypted,
            _ => MessageType::Text,
        };

        let parsed_status = match status.as_str() {
            "Sending" => MessageStatus::Sending,
            "Sent" => MessageStatus::Sent,
            "Delivered" => MessageStatus::Delivered,
            "Read" => MessageStatus::Read,
            "Failed" => MessageStatus::Failed,
            _ => MessageStatus::Sent,
        };

        messages.push(Message {
            id,
            conversation_id: conv_id,
            sender_id,
            recipient_id,
            msg_type: parsed_type,
            content,
            content_hash,
            status: parsed_status,
            sent_at,
            delivered_at,
            read_at,
            reply_to,
            media_ref,
        });
    }

    Ok(messages)
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct ConversationInfo {
    pub conversation_id: String,
    pub peer_id: String,
    pub last_message_preview: String,
    pub last_message_at: i64,
    pub unread_count: i64,
    pub encrypted: bool,
}

/// List all conversations for a user.
pub fn get_conversations(
    db: &Database,
    my_id: &str,
) -> Result<Vec<ConversationInfo>, MessagingError> {
    let conn = db
        .conn
        .lock()
        .map_err(|_| MessagingError::EncryptionFailed("db lock".into()))?;

    let mut stmt = conn
        .prepare(
            "SELECT c.id, c.participants, c.last_message_at, c.unread_count, c.encrypted,
                m.content, m.sender_id
         FROM conversations c
         LEFT JOIN messages m ON m.conversation_id = c.id AND m.sent_at = c.last_message_at
         WHERE c.participants LIKE '%' || ?1 || '%'
         ORDER BY c.last_message_at DESC",
        )
        .map_err(|e| MessagingError::EncryptionFailed(e.to_string()))?;

    let rows = stmt
        .query_map(params![my_id], |row| {
            let conv_id: String = row.get(0)?;
            let participants: String = row.get(1)?;
            let last_message_at: i64 = row.get(2)?;
            let unread_count: i64 = row.get(3)?;
            let encrypted: bool = row.get::<_, i64>(4)? != 0;
            let last_content: Option<Vec<u8>> = row.get(5)?;
            let sender_id: Option<String> = row.get(6)?;
            Ok((
                conv_id,
                participants,
                last_message_at,
                unread_count,
                encrypted,
                last_content,
                sender_id,
            ))
        })
        .map_err(|e| MessagingError::EncryptionFailed(e.to_string()))?;

    let mut conversations = Vec::new();
    let (_my_priv, _my_pub) = get_or_create_keys(db, my_id)?;

    for row in rows {
        let (
            conv_id,
            participants,
            last_message_at,
            unread_count,
            encrypted,
            last_content,
            _sender_id,
        ) = row.map_err(|e| MessagingError::EncryptionFailed(e.to_string()))?;

        // Extract peer_id from participants
        let peer_id = participants
            .split(',')
            .find(|p| *p != my_id)
            .unwrap_or("unknown")
            .to_string();

        // Try to decrypt last message preview
        let preview = if let Some(content) = last_content {
            let (_peer_priv, peer_pub) = get_or_create_keys(db, &peer_id)?;
            match decrypt_message(&content, &_my_priv, &peer_pub) {
                Ok(plaintext) => String::from_utf8_lossy(&plaintext).to_string(),
                Err(_) => "[encrypted]".to_string(),
            }
        } else {
            String::new()
        };

        conversations.push(ConversationInfo {
            conversation_id: conv_id,
            peer_id,
            last_message_preview: preview,
            last_message_at,
            unread_count,
            encrypted,
        });
    }

    Ok(conversations)
}

/// Mark a message as read.
pub fn mark_read(db: &Database, message_id: &str) -> Result<(), MessagingError> {
    let now = now_secs();
    let conn = db
        .conn
        .lock()
        .map_err(|_| MessagingError::EncryptionFailed("db lock".into()))?;
    conn.execute(
        "UPDATE messages SET status = 'Read', read_at = ?1 WHERE id = ?2",
        params![now, message_id],
    )
    .map_err(|e| MessagingError::EncryptionFailed(e.to_string()))?;
    Ok(())
}

/// Delete a message.
pub fn delete_message(db: &Database, message_id: &str) -> Result<(), MessagingError> {
    let conn = db
        .conn
        .lock()
        .map_err(|_| MessagingError::EncryptionFailed("db lock".into()))?;
    conn.execute("DELETE FROM messages WHERE id = ?1", params![message_id])
        .map_err(|e| MessagingError::EncryptionFailed(e.to_string()))?;
    Ok(())
}
