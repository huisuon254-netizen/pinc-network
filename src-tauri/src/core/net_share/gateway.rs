use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use std::time::{SystemTime, UNIX_EPOCH};
use serde::{Deserialize, Serialize};

use crate::core::database::connection::Database;
use rusqlite::params;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GatewayConfig {
    pub listening_port: u16,
    pub max_connections: u32,
    pub bandwidth_limit_mbps: f64,
    pub active: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GatewaySession {
    pub session_id: String,
    pub source_node: String,
    pub destination_node: String,
    pub bytes_routed: u64,
    pub started_at: i64,
    pub active: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RoutingStats {
    pub total_bytes_routed: u64,
    pub active_sessions: u32,
    pub total_sessions: u32,
    pub connections_served: u32,
}

pub struct NetworkGateway {
    config: Option<GatewayConfig>,
    sessions: HashMap<String, GatewaySession>,
    total_bytes_routed: u64,
    connections_served: u32,
    db: Option<Arc<Mutex<Database>>>,
}

impl NetworkGateway {
    pub fn new() -> Self {
        Self {
            config: None,
            sessions: HashMap::new(),
            total_bytes_routed: 0,
            connections_served: 0,
            db: None,
        }
    }

    pub fn with_db(db: Arc<Mutex<Database>>) -> Self {
        Self {
            config: None,
            sessions: HashMap::new(),
            total_bytes_routed: 0,
            connections_served: 0,
            db: Some(db),
        }
    }

    pub fn set_db(&mut self, db: Arc<Mutex<Database>>) {
        self.db = Some(db);
    }

    pub fn configure_gateway(&mut self, listening_port: u16) -> GatewayConfig {
        let config = GatewayConfig {
            listening_port,
            max_connections: 50,
            bandwidth_limit_mbps: 10.0,
            active: true,
        };
        self.config = Some(config.clone());
        config
    }

    pub fn accept_connection(&mut self, peer_id: &str, source_node: &str) -> Option<GatewaySession> {
        if let Some(ref config) = self.config {
            if !config.active {
                return None;
            }
            let active_count = self.sessions.values().filter(|s| s.active).count() as u32;
            if active_count >= config.max_connections {
                return None;
            }
        }

        let now = now_secs();
        let session_id = format!("gw-{}", uuid::Uuid::new_v4());
        let session = GatewaySession {
            session_id: session_id.clone(),
            source_node: source_node.to_string(),
            destination_node: peer_id.to_string(),
            bytes_routed: 0,
            started_at: now,
            active: true,
        };

        self.sessions.insert(session_id.clone(), session.clone());
        self.connections_served += 1;

        if let Some(ref db) = self.db {
            let db_guard = db.lock().unwrap();
            let conn_guard = db_guard.conn.lock().unwrap();
            let _ = conn_guard.execute(
                "INSERT OR REPLACE INTO shared_connections (id, peer_node_id, peer_address, peer_public_key, connected_at, messages_exchanged, active)
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
                params![
                    session_id,
                    peer_id,
                    "",
                    "",
                    now,
                    0i64,
                    1i64,
                ],
            );
        }

        Some(session)
    }

    pub fn route_traffic(
        &mut self,
        source: &str,
        destination: &str,
        data_size: usize,
    ) -> Result<u64, String> {
        let bytes = data_size as u64;
        self.total_bytes_routed += bytes;

        let session_id = self.sessions.values()
            .find(|s| s.active && s.source_node == source && s.destination_node == destination)
            .map(|s| s.session_id.clone());

        if let Some(id) = session_id {
            if let Some(session) = self.sessions.get_mut(&id) {
                session.bytes_routed += bytes;
            }
        }

        Ok(bytes)
    }

    pub fn close_session(&mut self, session_id: &str) -> bool {
        if let Some(session) = self.sessions.get_mut(session_id) {
            session.active = false;

            if let Some(ref db) = self.db {
                let db_guard = db.lock().unwrap();
                let conn_guard = db_guard.conn.lock().unwrap();
                let _ = conn_guard.execute(
                    "UPDATE shared_connections SET active = 0 WHERE id = ?1",
                    params![session_id],
                );
            }
            true
        } else {
            false
        }
    }

    pub fn routing_stats(&self) -> RoutingStats {
        let active_sessions = self.sessions.values().filter(|s| s.active).count() as u32;
        let total_sessions = self.sessions.len() as u32;
        RoutingStats {
            total_bytes_routed: self.total_bytes_routed,
            active_sessions,
            total_sessions,
            connections_served: self.connections_served,
        }
    }

    pub fn session_bytes(&self, session_id: &str) -> u64 {
        self.sessions.get(session_id).map_or(0, |s| s.bytes_routed)
    }

    pub fn active_sessions(&self) -> Vec<&GatewaySession> {
        self.sessions.values().filter(|s| s.active).collect()
    }

    pub fn is_active(&self) -> bool {
        self.config.as_ref().map_or(false, |c| c.active)
    }
}

impl Default for NetworkGateway {
    fn default() -> Self {
        Self::new()
    }
}

fn now_secs() -> i64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs() as i64
}
