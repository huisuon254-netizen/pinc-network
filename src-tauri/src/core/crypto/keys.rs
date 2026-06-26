use crate::core::crypto::errors::CryptoError;
use rand::RngCore;

pub fn generate_symmetric_key() -> [u8; 32] {
    let mut key = [0u8; 32];
    rand::thread_rng().fill_bytes(&mut key);
    key
}

pub fn generate_keypair() -> Result<(Vec<u8>, Vec<u8>), CryptoError> {
    use ed25519_dalek::SigningKey;
    let mut csprng = rand::thread_rng();
    let signing_key = SigningKey::generate(&mut csprng);
    let verifying_key = signing_key.verifying_key();
    Ok((
        verifying_key.to_bytes().to_vec(),
        signing_key.to_bytes().to_vec(),
    ))
}

pub fn validate_key_length(key: &[u8]) -> Result<(), CryptoError> {
    if key.len() != 32 {
        return Err(CryptoError::InvalidKeyLength {
            expected: 32,
            got: key.len(),
        });
    }
    Ok(())
}

pub fn derive_key_from_bytes(input: &[u8]) -> [u8; 32] {
    use sha2::{Digest, Sha256};
    let hash = Sha256::digest(input);
    let mut key = [0u8; 32];
    key.copy_from_slice(&hash);
    key
}
