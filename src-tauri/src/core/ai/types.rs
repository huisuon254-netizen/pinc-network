use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum AgentType {
    Moderation,
    Routing,
    FraudDetection,
    ContentRecommendation,
    DisputeArbitration,
    AnomalyDetection,
    CachePredictor,
    BandwidthOptimizer,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AiAgent {
    pub id: String,
    pub agent_type: AgentType,
    pub name: String,
    pub active: bool,
    pub model_hash: Option<String>,
    pub version: String,
    pub accuracy: f64,
    pub inferences_run: u64,
    pub created_at: i64,
    pub last_run: Option<i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModerationResult {
    pub content_id: String,
    pub flagged: bool,
    pub confidence: f64,
    pub categories: Vec<ModerationCategory>,
    pub action: ModerationAction,
    pub reason: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum ModerationCategory {
    Spam, Fraud, HateSpeech, FakeWork, Malware, Illegal, Safe,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum ModerationAction { Allow, Warn, Remove, Ban, Escalate }

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FraudSignal {
    pub node_id: String,
    pub signal_type: FraudSignalType,
    pub confidence: f64,
    pub evidence: Vec<String>,
    pub detected_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum FraudSignalType {
    MultipleAccounts, FakeWork, PaymentFraud,
    RelayAbuse, SpamPosting, IdentitySpoof,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RouteRecommendation {
    pub from_node: String,
    pub to_node: String,
    pub recommended_relay: String,
    pub expected_latency_ms: u64,
    pub expected_bandwidth_kbps: f64,
    pub confidence: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CachePrediction {
    pub file_id: String,
    pub predicted_access_count: u64,
    pub cache_priority: f64,
    pub predicted_next_access: Option<i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DistributedModelShard {
    pub shard_id: String,
    pub model_id: String,
    pub node_id: String,
    pub shard_index: usize,
    pub total_shards: usize,
    pub size_bytes: u64,
    pub hash: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InferenceRequest {
    pub id: String,
    pub agent_type: AgentType,
    pub input: serde_json::Value,
    pub priority: u8,
    pub created_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InferenceResult {
    pub request_id: String,
    pub output: serde_json::Value,
    pub confidence: f64,
    pub model_version: String,
    pub elapsed_ms: u64,
    pub node_id: String,
}
