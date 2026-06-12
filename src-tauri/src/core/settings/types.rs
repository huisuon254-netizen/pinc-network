use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PincSettings {
    pub theme: String,
    pub language: String,
    pub relay_enabled: bool,
    pub bandwidth_cap_kbps: f64,
    pub vault_auto_compress: bool,
    pub vault_auto_encrypt: bool,
    pub notifications_enabled: bool,
    pub telemetry_enabled: bool,
    pub network_port: u16,
    pub max_peers: usize,
    pub storage_limit_gb: f64,
    pub auto_backup: bool,
}

impl Default for PincSettings {
    fn default() -> Self {
        PincSettings {
            theme: "dark-cyber".to_string(),
            language: "en".to_string(),
            relay_enabled: true,
            bandwidth_cap_kbps: 10_000.0,
            vault_auto_compress: true,
            vault_auto_encrypt: true,
            notifications_enabled: true,
            telemetry_enabled: false,
            network_port: 9000,
            max_peers: 50,
            storage_limit_gb: 10.0,
            auto_backup: false,
        }
    }
}
