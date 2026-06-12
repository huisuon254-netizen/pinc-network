use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RoutingTable {
    pub node_id: String,
    pub routes: Vec<Route>,
    pub updated_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Route {
    pub destination: String,
    pub next_hop: String,
    pub hops: u8,
    pub latency_ms: u64,
    pub bandwidth_kbps: f64,
    pub reliability: f64,
    pub last_verified: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MultiHopPath {
    pub source: String,
    pub destination: String,
    pub hops: Vec<String>,
    pub total_latency_ms: u64,
    pub min_bandwidth_kbps: f64,
    pub reliability: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RegionConfig {
    pub region_id: String,
    pub name: String,
    pub seed_nodes: Vec<String>,
    pub load: f64,
    pub node_count: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NatTraversalConfig {
    pub stun_servers: Vec<String>,
    pub turn_servers: Vec<String>,
    pub ice_candidates: Vec<String>,
    pub upnp_enabled: bool,
    pub nat_type: NatType,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum NatType { Open, FullCone, RestrictedCone, PortRestricted, Symmetric }

impl Default for NatTraversalConfig {
    fn default() -> Self {
        NatTraversalConfig {
            stun_servers: vec!["stun.pinc.network:3478".to_string()],
            turn_servers: vec!["turn.pinc.network:3478".to_string()],
            ice_candidates: Vec::new(),
            upnp_enabled: true,
            nat_type: NatType::Unknown,
        }
    }
}

// Allow unknown NAT type during detection
impl NatType {
    const Unknown: NatType = NatType::PortRestricted; // fallback
}
