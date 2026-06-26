use serde::{Deserialize, Serialize};

/// Final PINC ecosystem state — all engines integrated
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EcosystemStatus {
    pub phase: u8,
    pub network_nodes: u64,
    pub active_users: u64,
    pub total_storage_pb: f64,
    pub total_bandwidth_tbps: f64,
    pub active_jobs: u64,
    pub total_escrow_value: f64,
    pub messages_relayed_total: u64,
    pub active_tournaments: u64,
    pub ai_agents_running: u64,
    pub regions_active: Vec<String>,
    pub health: EcosystemHealth,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum EcosystemHealth {
    Healthy,
    Degraded,
    Critical,
    Recovering,
}

/// Cross-engine event that flows through the entire system
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SystemEvent {
    pub id: String,
    pub event_type: SystemEventType,
    pub source_module: String,
    pub payload: serde_json::Value,
    pub priority: EventPriority,
    pub created_at: i64,
    pub processed: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum SystemEventType {
    IdentityCreated,
    PeerConnected,
    PeerDisconnected,
    FileUploaded,
    FileDistributed,
    ChunkReplicated,
    MessageSent,
    MessageDelivered,
    CallStarted,
    CallEnded,
    JobCreated,
    JobCompleted,
    DisputeRaised,
    DisputeResolved,
    PaymentMade,
    EscrowLocked,
    EscrowReleased,
    WagerCreated,
    WagerCompleted,
    TournamentStarted,
    ReputationUpdated,
    AccountBurned,
    SecurityEvent,
    AiDecision,
    NodeJoined,
    NodeLeft,
    NodeBanned,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, PartialOrd)]
pub enum EventPriority {
    Low,
    Normal,
    High,
    Critical,
}

/// Plugin/extension hook system for ecosystem extensibility
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EcosystemPlugin {
    pub id: String,
    pub name: String,
    pub version: String,
    pub author_node_id: String,
    pub description: String,
    pub hooks: Vec<String>, // event types this plugin subscribes to
    pub enabled: bool,
    pub verified: bool,
    pub install_count: u64,
}

/// Cross-platform capability manifest
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PlatformCapabilities {
    pub platform: Platform,
    pub supports_quic: bool,
    pub supports_relay: bool,
    pub supports_vault: bool,
    pub supports_ai: bool,
    pub supports_video_calls: bool,
    pub max_storage_gb: f64,
    pub max_bandwidth_kbps: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum Platform {
    Linux,
    Windows,
    MacOs,
    Android,
    Ios,
    Console,
}
