use sha3::{Sha3_256, Digest};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct KingsmanStatus {
    pub is_active: bool,
    pub permissions_level: u32,
    pub session_id: String,
}

pub struct KingsmanEngine {
    master_hash: String, // SHA3 hash of the one-time master code
    is_authenticated: bool,
}

impl KingsmanEngine {
    pub fn new(master_hash: &str) -> Self {
        KingsmanEngine {
            master_hash: master_hash.to_string(),
            is_authenticated: false,
        }
    }

    pub fn activate(&mut self, code: &str) -> bool {
        let mut hasher = Sha3_256::new();
        hasher.update(code.as_bytes());
        let result = format!("{:x}", hasher.finalize());

        if result == self.master_hash {
            self.is_authenticated = true;
            true
        } else {
            false
        }
    }

    pub fn status(&self) -> KingsmanStatus {
        KingsmanStatus {
            is_active: self.is_authenticated,
            permissions_level: if self.is_authenticated { 4 } else { 0 },
            session_id: if self.is_authenticated { "KM-SESSION-ACTIVE".to_string() } else { "NONE".to_string() },
        }
    }
}
