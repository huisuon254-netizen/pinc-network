use thiserror::Error;

#[derive(Debug, Error)]
pub enum IdentityError {
    #[error("Key generation failed: {0}")]
    KeyGenerationFailed(String),
    #[error("Fingerprint failed: {0}")]
    FingerprintFailed(String),
    #[error("Encryption failed: {0}")]
    EncryptionFailed(String),
    #[error("Validation failed: {0}")]
    ValidationFailed(String),
    #[error("Storage failed: {0}")]
    StorageFailed(String),
    #[error("Timestamp error")]
    TimestampFailed,
    #[error("Not found")]
    NotFound,
    #[error("Recovery failed: {0}")]
    RecoveryFailed(String),
}
