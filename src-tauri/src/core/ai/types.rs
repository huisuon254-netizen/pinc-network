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
    Whisper,
    Llama,
    OnnxSegmentation,
    Tts,
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

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LlamaParams {
    pub model: String,
    pub context_size: usize,
    pub seed: u64,
    pub temperature: f32,
    pub top_p: f32,
    pub top_k: i32,
    pub repeat_penalty: f32,
    pub presence_penalty: f32,
    pub frequency_penalty: f32,
    pub max_tokens: usize,
    pub stop_sequences: Vec<String>,
}

impl Default for LlamaParams {
    fn default() -> Self {
        Self {
            model: "llama-2-7b".to_string(),
            context_size: 4096,
            seed: 1234,
            temperature: 0.7,
            top_p: 0.9,
            top_k: 40,
            repeat_penalty: 1.1,
            presence_penalty: 0.0,
            frequency_penalty: 0.0,
            max_tokens: 512,
            stop_sequences: vec!["".to_string()],
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TtsParams {
    pub voice_id: String,
    pub speed: f32,
    pub pitch: f32,
    pub volume: f32,
    pub format: String,
}

impl Default for TtsParams {
    fn default() -> Self {
        Self {
            voice_id: "default".to_string(),
            speed: 1.0,
            pitch: 1.0,
            volume: 1.0,
            format: "wav".to_string(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModelInfo {
    pub id: String,
    pub path: String,
    pub params: LlamaParams,
    pub loaded_at: i64,
    pub usage_count: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModelData {
    pub id: String,
    pub path: String,
    pub data: Vec<u8>,
    pub size_bytes: u64,
    pub loaded_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VoiceProfile {
    pub id: String,
    pub name: String,
    pub audio_samples: Vec<Vec<f32>>,
    pub embedding: Vec<f32>,
    pub created_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ImageSegmentation {
    pub bounding_boxes: Vec<BoundingBox>,
    pub segmentation_masks: Vec<Mask>,
    pub confidence_scores: Vec<f32>,
    pub class_ids: Vec<u32>,
    pub class_labels: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BoundingBox {
    pub x1: f32,
    pub y1: f32,
    pub x2: f32,
    pub y2: f32,
    pub confidence: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Mask {
    pub data: Vec<f32>,
    pub width: u32,
    pub height: u32,
}