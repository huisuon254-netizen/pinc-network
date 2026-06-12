use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Identity {
    pub id: String,
    pub node_id: String,
    pub public_key: String,
    pub private_key_encrypted: String,
    pub fingerprint: String,
    pub recovery_key_hash: String,
    pub recovery_phrase_hash: String,
    pub created_at: i64,
}
