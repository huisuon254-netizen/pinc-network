use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HealthStatus {
    pub overall: String,
    pub cpu_ok: bool,
    pub memory_ok: bool,
    pub storage_ok: bool,
    pub network_ok: bool,
    pub crypto_ok: bool,
    pub database_ok: bool,
}

impl Default for HealthStatus {
    fn default() -> Self {
        HealthStatus {
            overall: "OK".to_string(),
            cpu_ok: true,
            memory_ok: true,
            storage_ok: true,
            network_ok: false,
            crypto_ok: true,
            database_ok: true,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct NodeMetrics {
    pub uptime_seconds: u64,
    pub messages_relayed: u64,
    pub bytes_relayed: u64,
    pub identity_checks: u64,
    pub vault_operations: u64,
    pub peer_connections: u64,
}
