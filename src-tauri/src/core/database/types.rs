use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DbStats {
    pub identity_count: i64,
    pub vault_file_count: i64,
    pub peer_count: i64,
    pub message_count: i64,
}
