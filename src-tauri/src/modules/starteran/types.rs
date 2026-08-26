use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StarteranStatus {
    pub sharing_active: bool,
    pub active_connections: u64,
    pub traffic_shared_gb: f64,
    pub earnings: f64,
    pub reliability_score: f64,
    pub approval_level: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ShareCode {
    pub code: String,
    pub created_at: i64,
    pub uses: u64,
    pub earnings_generated: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BandwidthRecord {
    pub peer_id: String,
    pub bytes_in: u64,
    pub bytes_out: u64,
    pub recorded_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SharedConnection {
    pub id: String,
    pub peer_node_id: String,
    pub connection_type: String,
    pub max_bandwidth: f64,
    pub used_bandwidth: f64,
    pub status: String,
    pub created_at: i64,
}
