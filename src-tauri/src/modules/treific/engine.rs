use std::sync::{Arc, Mutex};

use crate::core::database::connection::Database;
use rusqlite::Connection;
use serde_json::Value;

use super::types::*;

pub struct TreificEngine {
    node_id: String,
    db: Arc<Mutex<Database>>,
}

impl TreificEngine {
    pub fn new(node_id: &str, db: Arc<Mutex<Database>>) -> Self {
        TreificEngine {
            node_id: node_id.to_string(),
            db,
        }
    }

    fn with_db<F, T>(&self, f: F) -> T
    where
        F: FnOnce(&Connection) -> T,
    {
        let db = self.db.lock().unwrap();
        let conn = db.conn.lock().unwrap();
        f(&conn)
    }

    pub fn communities(&self) -> Vec<CommunityInfo> {
        self.with_db(|conn| {
            let mut stmt = match conn.prepare(
                "SELECT id, name, created_at FROM communities ORDER BY created_at DESC LIMIT 50",
            ) {
                Ok(s) => s,
                Err(_) => return vec![],
            };
            let rows = match stmt.query_map([], |row| {
                let id: String = row.get(0)?;
                let name: String = row.get(1)?;
                let created_at: i64 = row.get(2)?;
                Ok(CommunityInfo {
                    id,
                    name,
                    members: 0,
                    activity: "active".to_string(),
                    community_type: "public".to_string(),
                    created_at,
                })
            }) {
                Ok(rows) => rows.filter_map(|r| r.ok()).collect(),
                Err(_) => vec![],
            };
            rows
        })
    }

    pub fn status(&self) -> TreificStatus {
        let communities = self.communities().len() as u64;
        let total_members: u64 = self.with_db(|conn| {
            conn.query_row("SELECT COUNT(*) FROM contacts", [], |r| r.get(0))
                .unwrap_or(0)
        });
        let active_chats: u64 = self.with_db(|conn| {
            conn.query_row("SELECT COUNT(*) FROM conversations WHERE is_group = 0", [], |r| r.get(0))
                .unwrap_or(0)
        });

        TreificStatus {
            communities_active: communities,
            total_members,
            messages_per_minute: 0,
            voice_active: 0,
            video_active: 0,
            file_transfers_active: 0,
            total_data_gb: 0.0,
            active_chats,
        }
    }

    pub fn to_json_value(&self) -> Value {
        let s = self.status();
        serde_json::json!({
            "communities_active": s.communities_active,
            "total_members": s.total_members,
            "messages_per_minute": s.messages_per_minute,
            "voice_active": s.voice_active,
            "video_active": s.video_active,
            "file_transfers_active": s.file_transfers_active,
            "total_data_gb": s.total_data_gb,
            "active_chats": s.active_chats,
        })
    }

    pub fn traffic_stats(&self) -> TreificTrafficStats {
        TreificTrafficStats {
            messages_per_minute: 0,
            voice_active: 0,
            video_active: 0,
            file_transfers_active: 0,
            total_data_gb: 0.0,
            active_chats: self.with_db(|conn| {
                conn.query_row("SELECT COUNT(*) FROM conversations WHERE is_group = 0", [], |r| r.get(0))
                    .unwrap_or(0)
            }),
        }
    }

    pub fn to_traffic_json(&self) -> Value {
        let t = self.traffic_stats();
        serde_json::json!({
            "messages_per_minute": t.messages_per_minute,
            "voice_active": t.voice_active,
            "video_active": t.video_active,
            "file_transfers_active": t.file_transfers_active,
            "total_data_gb": t.total_data_gb,
            "active_chats": t.active_chats,
        })
    }
}
