use thiserror::Error;

#[derive(Debug, Error)]
pub enum CryptoError {
    #[error("Invalid nonce: expected {expected} bytes, got {got}")]
    InvalidNonce { expected: usize, got: usize },
    #[error("Encryption failed: {0}")]
    EncryptionFailed(String),
    #[error("Decryption failed")]
    DecryptionFailed,
    #[error("Key generation failed: {0}")]
    KeyGenerationFailed(String),
    #[error("Invalid key length: expected {expected}, got {got}")]
    InvalidKeyLength { expected: usize, got: usize },
}
