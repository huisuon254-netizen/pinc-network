use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PeerInfo {
    pub id: String,
    pub address: String,
    pub public_key: String,
    pub latency_ms: u64,
    pub trust_score: f64,
    pub relay_score: f64,
    pub online: bool,
    pub last_seen: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NetworkStatus {
    pub online: bool,
    pub peer_count: usize,
    pub relay_count: usize,
    pub bandwidth_up_kbps: f64,
    pub bandwidth_down_kbps: f64,
    pub mesh_ready: bool,
    pub nat_traversal: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HandshakePayload {
    pub node_id: String,
    pub public_key: String,
    pub version: String,
    pub timestamp: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RelayRequest {
    pub from_node: String,
    pub to_node: String,
    pub payload: Vec<u8>,
    pub encrypted: bool,
}

#[derive(Debug, Clone)]
pub struct BandwidthStats {
    pub bytes_sent: u64,
    pub bytes_received: u64,
    pub kbps_up: f64,
    pub kbps_down: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DiscoveredPeer {
    pub address: String,
    pub node_id: String,
    pub public_key: String,
    pub source: PeerSource,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum PeerSource {
    Bootstrap,
    Dht,
    LocalScan,
    Manual,
    Relay,
}
