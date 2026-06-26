use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SecurityEvent {
    pub id: String,
    pub event_type: SecurityEventType,
    pub severity: Severity,
    pub source_node: Option<String>,
    pub description: String,
    pub mitigated: bool,
    pub detected_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum SecurityEventType {
    DdosAttempt,
    RelayAbuse,
    IdentitySpoofing,
    MalwareDetected,
    AnomalousTraffic,
    BruteForce,
    DataExfiltration,
    SqlInjection,
    CertificateAnomaly,
    SybilAttack,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, PartialOrd)]
pub enum Severity {
    Low,
    Medium,
    High,
    Critical,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DdosProtection {
    pub enabled: bool,
    pub rate_limit_per_sec: u64,
    pub block_threshold: u64,
    pub blocked_ips: Vec<String>,
    pub auto_unblock_secs: Option<u64>,
}

impl Default for DdosProtection {
    fn default() -> Self {
        DdosProtection {
            enabled: true,
            rate_limit_per_sec: 1000,
            block_threshold: 5000,
            blocked_ips: Vec::new(),
            auto_unblock_secs: Some(3600),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AbuseReport {
    pub id: String,
    pub reporter_id: String,
    pub target_id: String,
    pub category: AbuseCategory,
    pub description: String,
    pub evidence_hashes: Vec<String>,
    pub status: AbuseStatus,
    pub created_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum AbuseCategory {
    Spam,
    Fraud,
    Harassment,
    IllegalContent,
    RelayAbuse,
    IdentityFraud,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum AbuseStatus {
    Pending,
    UnderReview,
    ActionTaken,
    Dismissed,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HardeningConfig {
    pub min_tls_version: String,
    pub require_cert_pinning: bool,
    pub max_message_size_kb: u64,
    pub rate_limits_enabled: bool,
    pub audit_log_enabled: bool,
    pub anomaly_detection: bool,
}

impl Default for HardeningConfig {
    fn default() -> Self {
        HardeningConfig {
            min_tls_version: "TLS1.3".to_string(),
            require_cert_pinning: true,
            max_message_size_kb: 64,
            rate_limits_enabled: true,
            audit_log_enabled: true,
            anomaly_detection: true,
        }
    }
}
