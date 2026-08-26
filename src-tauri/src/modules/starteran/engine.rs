use std::sync::{Arc, Mutex};
use std::time::{SystemTime, UNIX_EPOCH};

use crate::core::database::connection::Database;
use rusqlite::Connection;
use serde_json::Value;

use super::types::*;

pub struct StarteranEngine {
    node_id: String,
    db: Arc<Mutex<Database>>,
    earnings_cache: Arc<Mutex<f64>>,
}

impl StarteranEngine {
    pub fn new(node_id: &str, db: Arc<Mutex<Database>>) -> Self {
        StarteranEngine {
            node_id: node_id.to_string(),
            db,
            earnings_cache: Arc::new(Mutex::new(0.0)),
        }
    }

    pub fn status(&self) -> StarteranStatus {
        let active = self.count_active_connections();
        let traffic = self.total_traffic_gb();
        let earnings = self.total_earnings();
        let reliability = self.compute_reliability();
        let approval = self.approval_level(reliability);

        StarteranStatus {
            sharing_active: active > 0,
            active_connections: active,
            traffic_shared_gb: traffic,
            earnings,
            reliability_score: reliability,
            approval_level: approval,
        }
    }

    pub fn to_json_value(&self) -> Value {
        let s = self.status();
        serde_json::json!({
            "sharing_active": s.sharing_active,
            "active_connections": s.active_connections,
            "traffic_shared_gb": s.traffic_shared_gb,
            "earnings": s.earnings,
            "reliability_score": s.reliability_score,
            "approval_level": s.approval_level,
        })
    }

    fn with_db<F, T>(&self, f: F) -> T
    where
        F: FnOnce(&Connection) -> T,
    {
        let db = self.db.lock().unwrap();
        let conn = db.conn.lock().unwrap();
        f(&conn)
    }

    fn count_active_connections(&self) -> u64 {
        self.with_db(|conn| {
            conn.query_row(
                "SELECT COUNT(*) FROM shared_connections WHERE owner_node_id = ?1 AND status = 'active'",
                rusqlite::params![self.node_id],
                |r| r.get(0),
            )
            .unwrap_or(0)
        })
    }

    fn total_traffic_gb(&self) -> f64 {
        let total_bytes: f64 = self.with_db(|conn| {
            conn.query_row(
                "SELECT COALESCE(SUM(used_bandwidth), 0) FROM shared_connections WHERE owner_node_id = ?1",
                rusqlite::params![self.node_id],
                |r| r.get(0),
            )
            .unwrap_or(0.0)
        });
        total_bytes / (1024.0 * 1024.0 * 1024.0)
    }

    fn total_earnings(&self) -> f64 {
        *self.earnings_cache.lock().unwrap()
    }

    pub fn record_earnings(&self, amount: f64) {
        let mut cache = self.earnings_cache.lock().unwrap();
        *cache += amount;
    }

    fn compute_reliability(&self) -> f64 {
        let total: f64 = self.with_db(|conn| {
            conn.query_row(
                "SELECT COUNT(*) FROM shared_connections WHERE owner_node_id = ?1",
                rusqlite::params![self.node_id],
                |r| r.get(0),
            )
            .unwrap_or(0.0)
        });
        if total == 0.0 {
            return 0.0;
        }
        let active: f64 = self.with_db(|conn| {
            conn.query_row(
                "SELECT COUNT(*) FROM shared_connections WHERE owner_node_id = ?1 AND status = 'active'",
                rusqlite::params![self.node_id],
                |r| r.get(0),
            )
            .unwrap_or(0.0)
        });
        let ratio = active / total;
        (ratio * 100.0).min(100.0)
    }

    fn approval_level(&self, reliability: f64) -> String {
        if reliability >= 90.0 {
            "premium"
        } else if reliability >= 70.0 {
            "approved"
        } else if reliability >= 40.0 {
            "probation"
        } else {
            "none"
        }
        .to_string()
    }

    pub fn generate_share_code(&self) -> String {
        use rand::Rng;
        let mut rng = rand::thread_rng();
        let part1: String = (0..4).map(|_| rng.sample(rand::distributions::Alphanumeric) as char).collect();
        let part2: String = (0..4).map(|_| rng.sample(rand::distributions::Alphanumeric) as char).collect();
        format!("ERAN-{}-{}", part1.to_uppercase(), part2.to_uppercase())
    }

    pub fn record_traffic(&self, peer_id: &str, bytes_in: u64, bytes_out: u64) {
        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs() as i64;
        let id = uuid::Uuid::new_v4().to_string();
        self.with_db(|conn| {
            conn.execute(
                "INSERT INTO peer_bandwidth_usage (id, peer_id, bytes_in, bytes_out, recorded_at) VALUES (?1, ?2, ?3, ?4, ?5)",
                rusqlite::params![id, peer_id, bytes_in as i64, bytes_out as i64, now],
            )
            .ok();
        });
    }

    pub fn list_connections(&self) -> Vec<SharedConnection> {
        self.with_db(|conn| {
            let mut stmt = match conn.prepare(
                "SELECT id, peer_node_id, connection_type, max_bandwidth, used_bandwidth, status, created_at FROM shared_connections WHERE owner_node_id = ?1 ORDER BY created_at DESC",
            ) {
                Ok(s) => s,
                Err(_) => return vec![],
            };
            let rows = match stmt.query_map(rusqlite::params![self.node_id], |row| {
                Ok(SharedConnection {
                    id: row.get(0)?,
                    peer_node_id: row.get(1)?,
                    connection_type: row.get(2)?,
                    max_bandwidth: row.get(3)?,
                    used_bandwidth: row.get(4)?,
                    status: row.get(5)?,
                    created_at: row.get(6)?,
                })
            }) {
                Ok(rows) => rows.filter_map(|r| r.ok()).collect(),
                Err(_) => vec![],
            };
            rows
        })
    }
}
