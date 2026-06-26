use crate::core::database::{connection::Database, errors::DatabaseError, schema::*};
use std::time::{SystemTime, UNIX_EPOCH};

pub fn run_migrations(db: &Database) -> Result<(), DatabaseError> {
    let conn = db.conn.lock().map_err(|_| DatabaseError::LockFailed)?;
    conn.execute_batch(CREATE_SCHEMA_VERSION)
        .map_err(|e| DatabaseError::MigrationFailed(e.to_string()))?;
    conn.execute_batch(CREATE_IDENTITIES)
        .map_err(|e| DatabaseError::MigrationFailed(e.to_string()))?;
    conn.execute_batch(CREATE_VAULT_FILES)
        .map_err(|e| DatabaseError::MigrationFailed(e.to_string()))?;
    conn.execute_batch(CREATE_PEERS)
        .map_err(|e| DatabaseError::MigrationFailed(e.to_string()))?;
    conn.execute_batch(CREATE_SETTINGS)
        .map_err(|e| DatabaseError::MigrationFailed(e.to_string()))?;
    conn.execute_batch(CREATE_ACTIVITY_LOG)
        .map_err(|e| DatabaseError::MigrationFailed(e.to_string()))?;
    conn.execute_batch(CREATE_FILE_CHUNKS)
        .map_err(|e| DatabaseError::MigrationFailed(e.to_string()))?;
    conn.execute_batch(CREATE_NODE_STATUS)
        .map_err(|e| DatabaseError::MigrationFailed(e.to_string()))?;
    conn.execute_batch(CREATE_DISTRIBUTED_CHUNKS)
        .map_err(|e| DatabaseError::MigrationFailed(e.to_string()))?;
    conn.execute_batch(CREATE_MESSAGES)
        .map_err(|e| DatabaseError::MigrationFailed(e.to_string()))?;
    conn.execute_batch(CREATE_CONVERSATIONS)
        .map_err(|e| DatabaseError::MigrationFailed(e.to_string()))?;
    conn.execute_batch(CREATE_MESSAGES_INDEXES)
        .map_err(|e| DatabaseError::MigrationFailed(e.to_string()))?;
    conn.execute_batch(CREATE_MESSAGING_KEYS)
        .map_err(|e| DatabaseError::MigrationFailed(e.to_string()))?;
    conn.execute_batch(CREATE_MARKETPLACE)
        .map_err(|e| DatabaseError::MigrationFailed(e.to_string()))?;
    conn.execute_batch(CREATE_WALLET)
        .map_err(|e| DatabaseError::MigrationFailed(e.to_string()))?;
    conn.execute_batch(CREATE_REPUTATION)
        .map_err(|e| DatabaseError::MigrationFailed(e.to_string()))?;
    conn.execute_batch(CREATE_WAGERS)
        .map_err(|e| DatabaseError::MigrationFailed(e.to_string()))?;
    conn.execute_batch(CREATE_SOCIAL_POSTS)
        .map_err(|e| DatabaseError::MigrationFailed(e.to_string()))?;
    conn.execute_batch(CREATE_AI_AGENTS)
        .map_err(|e| DatabaseError::MigrationFailed(e.to_string()))?;
    conn.execute_batch(CREATE_STORAGE_CONTRACTS)
        .map_err(|e| DatabaseError::MigrationFailed(e.to_string()))?;
    conn.execute_batch(CREATE_WALLET_BALANCES)
        .map_err(|e| DatabaseError::MigrationFailed(e.to_string()))?;
    conn.execute_batch(CREATE_RIFT_LISTINGS)
        .map_err(|e| DatabaseError::MigrationFailed(e.to_string()))?;
    conn.execute_batch(CREATE_RIFT_RENTALS)
        .map_err(|e| DatabaseError::MigrationFailed(e.to_string()))?;
    conn.execute_batch(CREATE_RIFT_METRICS)
        .map_err(|e| DatabaseError::MigrationFailed(e.to_string()))?;
    conn.execute_batch(CREATE_RIFT_PAYMENTS)
        .map_err(|e| DatabaseError::MigrationFailed(e.to_string()))?;
    conn.execute_batch(CREATE_NET_SHARE_CODES)
        .map_err(|e| DatabaseError::MigrationFailed(e.to_string()))?;
    conn.execute_batch(CREATE_SHARED_CONNECTIONS)
        .map_err(|e| DatabaseError::MigrationFailed(e.to_string()))?;
    conn.execute_batch(CREATE_NET_STORE_LISTINGS)
        .map_err(|e| DatabaseError::MigrationFailed(e.to_string()))?;
    conn.execute_batch(CREATE_NET_STORE_PURCHASES)
        .map_err(|e| DatabaseError::MigrationFailed(e.to_string()))?;
    conn.execute_batch(CREATE_HOTSPOT_SESSIONS)
        .map_err(|e| DatabaseError::MigrationFailed(e.to_string()))?;
    conn.execute_batch(CREATE_PEER_BANDWIDTH_USAGE)
        .map_err(|e| DatabaseError::MigrationFailed(e.to_string()))?;
    conn.execute_batch(CREATE_BILLING_TRANSACTIONS)
        .map_err(|e| DatabaseError::MigrationFailed(e.to_string()))?;
    conn.execute_batch(CREATE_ESCROW_HOLDS)
        .map_err(|e| DatabaseError::MigrationFailed(e.to_string()))?;
    conn.execute_batch(CREATE_GAME_SESSIONS)
        .map_err(|e| DatabaseError::MigrationFailed(e.to_string()))?;
    conn.execute_batch(CREATE_GAME_PROGRESS)
        .map_err(|e| DatabaseError::MigrationFailed(e.to_string()))?;
    conn.execute_batch(CREATE_CONTACTS)
        .map_err(|e| DatabaseError::MigrationFailed(e.to_string()))?;

    // Migration: add username column to identities if missing
    conn.execute_batch("ALTER TABLE identities ADD COLUMN username TEXT NOT NULL DEFAULT '';")
        .ok();

    let count: i64 = conn
        .query_row("SELECT COUNT(*) FROM schema_version", [], |r| r.get(0))
        .map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;
    if count == 0 {
        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs() as i64;
        conn.execute(
            "INSERT INTO schema_version (version, applied_at) VALUES (?1, ?2)",
            rusqlite::params![SCHEMA_VERSION, now],
        )
        .map_err(|e| DatabaseError::MigrationFailed(e.to_string()))?;
    }
    Ok(())
}
