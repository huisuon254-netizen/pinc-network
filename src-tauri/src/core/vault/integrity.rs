use crate::core::{crypto::hash::sha256_hex, vault::errors::VaultError};

pub fn compute_hash(data: &[u8]) -> String {
    sha256_hex(data)
}

pub fn verify_integrity(data: &[u8], expected: &str) -> Result<(), VaultError> {
    if sha256_hex(data) != expected {
        Err(VaultError::IntegrityFailed)
    } else {
        Ok(())
    }
}
