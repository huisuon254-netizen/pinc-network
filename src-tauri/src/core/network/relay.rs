use crate::core::network::{errors::NetworkError, types::RelayRequest};
use std::{
    collections::HashMap,
    sync::{Arc, Mutex},
    time::{SystemTime, UNIX_EPOCH},
};

pub const DEFAULT_BANDWIDTH_CAP_KBPS: f64 = 10_000.0; // 10 Mbps default cap

#[derive(Debug, Clone)]
pub struct RelaySession {
    pub session_id: String,
    pub from_node: String,
    pub to_node: String,
    pub bytes_relayed: u64,
    pub started_at: i64,
    pub active: bool,
}

pub struct RelayManager {
    sessions: Arc<Mutex<HashMap<String, RelaySession>>>,
    bandwidth_cap_kbps: f64,
    total_bytes_relayed: Arc<Mutex<u64>>,
}

impl RelayManager {
    pub fn new(bandwidth_cap_kbps: f64) -> Self {
        RelayManager {
            sessions: Arc::new(Mutex::new(HashMap::new())),
            bandwidth_cap_kbps,
            total_bytes_relayed: Arc::new(Mutex::new(0)),
        }
    }

    pub fn open_session(&self, from: &str, to: &str) -> String {
        let id = uuid::Uuid::new_v4().to_string();
        let session = RelaySession {
            session_id: id.clone(),
            from_node: from.to_string(),
            to_node: to.to_string(),
            bytes_relayed: 0,
            started_at: now_secs(),
            active: true,
        };
        self.sessions.lock().unwrap().insert(id.clone(), session);
        id
    }

    pub fn record_relay(&self, session_id: &str, bytes: u64) -> Result<(), NetworkError> {
        let mut sessions = self.sessions.lock().unwrap();
        let session = sessions.get_mut(session_id).ok_or_else(|| {
            NetworkError::RelayFailed(format!("session {} not found", session_id))
        })?;
        session.bytes_relayed += bytes;
        *self.total_bytes_relayed.lock().unwrap() += bytes;
        Ok(())
    }

    pub fn close_session(&self, session_id: &str) {
        let mut sessions = self.sessions.lock().unwrap();
        if let Some(s) = sessions.get_mut(session_id) {
            s.active = false;
        }
    }

    pub fn total_bytes(&self) -> u64 {
        *self.total_bytes_relayed.lock().unwrap()
    }

    pub fn active_sessions(&self) -> Vec<RelaySession> {
        self.sessions
            .lock()
            .unwrap()
            .values()
            .filter(|s| s.active)
            .cloned()
            .collect()
    }

    pub fn bandwidth_cap_kbps(&self) -> f64 {
        self.bandwidth_cap_kbps
    }
}

impl Default for RelayManager {
    fn default() -> Self {
        Self::new(DEFAULT_BANDWIDTH_CAP_KBPS)
    }
}

/// Validate a relay request before forwarding
pub fn validate_relay_request(req: &RelayRequest) -> Result<(), NetworkError> {
    if req.from_node.is_empty() {
        return Err(NetworkError::RelayFailed("empty from_node".to_string()));
    }
    if req.to_node.is_empty() {
        return Err(NetworkError::RelayFailed("empty to_node".to_string()));
    }
    if req.payload.is_empty() {
        return Err(NetworkError::RelayFailed("empty payload".to_string()));
    }
    if req.payload.len() > 16 * 1024 * 1024 {
        return Err(NetworkError::RelayFailed(
            "payload exceeds 16MB relay limit".to_string(),
        ));
    }
    Ok(())
}

fn now_secs() -> i64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs() as i64
}
