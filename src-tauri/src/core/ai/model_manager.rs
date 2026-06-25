use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::time::{SystemTime, UNIX_EPOCH};
use crate::core::ai::errors::AiError;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AiModel {
    pub id: String,
    pub name: String,
    pub model_type: String,
    pub file_path: String,
    pub size_bytes: i64,
    pub downloaded: bool,
    pub active: bool,
    pub created_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModelDownloadProgress {
    pub model_id: String,
    pub bytes_downloaded: u64,
    pub total_bytes: u64,
    pub percentage: f64,
    pub status: String,
}

fn models_dir() -> PathBuf {
    let home = std::env::var("HOME").unwrap_or_else(|_| "/tmp".to_string());
    PathBuf::from(home).join(".local/share/com.pinc.app/models")
}

pub struct ModelManager {
    db: Option<rusqlite::Connection>,
    models_dir: PathBuf,
}

impl ModelManager {
    pub fn new(db: &crate::core::database::connection::Database) -> Self {
        let dir = models_dir();
        let _ = std::fs::create_dir_all(&dir);

        let db_conn = db.conn.lock().map(|c| {
            let _ = c.execute_batch(
                "CREATE TABLE IF NOT EXISTS ai_models (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    model_type TEXT NOT NULL,
                    file_path TEXT NOT NULL,
                    size_bytes INTEGER NOT NULL DEFAULT 0,
                    downloaded INTEGER NOT NULL DEFAULT 0,
                    active INTEGER NOT NULL DEFAULT 0,
                    created_at INTEGER NOT NULL
                );"
            );
            std::sync::Mutex::new(Some(c))
        });

        let conn = db_conn.ok().and_then(|m| m.into_inner().ok());

        Self {
            db: conn,
            models_dir: dir,
        }
    }

    pub fn list_models(&self) -> Vec<AiModel> {
        let Some(ref conn) = self.db else {
            return Vec::new();
        };

        let mut stmt = match conn.prepare(
            "SELECT id, name, model_type, file_path, size_bytes, downloaded, active, created_at FROM ai_models ORDER BY created_at DESC"
        ) {
            Ok(s) => s,
            Err(_) => return Vec::new(),
        };

        let rows = stmt.query_map([], |row| {
            Ok(AiModel {
                id: row.get(0)?,
                name: row.get(1)?,
                model_type: row.get(2)?,
                file_path: row.get(3)?,
                size_bytes: row.get(4)?,
                downloaded: row.get::<_, i64>(5)? != 0,
                active: row.get::<_, i64>(6)? != 0,
                created_at: row.get(7)?,
            })
        });

        match rows {
            Ok(r) => r.filter_map(|r| r.ok()).collect(),
            Err(_) => Vec::new(),
        }
    }

    pub fn register_model(&self, id: &str, name: &str, model_type: &str, file_path: &str, size_bytes: i64) -> Result<(), AiError> {
        let Some(ref conn) = self.db else {
            return Err(AiError::InferenceFailed("Database not available".to_string()));
        };

        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs() as i64;

        conn.execute(
            "INSERT OR REPLACE INTO ai_models (id, name, model_type, file_path, size_bytes, downloaded, active, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
            rusqlite::params![id, name, model_type, file_path, size_bytes, 1i64, 0i64, now],
        ).map_err(|e| AiError::InferenceFailed(format!("Failed to register model: {}", e)))?;

        Ok(())
    }

    pub fn set_active(&self, model_id: &str, active: bool) -> Result<(), AiError> {
        let Some(ref conn) = self.db else {
            return Err(AiError::InferenceFailed("Database not available".to_string()));
        };

        conn.execute(
            "UPDATE ai_models SET active = ?1 WHERE id = ?2",
            rusqlite::params![if active { 1i64 } else { 0i64 }, model_id],
        ).map_err(|e| AiError::InferenceFailed(format!("Failed to update model: {}", e)))?;

        Ok(())
    }

    pub fn delete_model(&self, model_id: &str) -> Result<(), AiError> {
        let Some(ref conn) = self.db else {
            return Err(AiError::InferenceFailed("Database not available".to_string()));
        };

        if let Some(model) = self.get_model(model_id) {
            let path = std::path::Path::new(&model.file_path);
            if path.exists() {
                let _ = std::fs::remove_file(path);
            }
        }

        conn.execute(
            "DELETE FROM ai_models WHERE id = ?1",
            rusqlite::params![model_id],
        ).map_err(|e| AiError::InferenceFailed(format!("Failed to delete model: {}", e)))?;

        Ok(())
    }

    pub fn get_model(&self, model_id: &str) -> Option<AiModel> {
        let Some(ref conn) = self.db else {
            return None;
        };

        conn.query_row(
            "SELECT id, name, model_type, file_path, size_bytes, downloaded, active, created_at FROM ai_models WHERE id = ?1",
            rusqlite::params![model_id],
            |row| Ok(AiModel {
                id: row.get(0)?,
                name: row.get(1)?,
                model_type: row.get(2)?,
                file_path: row.get(3)?,
                size_bytes: row.get(4)?,
                downloaded: row.get::<_, i64>(5)? != 0,
                active: row.get::<_, i64>(6)? != 0,
                created_at: row.get(7)?,
            }),
        ).ok()
    }

    pub fn get_model_dir(&self) -> &std::path::Path {
        &self.models_dir
    }
}
