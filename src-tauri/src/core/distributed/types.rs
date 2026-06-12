use serde::{Deserialize, Serialize};

/// A file distributed across the PINC mesh
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DistributedFile {
    pub id: String,
    pub owner_id: String,
    pub name: String,
    pub total_size: u64,
    pub total_chunks: usize,
    pub replication_factor: usize,
    pub hash: String,
    pub encrypted: bool,
    pub created_at: i64,
    pub status: DistributedFileStatus,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum DistributedFileStatus {
    Uploading,
    Distributing,
    Available,
    Degraded,   // some replicas missing
    Recovering,
    Deleted,
}

/// A single encrypted chunk stored on a node
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DistributedChunk {
    pub id: String,
    pub file_id: String,
    pub chunk_index: usize,
    pub size: u64,
    pub hash: String,
    pub replicas: Vec<ChunkReplica>,
}

/// One replica of a chunk on a specific node
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChunkReplica {
    pub chunk_id: String,
    pub node_id: String,
    pub address: String,
    pub verified: bool,
    pub stored_at: i64,
    pub last_verified: i64,
}

/// Storage node participating in distributed vault
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StorageNode {
    pub id: String,
    pub address: String,
    pub free_space_bytes: u64,
    pub used_space_bytes: u64,
    pub reputation: f64,
    pub uptime_pct: f64,
    pub online: bool,
    pub last_seen: i64,
    pub chunks_hosted: u64,
}

/// Storage allocation contract between two nodes
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StorageContract {
    pub id: String,
    pub provider_node_id: String,
    pub consumer_node_id: String,
    pub bytes_allocated: u64,
    pub price_per_gb_per_day: f64,
    pub expires_at: i64,
    pub active: bool,
}

/// Result of a file retrieval operation
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RetrievalResult {
    pub file_id: String,
    pub success: bool,
    pub chunks_fetched: usize,
    pub chunks_failed: usize,
    pub data: Option<Vec<u8>>,
    pub integrity_verified: bool,
    pub elapsed_ms: u64,
}

pub const DEFAULT_REPLICATION_FACTOR: usize = 3;
pub const MIN_REPLICATION_FACTOR: usize = 1;
pub const MAX_REPLICATION_FACTOR: usize = 10;
pub const CHUNK_SIZE_BYTES: usize = 8 * 1024 * 1024; // 8 MB for distributed
