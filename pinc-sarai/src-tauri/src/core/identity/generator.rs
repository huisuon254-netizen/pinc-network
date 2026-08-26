use base64::{engine::general_purpose::STANDARD as B64, Engine};
use std::time::{SystemTime, UNIX_EPOCH};
use uuid::Uuid;

use crate::core::{
    crypto::{
        cipher::encrypt,
        hash::{hash_password, sha256_hex},
        keys::generate_keypair,
        types::NonceType,
    },
    database::{connection::Database, queries::insert_identity},
    identity::{
        errors::IdentityError, fingerprint::device_fingerprint, recovery::generate_recovery_hash,
        types::Identity, validator::validate_identity,
    },
};

/// Identity profile supplied at creation: two names + date of birth.
pub struct IdentityProfile {
    pub first_name: String,
    pub last_name: String,
    pub date_of_birth: String,
}

/// Generate a fresh 7-digit candidate node_id.
fn generate_node_id() -> String {
    let mut id_bytes = [0u8; 5];
    rand::RngCore::fill_bytes(&mut rand::thread_rng(), &mut id_bytes);
    let id_num = u64::from_be_bytes({
        let mut buf = [0u8; 8];
        buf[3..].copy_from_slice(&id_bytes);
        buf
    });
    format!("{:07}", id_num % 10_000_000)
}

/// Ensure the generated node_id is UNIQUE across all identities in the DB.
/// If it already exists, regenerate — max 10 attempts, then error out.
/// The resulting ID is permanently linked to this identity's password + PIN.
pub fn ensure_unique_node_id(db: &Database, node_id: &str) -> Result<String, IdentityError> {
    let conn = db.conn.lock().map_err(|_| IdentityError::StorageFailed("db lock failed".to_string()))?;
    let mut candidate = node_id.to_string();
    for _attempt in 0..10 {
        let count: i64 = conn
            .query_row(
                "SELECT COUNT(*) FROM identities WHERE node_id=?1",
                rusqlite::params![candidate],
                |r| r.get(0),
            )
            .map_err(|e| IdentityError::StorageFailed(e.to_string()))?;
        if count == 0 {
            return Ok(candidate);
        }
        candidate = generate_node_id();
    }
    Err(IdentityError::ValidationFailed(
        "could not generate a unique node_id after 10 attempts".to_string(),
    ))
}

/// Create an identity. NOTE: the node_id is PERMANENT — never regenerate it on
/// recovery; recovery restores the SAME node_id via seed phrase (recovery.rs).
pub fn create_identity(
    db: &Database,
    master_key: &str,
    username: &str,
    profile: &IdentityProfile,
) -> Result<Identity, IdentityError> {
    #[cfg(feature = "admin")]
    {
        let mut entropy = [0u8; 32];
        rand::RngCore::fill_bytes(&mut rand::thread_rng(), &mut entropy);
        let mnemonic = bip39::Mnemonic::from_entropy(&entropy)
            .map_err(|e| IdentityError::KeyGenerationFailed(e.to_string()))?;
        return build_identity_from_phrase(db, &mnemonic, master_key, username, profile);
    }
    #[cfg(not(feature = "admin"))]
    {
        // SARAI watch-only identity: mock mnemonic via hash (no bip39) to satisfy containment (no bip39 on SARAI)
        use sha2::{Digest, Sha256};
        let mut entropy = [0u8; 32];
        rand::RngCore::fill_bytes(&mut rand::thread_rng(), &mut entropy);
        let hash = Sha256::digest(&entropy);
        let phrase = format!("sarai-mock-mnemonic-{}-{}", hex::encode(&hash[0..16]), master_key.len());
        // Build identity without bip39 type — use shared helper with string mnemonic
        return build_identity_from_phrase_mock(db, &phrase, master_key, username, profile);
    }
}

