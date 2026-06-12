use crate::core::{
    crypto::{cipher::{encrypt, decrypt, EncryptedData}, types::NonceType},
    vault::errors::VaultError,
};

/// Encrypt bytes → [24-byte nonce | ciphertext+tag]
pub fn vault_encrypt(key: &[u8; 32], data: &[u8]) -> Result<Vec<u8>, VaultError> {
    let enc = encrypt(key, data, NonceType::XChaCha24)
        .map_err(|e| VaultError::EncryptionFailed(e.to_string()))?;
    let mut blob = enc.nonce;
    blob.extend_from_slice(&enc.ciphertext);
    Ok(blob)
}

/// Decrypt a vault blob (nonce prepended).
pub fn vault_decrypt(key: &[u8; 32], blob: &[u8]) -> Result<Vec<u8>, VaultError> {
    if blob.len() < 25 {
        return Err(VaultError::CorruptBlob(format!("too short: {} bytes", blob.len())));
    }
    let (nonce_bytes, ciphertext_bytes) = blob.split_at(24);
    let enc = EncryptedData {
        nonce: nonce_bytes.to_vec(),
        ciphertext: ciphertext_bytes.to_vec(),
    };
    decrypt(key, &enc, NonceType::XChaCha24)
        .map_err(|_| VaultError::DecryptionFailed)
}
