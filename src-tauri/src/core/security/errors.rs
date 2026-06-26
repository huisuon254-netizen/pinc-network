use thiserror::Error;
#[derive(Debug, Error)]
pub enum SecurityError {
    #[error("Rate limit exceeded for: {0}")]
    RateLimitExceeded(String),
    #[error("DDoS detected from: {0}")]
    DdosDetected(String),
    #[error("Malware detected: {0}")]
    MalwareDetected(String),
    #[error("Message too large: {0} bytes")]
    MessageTooLarge(u64),
    #[error("Certificate invalid")]
    CertInvalid,
    #[error("Sybil attack suspected")]
    SybilSuspected,
}
