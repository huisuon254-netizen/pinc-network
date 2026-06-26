use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BootstrapNode {
    pub id: String,
    pub address: String,
    pub region: String,
    pub public_key: String,
    pub active: bool,
    pub latency_ms: Option<u64>,
    pub node_count_served: u64,
    pub uptime_pct: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DnsRecord {
    pub name: String,
    pub record_type: DnsRecordType,
    pub value: String,
    pub ttl: u32,
    pub signed: bool,
    pub signature: Option<Vec<u8>>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum DnsRecordType {
    A,
    AAAA,
    TXT,
    SRV,
    PINC,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GlobalNetworkState {
    pub total_nodes: u64,
    pub active_nodes: u64,
    pub total_peers: u64,
    pub total_storage_gb: f64,
    pub used_storage_gb: f64,
    pub total_bandwidth_tbps: f64,
    pub regions: Vec<String>,
    pub snapshot_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EmergencyRecovery {
    pub trigger: RecoveryTrigger,
    pub fallback_nodes: Vec<String>,
    pub last_snapshot: i64,
    pub recovery_phrase: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum RecoveryTrigger {
    MajorOutage,
    PartitionEvent,
    Censorship,
    Manual,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LoadBalancer {
    pub regions: Vec<RegionLoad>,
    pub global_threshold: f64,
    pub rebalance_interval_secs: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RegionLoad {
    pub region_id: String,
    pub current_load: f64,
    pub node_count: u64,
    pub capacity_tbps: f64,
}
