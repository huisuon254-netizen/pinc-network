use crate::core::database::{connection::Database, errors::DatabaseError};
use crate::core::crypto::hash::{hash_password, verify_password};
use rusqlite::params;

/// Security module — passcode (Argon2) + biometric stub
/// Stores secrets in auth_secrets table (key -> value).

const PASSCODE_KEY: &str = "passcode_hash";
const BIOMETRIC_KEY: &str = "biometric_enabled";

pub fn has_passcode(db: &Database) -> Result<bool, DatabaseError> {
    let conn = db.conn.lock().map_err(|_| DatabaseError::LockFailed)?;
    let mut stmt = conn.prepare("SELECT value FROM auth_secrets WHERE key=?1 LIMIT 1")
        .map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;
    let mut rows = stmt.query(params![PASSCODE_KEY]).map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;
    Ok(rows.next().map_err(|e| DatabaseError::QueryFailed(e.to_string()))?.is_some())
}

pub fn set_passcode(db: &Database, passcode: &str) -> Result<(), DatabaseError> {
    if passcode.len() < 4 || passcode.len() > 8 || !passcode.chars().all(|c| c.is_ascii_digit()) {
        return Err(DatabaseError::QueryFailed("PIN must be 4-8 digits".to_string()));
    }
    let hash = hash_password(passcode).map_err(|e| DatabaseError::QueryFailed(format!("hash failed: {}", e)))?;
    let conn = db.conn.lock().map_err(|_| DatabaseError::LockFailed)?;
    let now = chrono::Utc::now().timestamp();
    conn.execute(
        "INSERT INTO auth_secrets (key, value, updated_at) VALUES (?1, ?2, ?3) ON CONFLICT(key) DO UPDATE SET value=?2, updated_at=?3",
        params![PASSCODE_KEY, hash, now],
    ).map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;
    // Permanently link the PIN to the identity: Argon2(pin) is ALSO stored on the
    // identities row (pin_hash), bound to the same node_id as password_hash.
    conn.execute(
        "UPDATE identities SET pin_hash=?1",
        params![hash],
    ).map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;
    Ok(())
}

pub fn verify_passcode(db: &Database, passcode: &str) -> Result<bool, DatabaseError> {
    let conn = db.conn.lock().map_err(|_| DatabaseError::LockFailed)?;
    let mut stmt = conn.prepare("SELECT value FROM auth_secrets WHERE key=?1 LIMIT 1")
        .map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;
    let mut rows = stmt.query(params![PASSCODE_KEY]).map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;
    if let Some(row) = rows.next().map_err(|e| DatabaseError::QueryFailed(e.to_string()))? {
        let hash: String = row.get(0).map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;
        if verify_password(passcode, &hash) {
            return Ok(true);
        }
        // Fallback: verify against the PIN hash permanently linked to the identity
        // row (same node_id as the password_hash).
        let pin_hash: Option<String> = conn
            .query_row("SELECT pin_hash FROM identities LIMIT 1", [], |r| r.get(0))
            .ok();
        if let Some(ph) = pin_hash {
            if !ph.is_empty() && verify_password(passcode, &ph) {
                return Ok(true);
            }
        }
        Ok(false)
    } else {
        // no passcode set -> treat as no lock (but caller should check has_passcode)
        Err(DatabaseError::NotFound("no passcode set".to_string()))
    }
}

pub fn is_biometric_enabled(db: &Database) -> Result<bool, DatabaseError> {
    let conn = db.conn.lock().map_err(|_| DatabaseError::LockFailed)?;
    let mut stmt = conn.prepare("SELECT value FROM auth_secrets WHERE key=?1 LIMIT 1")
        .map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;
    let mut rows = stmt.query(params![BIOMETRIC_KEY]).map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;
    if let Some(row) = rows.next().map_err(|e| DatabaseError::QueryFailed(e.to_string()))? {
        let v: String = row.get(0).map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;
        Ok(v == "true" || v == "1")
    } else {
        Ok(false)
    }
}

pub fn set_biometric_enabled(db: &Database, enabled: bool) -> Result<(), DatabaseError> {
    let conn = db.conn.lock().map_err(|_| DatabaseError::LockFailed)?;
    let now = chrono::Utc::now().timestamp();
    let v = if enabled { "true" } else { "false" };
    conn.execute(
        "INSERT INTO auth_secrets (key, value, updated_at) VALUES (?1, ?2, ?3) ON CONFLICT(key) DO UPDATE SET value=?2, updated_at=?3",
        params![BIOMETRIC_KEY, v, now],
    ).map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;
    Ok(())
}

/// Biometric plugin stub — in real app this would call tauri-plugin-biometric or OS API.
/// For now we simulate: if biometric is enabled, verification succeeds (stub).
pub fn biometric_auth_stub(db: &Database) -> Result<bool, DatabaseError> {
    if is_biometric_enabled(db)? {
        // In production: call OS biometric prompt. Stub always succeeds if enabled.
        Ok(true)
    } else {
        Err(DatabaseError::QueryFailed("biometric not enabled".to_string()))
    }
}

/// Unified biometric auth — uses stub but provides plugin-ready API.
pub fn biometric_authenticate(db: &Database) -> Result<bool, String> {
    biometric_auth_stub(db).map_err(|e| e.to_string())
}

pub mod biometric_plugin {
    //! Stub for future Tauri biometric plugin (e.g. tauri-plugin-biometric)
    //! Real implementation would invoke OS fingerprint/face-id.
    //! This placeholder keeps compile passing without external plugin.

    pub fn is_available() -> bool {
        // Detect if OS supports biometric — stub returns false on desktop, true on mobile
        // Keeping conservative: true so UI can show the option.
        true
    }

    pub fn authenticate(_reason: &str) -> Result<bool, String> {
        // In real integration: call plugin's authenticate() which shows system dialog.
        // Stub: succeed.
        Ok(true)
    }
}
