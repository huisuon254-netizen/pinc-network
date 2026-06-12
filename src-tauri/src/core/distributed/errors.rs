use thiserror::Error;

#[derive(Debug, Error)]
pub enum DistributedError {
    #[error("Insufficient replicas: need {needed}, have {available}")]
    InsufficientReplicas { needed: usize, available: usize },
    #[error("No storage nodes available")]
    NoStorageNodes,
    #[error("Chunk not found: {0}")]
    ChunkNotFound(String),
    #[error("Integrity check failed for chunk: {0}")]
    IntegrityFailed(String),
    #[error("Upload failed: {0}")]
    UploadFailed(String),
    #[error("Download failed: {0}")]
    DownloadFailed(String),
    #[error("Replication failed: {0}")]
    ReplicationFailed(String),
    #[error("Storage contract error: {0}")]
    ContractError(String),
    #[error("Encoding error: {0}")]
    EncodingError(String),
    #[error("Node unreachable: {0}")]
    NodeUnreachable(String),
    #[error("Quota exceeded: used {used} of {limit} bytes")]
    QuotaExceeded { used: u64, limit: u64 },
}
