use serde::{Deserialize, Serialize};
use std::sync::{Arc, Mutex};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PairingCode {
    pub code: String,
    pub node_id: String,
    pub address: String,
    pub public_key: String,
    pub created_at: i64,
    pub expires_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SharedConnection {
    pub id: String,
    pub peer_node_id: String,
    pub peer_address: String,
    pub connected_at: i64,
    pub messages_exchanged: u32,
    pub active: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NetShareStatus {
    pub sharing_active: bool,
    pub active_connections: u32,
    pub total_messages: u32,
    pub my_code: Option<String>,
}

pub struct NetShareEngine {
    active: bool,
    current_code: Option<PairingCode>,
    connections: Vec<SharedConnection>,
}

impl NetShareEngine {
    pub fn new() -> Self {
        Self {
            active: false,
            current_code: None,
            connections: Vec::new(),
        }
    }

    pub fn generate_code(
        &mut self,
        node_id: &str,
        address: &str,
        public_key: &str,
    ) -> PairingCode {
        let now = chrono::Utc::now().timestamp();
        let short_id: String = node_id.chars().take(8).collect();
        let part1 = &short_id[..4].to_uppercase();
        let part2 = &short_id[4..8].to_uppercase();
        let suffix: String = Uuid::new_v4().to_string()[..4].to_uppercase().chars().collect();
        let code = format!("PINC-{}-{}-{}", part1, part2, suffix);

        let pairing = PairingCode {
            code: code.clone(),
            node_id: node_id.to_string(),
            address: address.to_string(),
            public_key: public_key.to_string(),
            created_at: now,
            expires_at: now + 3600,
        };
        self.current_code = Some(pairing.clone());
        self.active = true;
        pairing
    }

    pub fn validate_code(&self, code: &str) -> Option<&PairingCode> {
        self.current_code.as_ref().filter(|c| {
            c.code == code && chrono::Utc::now().timestamp() < c.expires_at
        })
    }

    pub fn add_connection(&mut self, peer_node_id: &str, peer_address: &str) -> SharedConnection {
        let conn = SharedConnection {
            id: format!("sh-{}", Uuid::new_v4()),
            peer_node_id: peer_node_id.to_string(),
            peer_address: peer_address.to_string(),
            connected_at: chrono::Utc::now().timestamp(),
            messages_exchanged: 0,
            active: true,
        };
        self.connections.push(conn.clone());
        conn
    }

    pub fn remove_connection(&mut self, conn_id: &str) -> bool {
        if let Some(pos) = self.connections.iter().position(|c| c.id == conn_id) {
            self.connections.remove(pos);
            true
        } else {
            false
        }
    }

    pub fn active_connections(&self) -> Vec<&SharedConnection> {
        self.connections.iter().filter(|c| c.active).collect()
    }

    pub fn status(&self) -> NetShareStatus {
        let active_conns = self.connections.iter().filter(|c| c.active).count() as u32;
        let total_msgs = self.connections.iter().map(|c| c.messages_exchanged).sum();
        NetShareStatus {
            sharing_active: self.active,
            active_connections: active_conns,
            total_messages: total_msgs,
            my_code: self.current_code.as_ref().map(|c| c.code.clone()),
        }
    }

    pub fn set_active(&mut self, active: bool) {
        self.active = active;
        if !active {
            self.current_code = None;
        }
    }

    pub fn generate_qr_data(&self) -> Option<String> {
        self.current_code.as_ref().map(|c| c.code.clone())
    }
}
