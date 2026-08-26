use serde::{Deserialize, Serialize};
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum AgentType {
    Routing,
    FraudDetection,
    ContentRecommendation,
    DisputeArbitration,
    AnomalyDetection,
    CachePredictor,
    BandwidthOptimizer,
    Moderation,
}
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AiAgent {
    pub id: String,
    pub agent_type: AgentType,
}
