use std::time::{SystemTime, UNIX_EPOCH};
use crate::core::database::{connection::Database, errors::DatabaseError, schema::*};

pub fn run_migrations(db: &Database) -> Result<(), DatabaseError> {
    let conn = db.conn.lock().map_err(|_| DatabaseError::LockFailed)?;
    conn.execute_batch(CREATE_SCHEMA_VERSION).map_err(|e| DatabaseError::MigrationFailed(e.to_string()))?;
    conn.execute_batch(CREATE_IDENTITIES).map_err(|e| DatabaseError::MigrationFailed(e.to_string()))?;
    conn.execute_batch(CREATE_VAULT_FILES).map_err(|e| DatabaseError::MigrationFailed(e.to_string()))?;
    conn.execute_batch(CREATE_PEERS).map_err(|e| DatabaseError::MigrationFailed(e.to_string()))?;
    conn.execute_batch(CREATE_SETTINGS).map_err(|e| DatabaseError::MigrationFailed(e.to_string()))?;
    conn.execute_batch(CREATE_ACTIVITY_LOG).map_err(|e| DatabaseError::MigrationFailed(e.to_string()))?;
    conn.execute_batch(CREATE_FILE_CHUNKS).map_err(|e| DatabaseError::MigrationFailed(e.to_string()))?;
    conn.execute_batch(CREATE_NODE_STATUS).map_err(|e| DatabaseError::MigrationFailed(e.to_string()))?;
    conn.execute_batch(CREATE_DISTRIBUTED_CHUNKS).map_err(|e| DatabaseError::MigrationFailed(e.to_string()))?;
    conn.execute_batch(CREATE_MESSAGES).map_err(|e| DatabaseError::MigrationFailed(e.to_string()))?;
    conn.execute_batch(CREATE_MARKETPLACE).map_err(|e| DatabaseError::MigrationFailed(e.to_string()))?;
    conn.execute_batch(CREATE_WALLET).map_err(|e| DatabaseError::MigrationFailed(e.to_string()))?;
    conn.execute_batch(CREATE_REPUTATION).map_err(|e| DatabaseError::MigrationFailed(e.to_string()))?;
    conn.execute_batch(CREATE_WAGERS).map_err(|e| DatabaseError::MigrationFailed(e.to_string()))?;
    conn.execute_batch(CREATE_SOCIAL_POSTS).map_err(|e| DatabaseError::MigrationFailed(e.to_string()))?;
    conn.execute_batch(CREATE_AI_AGENTS).map_err(|e| DatabaseError::MigrationFailed(e.to_string()))?;
    conn.execute_batch(CREATE_STORAGE_CONTRACTS).map_err(|e| DatabaseError::MigrationFailed(e.to_string()))?;
    conn.execute_batch(CREATE_WALLET_BALANCES).map_err(|e| DatabaseError::MigrationFailed(e.to_string()))?;
    conn.execute_batch(CREATE_RIFT_LISTINGS).map_err(|e| DatabaseError::MigrationFailed(e.to_string()))?;

    let count: i64 = conn.query_row("SELECT COUNT(*) FROM schema_version", [], |r| r.get(0))
        .map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;
    if count == 0 {
        let now = SystemTime::now().duration_since(UNIX_EPOCH).unwrap_or_default().as_secs() as i64;
        conn.execute(
            "INSERT INTO schema_version (version, applied_at) VALUES (?1, ?2)",
            rusqlite::params![SCHEMA_VERSION, now],
        ).map_err(|e| DatabaseError::MigrationFailed(e.to_string()))?;
    }
    Ok(())
}
