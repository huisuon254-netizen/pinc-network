use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use std::time::{SystemTime, UNIX_EPOCH};
use serde::{Deserialize, Serialize};

use crate::core::database::connection::Database;
use rusqlite::params;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SharingSession {
    pub node_id: String,
    pub bandwidth_limit_mbps: f64,
    pub started_at: i64,
    pub active: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BandwidthUsage {
    pub provider_id: String,
    pub consumer_id: String,
    pub bytes_transferred: u64,
    pub recorded_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UsageStats {
    pub total_bytes_shared: u64,
    pub active_consumers: u32,
    pub hours_active: f64,
    pub estimated_earnings: f64,
}

pub struct BandwidthShareEngine {
    session: Option<SharingSession>,
    usage_log: Vec<BandwidthUsage>,
    consumer_bytes: HashMap<String, u64>,
    db: Option<Arc<Mutex<Database>>>,
}

impl BandwidthShareEngine {
    pub fn new() -> Self {
        Self {
            session: None,
            usage_log: Vec::new(),
            consumer_bytes: HashMap::new(),
            db: None,
        }
    }

    pub fn with_db(db: Arc<Mutex<Database>>) -> Self {
        Self {
            session: None,
            usage_log: Vec::new(),
            consumer_bytes: HashMap::new(),
            db: Some(db),
        }
    }

    pub fn set_db(&mut self, db: Arc<Mutex<Database>>) {
        self.db = Some(db);
    }

    pub fn start_sharing(&mut self, node_id: &str, bandwidth_limit_mbps: f64) -> SharingSession {
        let now = now_secs();
        let session = SharingSession {
            node_id: node_id.to_string(),
            bandwidth_limit_mbps,
            started_at: now,
            active: true,
        };

        if let Some(ref db) = self.db {
            let db_guard = db.lock().unwrap();
            let conn_guard = db_guard.conn.lock().unwrap();
            let _ = conn_guard.execute(
                "INSERT OR REPLACE INTO shared_connections (id, peer_node_id, peer_address, peer_public_key, connected_at, messages_exchanged, active)
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
                params![
                    format!("sharing-{}", node_id),
                    node_id,
                    "",
                    "",
                    now,
                    0i64,
                    1i64,
                ],
            );
        }

        self.session = Some(session.clone());
        session
    }

    pub fn stop_sharing(&mut self) {
        if let Some(ref session) = self.session {
            if let Some(ref db) = self.db {
                let db_guard = db.lock().unwrap();
                let conn_guard = db_guard.conn.lock().unwrap();
                let _ = conn_guard.execute(
                    "UPDATE shared_connections SET active = 0 WHERE peer_node_id = ?1",
                    params![session.node_id],
                );
            }
        }
        self.session = None;
        self.consumer_bytes.clear();
    }

    pub fn record_usage(&mut self, provider_id: &str, consumer_id: &str, bytes: u64) {
        let now = now_secs();
        let usage = BandwidthUsage {
            provider_id: provider_id.to_string(),
            consumer_id: consumer_id.to_string(),
            bytes_transferred: bytes,
            recorded_at: now,
        };

        *self.consumer_bytes.entry(consumer_id.to_string()).or_insert(0) += bytes;
        self.usage_log.push(usage.clone());

        if let Some(ref db) = self.db {
            let db_guard = db.lock().unwrap();
            let conn_guard = db_guard.conn.lock().unwrap();
            let _ = conn_guard.execute(
                "INSERT INTO peer_bandwidth_usage (id, session_id, peer_node_id, peer_address, rx_bytes, tx_bytes, session_start, session_end, earnings, billed)
                 VALUES (?1, ?2, ?3, ?4, ?5, 0, ?6, NULL, 0.0, 0)",
                params![
                    format!("usage-{}", uuid::Uuid::new_v4()),
                    format!("sharing-{}", provider_id),
                    consumer_id,
                    "",
                    bytes as i64,
                    now,
                ],
            );
        }
    }

    pub fn calculate_charges(&self, provider_id: &str, hours_used: f64) -> f64 {
        let bytes: u64 = self.consumer_bytes.values().sum();
        let gb_transferred = bytes as f64 / (1024.0 * 1024.0 * 1024.0);
        let base_rate = 0.001;
        let time_factor = hours_used.max(1.0);
        let gb_charge = gb_transferred * base_rate * 10.0;
        let time_charge = time_factor * 0.0001;
        let provider_share = (gb_charge + time_charge) * 0.85;
        provider_share.max(0.0)
    }

    pub fn get_usage_stats(&self, node_id: &str) -> UsageStats {
        let total_bytes: u64 = self.consumer_bytes.values().sum();
        let active_consumers = self.consumer_bytes.len() as u32;

        let hours_active = if let Some(ref session) = self.session {
            if session.active {
                let elapsed = now_secs() - session.started_at;
                elapsed as f64 / 3600.0
            } else {
                0.0
            }
        } else {
            0.0
        };

        let estimated_earnings = self.calculate_charges(node_id, hours_active);

        UsageStats {
            total_bytes_shared: total_bytes,
            active_consumers,
            hours_active,
            estimated_earnings,
        }
    }

    pub fn is_sharing_active(&self) -> bool {
        self.session.as_ref().map_or(false, |s| s.active)
    }

    pub fn current_session(&self) -> Option<&SharingSession> {
        self.session.as_ref()
    }

    pub fn consumer_usage(&self, consumer_id: &str) -> u64 {
        self.consumer_bytes.get(consumer_id).copied().unwrap_or(0)
    }
}

impl Default for BandwidthShareEngine {
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
