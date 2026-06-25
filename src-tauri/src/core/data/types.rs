use serde::{Deserialize, Serialize};
use std::path::PathBuf;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DataPaths {
    pub base: PathBuf,
    pub db: PathBuf,
    pub vault: PathBuf,
    pub models: PathBuf,
    pub cache: PathBuf,
    pub logs: PathBuf,
    pub config: PathBuf,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModelInfo {
    pub name: String,
    pub path: PathBuf,
    pub size_bytes: u64,
    pub model_type: String,
    pub version: String,
    pub downloaded_at: Option<i64>,
    pub last_used: Option<i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CacheEntry {
    pub key: String,
    pub path: PathBuf,
    pub size_bytes: u64,
    pub created_at: i64,
    pub expires_at: Option<i64>,
    pub access_count: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DataStats {
    pub total_size_bytes: u64,
    pub db_size_bytes: u64,
    pub vault_size_bytes: u64,
    pub models_size_bytes: u64,
    pub cache_size_bytes: u64,
    pub logs_size_bytes: u64,
    pub model_count: usize,
    pub cache_entry_count: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RetentionPolicy {
    pub max_cache_size_bytes: u64,
    pub max_log_age_days: u64,
    pub max_cache_age_secs: u64,
    pub auto_cleanup_enabled: bool,
}

impl Default for RetentionPolicy {
    fn default() -> Self {
        Self {
            max_cache_size_bytes: 500 * 1024 * 1024, // 500 MB
            max_log_age_days: 30,
            max_cache_age_secs: 7 * 24 * 60 * 60, // 7 days
            auto_cleanup_enabled: true,
        }
    }
}
