use serde::{Deserialize, Serialize};

pub const CHUNK_SIZE: usize = 1024 * 1024; // 1 MB

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VaultFileRecord {
    pub id: String,
    pub name: String,
    pub hash: String,
    pub encrypted: bool,
    pub size_bytes: i64,
    pub created_at: i64,
}

#[derive(Debug, Clone)]
pub struct ChunkMeta {
    pub index: usize,
    pub data: Vec<u8>,
    pub hash: String,
}
