use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NodeStatus {
    pub node_id: Option<String>,
    pub online: bool,
    pub peer_count: usize,
    pub relay_active: bool,
    pub uptime_seconds: u64,
    pub version: String,
}

impl Default for NodeStatus {
    fn default() -> Self {
        NodeStatus {
            node_id: None,
            online: false,
            peer_count: 0,
            relay_active: false,
            uptime_seconds: 0,
            version: env!("CARGO_PKG_VERSION").to_string(),
        }
    }
}
