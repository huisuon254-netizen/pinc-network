use rand::RngCore;
use crate::core::crypto::{errors::CryptoError, types::NonceType};

pub fn generate_nonce(kind: &NonceType) -> Vec<u8> {
    let mut nonce = vec![0u8; kind.size()];
    rand::thread_rng().fill_bytes(&mut nonce);
    nonce
}

pub fn validate_nonce(nonce: &[u8], kind: &NonceType) -> Result<(), CryptoError> {
    let expected = kind.size();
    if nonce.len() != expected {
        return Err(CryptoError::InvalidNonce { expected, got: nonce.len() });
    }
    Ok(())
}
