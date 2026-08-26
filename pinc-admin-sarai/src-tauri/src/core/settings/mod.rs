use crate::core::database::{connection::Database, errors::DatabaseError};
use rusqlite::params;

/// App settings stored as JSON blobs in app_settings table (key -> json string)
/// Also handles onboarding flag.

pub fn get_app_settings_json(db: &Database) -> Result<Option<String>, DatabaseError> {
    let conn = db.conn.lock().map_err(|_| DatabaseError::LockFailed)?;
    let mut stmt = conn.prepare("SELECT value FROM app_settings WHERE key='app_settings_json' LIMIT 1")
        .map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;
    let mut rows = stmt.query([]).map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;
    if let Some(row) = rows.next().map_err(|e| DatabaseError::QueryFailed(e.to_string()))? {
        let v: String = row.get(0).map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;
        Ok(Some(v))
    } else {
        Ok(None)
    }
}

pub fn set_app_settings_json(db: &Database, json: &str) -> Result<(), DatabaseError> {
    let conn = db.conn.lock().map_err(|_| DatabaseError::LockFailed)?;
    let now = chrono::Utc::now().timestamp();
    conn.execute(
        "INSERT INTO app_settings (key, value, updated_at) VALUES ('app_settings_json', ?1, ?2) ON CONFLICT(key) DO UPDATE SET value=?1, updated_at=?2",
        params![json, now],
    ).map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;
    Ok(())
}

pub fn get_onboarding_completed(db: &Database) -> Result<bool, DatabaseError> {
    let conn = db.conn.lock().map_err(|_| DatabaseError::LockFailed)?;
    let mut stmt = conn.prepare("SELECT value FROM app_settings WHERE key='has_completed_onboarding' LIMIT 1")
        .map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;
    let mut rows = stmt.query([]).map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;
    if let Some(row) = rows.next().map_err(|e| DatabaseError::QueryFailed(e.to_string()))? {
        let v: String = row.get(0).map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;
        Ok(v == "true" || v == "1")
    } else {
        Ok(false)
    }
}

pub fn set_onboarding_completed(db: &Database, completed: bool) -> Result<(), DatabaseError> {
    let conn = db.conn.lock().map_err(|_| DatabaseError::LockFailed)?;
    let now = chrono::Utc::now().timestamp();
    let v = if completed { "true" } else { "false" };
    conn.execute(
        "INSERT INTO app_settings (key, value, updated_at) VALUES ('has_completed_onboarding', ?1, ?2) ON CONFLICT(key) DO UPDATE SET value=?1, updated_at=?2",
        params![v, now],
    ).map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;
    Ok(())
}

pub fn get_setting_value(db: &Database, key: &str) -> Result<Option<String>, DatabaseError> {
    let conn = db.conn.lock().map_err(|_| DatabaseError::LockFailed)?;
    let mut stmt = conn.prepare("SELECT value FROM app_settings WHERE key=?1 LIMIT 1")
        .map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;
    let mut rows = stmt.query(params![key]).map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;
    if let Some(row) = rows.next().map_err(|e| DatabaseError::QueryFailed(e.to_string()))? {
        Ok(Some(row.get(0).map_err(|e| DatabaseError::QueryFailed(e.to_string()))?))
    } else {
        Ok(None)
    }
}

pub fn set_setting_value(db: &Database, key: &str, value: &str) -> Result<(), DatabaseError> {
    let conn = db.conn.lock().map_err(|_| DatabaseError::LockFailed)?;
    let now = chrono::Utc::now().timestamp();
    conn.execute(
        "INSERT INTO app_settings (key, value, updated_at) VALUES (?1, ?2, ?3) ON CONFLICT(key) DO UPDATE SET value=?2, updated_at=?3",
        params![key, value, now],
    ).map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;
    Ok(())
}
