use base64::{engine::general_purpose::STANDARD as B64, Engine};
use std::time::{SystemTime, UNIX_EPOCH};
use uuid::Uuid;

use crate::core::{
    crypto::{cipher::encrypt, keys::generate_keypair, hash::sha256_hex, types::NonceType},
    database::{connection::Database, queries::insert_identity},
    identity::{
        errors::IdentityError,
        fingerprint::device_fingerprint,
        recovery::generate_recovery_hash,
        types::Identity,
        validator::validate_identity,
    },
};

pub fn create_identity(db: &Database, master_key: &[u8; 32], username: &str) -> Result<Identity, IdentityError> {
    let mut entropy = [0u8; 32];
    rand::RngCore::fill_bytes(&mut rand::thread_rng(), &mut entropy);
    let mnemonic = bip39::Mnemonic::from_entropy(&entropy)
        .map_err(|e| IdentityError::KeyGenerationFailed(e.to_string()))?;
    build_identity_from_phrase(db, &mnemonic, master_key, username)
}

pub fn build_identity_from_phrase(
    db: &Database,
    mnemonic: &bip39::Mnemonic,
    master_key: &[u8; 32],
    username: &str,
) -> Result<Identity, IdentityError> {
    // Step 1: Keypair
    let (pub_bytes, priv_bytes) = generate_keypair()
        .map_err(|e| IdentityError::KeyGenerationFailed(e.to_string()))?;

    // Step 2: Fingerprint
    let fp = device_fingerprint()
        .map_err(|e| IdentityError::FingerprintFailed(e.to_string()))?;

    // Step 3: Encrypt private key (XChaCha24 — 24-byte nonce, AEAD)
    let enc = encrypt(master_key, &priv_bytes, NonceType::XChaCha24)
        .map_err(|e| IdentityError::EncryptionFailed(e.to_string()))?;
    let mut blob = enc.nonce;
    blob.extend_from_slice(&enc.ciphertext);
    let private_key_encrypted = B64.encode(&blob);

    // Step 4: Node ID — 7-character alphanumeric (base36 encoded random bytes)
    let mut id_bytes = [0u8; 5];
    rand::RngCore::fill_bytes(&mut rand::thread_rng(), &mut id_bytes);
    let id_num = u64::from_be_bytes({
        let mut buf = [0u8; 8];
        buf[3..].copy_from_slice(&id_bytes);
        buf
    });
    let node_id = format!("{:07}", id_num % 10_000_000);

    // Step 5: Timestamps and hashes
    let created_at = SystemTime::now().duration_since(UNIX_EPOCH)
        .map_err(|_| IdentityError::TimestampFailed)?.as_secs() as i64;

    let id = Uuid::new_v4().to_string();
    let recovery_key_hash = generate_recovery_hash(&id, &fp.hash);
    let phrase_str = mnemonic.to_string();
    let recovery_phrase_hash = sha256_hex(phrase_str.as_bytes());

    let identity = Identity {
        id,
        node_id,
        username: username.to_string(),
        public_key: B64.encode(&pub_bytes),
        private_key_encrypted,
        fingerprint: fp.hash,
        recovery_key_hash,
        recovery_phrase_hash,
        created_at,
    };

    // Step 6: Validate
    validate_identity(&identity)
        .map_err(|e| IdentityError::ValidationFailed(e.to_string()))?;

    // Step 7: Store
    insert_identity(db, &identity)
        .map_err(|e| IdentityError::StorageFailed(e.to_string()))?;

    Ok(identity)
}
