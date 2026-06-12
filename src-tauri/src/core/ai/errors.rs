use thiserror::Error;
#[derive(Debug, Error)]
pub enum AiError {
    #[error("Agent not found: {0}")] AgentNotFound(String),
    #[error("Model not loaded: {0}")] ModelNotLoaded(String),
    #[error("Inference failed: {0}")] InferenceFailed(String),
    #[error("Shard missing: {shard_index} of {total}")] ShardMissing { shard_index: usize, total: usize },
    #[error("Confidence too low: {confidence:.2} < {threshold:.2}")] LowConfidence { confidence: f64, threshold: f64 },
    #[error("Rate limit exceeded")] RateLimited,
    #[error("Input validation failed: {0}")] InvalidInput(String),
    #[error("Distributed inference failed: {0}")] DistributedFailed(String),
}
