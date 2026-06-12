use thiserror::Error;

#[derive(Debug, Error)]
pub enum VaultError {
    #[error("Encryption failed: {0}")]
    EncryptionFailed(String),
    #[error("Decryption failed")]
    DecryptionFailed,
    #[error("Corrupt blob: {0}")]
    CorruptBlob(String),
    #[error("Integrity check failed")]
    IntegrityFailed,
    #[error("Storage write failed: {0}")]
    StorageWriteFailed(String),
    #[error("Storage read failed: {0}")]
    StorageReadFailed(String),
    #[error("Compression failed: {0}")]
    CompressionFailed(String),
    #[error("Chunk error: {0}")]
    ChunkError(String),
}