#[cfg(feature = "admin")]
pub fn build_identity_from_phrase(
    db: &Database,
    mnemonic: &bip39::Mnemonic,
    master_key: &str,
    username: &str,
    profile: &IdentityProfile,
) -> Result<Identity, IdentityError> {
    // Step 1: Keypair
    let (pub_bytes, priv_bytes) =
        generate_keypair().map_err(|e| IdentityError::KeyGenerationFailed(e.to_string()))?;

    // Step 2: Fingerprint
    let fp = device_fingerprint().map_err(|e| IdentityError::FingerprintFailed(e.to_string()))?;

    // Step 3: Encrypt private key (SHA256 hash of master_key as 32-byte key, XChaCha24)
    use sha2::{Digest, Sha256};
    let key: [u8; 32] = Sha256::digest(master_key.as_bytes()).into();
    let enc = encrypt(&key, &priv_bytes, NonceType::XChaCha24)
        .map_err(|e| IdentityError::EncryptionFailed(e.to_string()))?;
    let mut blob = enc.nonce;
    blob.extend_from_slice(&enc.ciphertext);
    let private_key_encrypted = B64.encode(&blob);

    // Step 4: Node ID — 7-digit numeric, UNIQUE per DB (regenerate on collision).
    // PERMANENT: once stored it is never re-generated; recovery restores the SAME id.
    let node_id = ensure_unique_node_id(db, &generate_node_id())?;

    // Step 5: Timestamps and hashes
    let created_at = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map_err(|_| IdentityError::TimestampFailed)?
        .as_secs() as i64;

    let id = Uuid::new_v4().to_string();
    let recovery_key_hash = generate_recovery_hash(&id, &fp.hash);
    let phrase_str = mnemonic.to_string();
    let recovery_phrase_hash = sha256_hex(phrase_str.as_bytes());
    // Permanent link: password (Argon2 of master_key) is bound to this node_id row.
    let password_hash = hash_password(master_key).map_err(IdentityError::KeyGenerationFailed)?;

    let identity = Identity {
        id,
        node_id,
        username: username.to_string(),
        first_name: profile.first_name.trim().to_string(),
        last_name: profile.last_name.trim().to_string(),
        date_of_birth: profile.date_of_birth.trim().to_string(),
        public_key: B64.encode(&pub_bytes),
        private_key_encrypted,
        fingerprint: fp.hash,
        recovery_key_hash,
        recovery_phrase_hash,
        password_hash,
        pin_hash: String::new(),
        created_at,
    };

    // Step 6: Validate
    validate_identity(&identity).map_err(|e| IdentityError::ValidationFailed(e.to_string()))?;

    // Step 7: Store
    insert_identity(db, &identity).map_err(|e| IdentityError::StorageFailed(e.to_string()))?;

    Ok(identity)
}

#[cfg(not(feature = "admin"))]
pub fn build_identity_from_phrase_mock(
    db: &Database,
    phrase_str: &str,
    master_key: &str,
    username: &str,
    profile: &IdentityProfile,
) -> Result<Identity, IdentityError> {
    let (pub_bytes, priv_bytes) =
        generate_keypair().map_err(|e| IdentityError::KeyGenerationFailed(e.to_string()))?;
    let fp = device_fingerprint().map_err(|e| IdentityError::FingerprintFailed(e.to_string()))?;
    use sha2::{Digest, Sha256};
    let key: [u8; 32] = Sha256::digest(master_key.as_bytes()).into();
    let enc = encrypt(&key, &priv_bytes, NonceType::XChaCha24)
        .map_err(|e| IdentityError::EncryptionFailed(e.to_string()))?;
    let mut blob = enc.nonce;
    blob.extend_from_slice(&enc.ciphertext);
    let private_key_encrypted = B64.encode(&blob);
    // Node ID UNIQUE per DB. PERMANENT: never regenerated on recovery — the seed
    // phrase restores exactly the same node_id (see recovery.rs).
    let node_id = ensure_unique_node_id(db, &generate_node_id())?;
    let created_at = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map_err(|_| IdentityError::TimestampFailed)?
        .as_secs() as i64;
    let id = Uuid::new_v4().to_string();
    let recovery_key_hash = generate_recovery_hash(&id, &fp.hash);
    let recovery_phrase_hash = sha256_hex(phrase_str.as_bytes());
    let password_hash = hash_password(master_key).map_err(IdentityError::KeyGenerationFailed)?;
    let identity = Identity {
        id,
        node_id,
        username: username.to_string(),
        first_name: profile.first_name.trim().to_string(),
        last_name: profile.last_name.trim().to_string(),
        date_of_birth: profile.date_of_birth.trim().to_string(),
        public_key: B64.encode(&pub_bytes),
        private_key_encrypted,
        fingerprint: fp.hash,
        recovery_key_hash,
        recovery_phrase_hash,
        password_hash,
        pin_hash: String::new(),
        created_at,
    };
    validate_identity(&identity).map_err(|e| IdentityError::ValidationFailed(e.to_string()))?;
    insert_identity(db, &identity).map_err(|e| IdentityError::StorageFailed(e.to_string()))?;
    Ok(identity)
}
