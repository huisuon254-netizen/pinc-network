use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MeshConfig {
    pub max_peers: usize,
    pub relay_enabled: bool,
    pub bandwidth_cap_kbps: f64,
    pub nat_traversal: bool,
}

impl Default for MeshConfig {
    fn default() -> Self {
        MeshConfig { max_peers: 50, relay_enabled: true, bandwidth_cap_kbps: 10_000.0, nat_traversal: true }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MeshStatus {
    pub peer_count: usize,
    pub relay_count: usize,
    pub ready: bool,
    pub phase: String,
}

impl Default for MeshStatus {
    fn default() -> Self {
        MeshStatus { peer_count: 0, relay_count: 0, ready: false, phase: "Phase 3 — Transport Ready".to_string() }
    }
}
