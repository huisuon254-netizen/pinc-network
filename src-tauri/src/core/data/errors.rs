use thiserror::Error;

#[derive(Debug, Error)]
pub enum DataError {
    #[error("IO error: {0}")]
    Io(String),
    #[error("Model not found: {0}")]
    ModelNotFound(String),
    #[error("Model download failed: {0}")]
    DownloadFailed(String),
    #[error("Cache key not found: {0}")]
    CacheMiss(String),
    #[error("Cache full: {current} >= {max}")]
    CacheFull { current: u64, max: u64 },
    #[error("Serialization failed: {0}")]
    Serialization(String),
    #[error("Data integrity check failed: {0}")]
    IntegrityFailed(String),
    #[error("Path error: {0}")]
    PathError(String),
}
