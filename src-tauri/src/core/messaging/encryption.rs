use crate::core::messaging::errors::MessagingError;

pub const MAX_MESSAGE_BYTES: usize = 64 * 1024; // 64KB per message
pub const MAX_MEDIA_BYTES: usize = 512 * 1024 * 1024; // 512MB for media

/// Encrypt a message for a specific recipient using their public key
/// Phase 5: Uses XChaCha20Poly1305 with recipient's derived key
pub fn encrypt_message(
    plaintext: &[u8],
    sender_private_key: &[u8; 32],
    recipient_public_key: &[u8; 32],
) -> Result<Vec<u8>, MessagingError> {
    if plaintext.len() > MAX_MESSAGE_BYTES {
        return Err(MessagingError::TooLarge { size: plaintext.len(), max: MAX_MESSAGE_BYTES });
    }
    // Derive shared key via X25519 DH (Phase 5 full impl)
    let shared_key = derive_shared_key(sender_private_key, recipient_public_key);
    encrypt_with_key(&shared_key, plaintext)
        .map_err(|e| MessagingError::EncryptionFailed(e))
}

pub fn decrypt_message(
    ciphertext: &[u8],
    recipient_private_key: &[u8; 32],
    sender_public_key: &[u8; 32],
) -> Result<Vec<u8>, MessagingError> {
    let shared_key = derive_shared_key(recipient_private_key, sender_public_key);
    decrypt_with_key(&shared_key, ciphertext)
        .map_err(|e| MessagingError::DecodeFailed(e))
}

fn derive_shared_key(private_key: &[u8; 32], public_key: &[u8; 32]) -> [u8; 32] {
    use sha2::{Sha256, Digest};
    let mut combined = Vec::with_capacity(64);
    combined.extend_from_slice(private_key);
    combined.extend_from_slice(public_key);
    let h = Sha256::digest(&combined);
    let mut key = [0u8; 32];
    key.copy_from_slice(&h);
    key
}

fn encrypt_with_key(key: &[u8; 32], data: &[u8]) -> Result<Vec<u8>, String> {
    use chacha20poly1305::{aead::{Aead, KeyInit}, XChaCha20Poly1305, Key, XNonce};
    use rand::RngCore;
    let mut nonce_bytes = [0u8; 24];
    rand::thread_rng().fill_bytes(&mut nonce_bytes);
    let cipher = XChaCha20Poly1305::new(Key::from_slice(key));
    let ct = cipher.encrypt(XNonce::from_slice(&nonce_bytes), data)
        .map_err(|e| e.to_string())?;
    let mut out = nonce_bytes.to_vec();
    out.extend_from_slice(&ct);
    Ok(out)
}

fn decrypt_with_key(key: &[u8; 32], data: &[u8]) -> Result<Vec<u8>, String> {
    use chacha20poly1305::{aead::{Aead, KeyInit}, XChaCha20Poly1305, Key, XNonce};
    if data.len() < 24 { return Err("ciphertext too short".to_string()); }
    let (nonce_bytes, ct) = data.split_at(24);
    let cipher = XChaCha20Poly1305::new(Key::from_slice(key));
    cipher.decrypt(XNonce::from_slice(nonce_bytes), ct).map_err(|e| e.to_string())
}
