use crate::core::database::{connection::Database, errors::DatabaseError};
use std::time::{SystemTime, UNIX_EPOCH};
use uuid::Uuid;

pub struct Session {
    pub token: String,
    pub node_id: String,
    pub created_at: i64,
    pub expires_at: i64,
    pub active: bool,
}

fn now_secs() -> i64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs() as i64
}

pub fn create_session(
    db: &Database,
    node_id: &str,
    duration_minutes: i64,
) -> Result<Session, DatabaseError> {
    let conn = db.conn.lock().map_err(|_| DatabaseError::LockFailed)?;
    let token = Uuid::new_v4().to_string();
    let created = now_secs();
    let expires = created + (duration_minutes * 60);

    conn.execute(
        "INSERT INTO sessions (token, node_id, created_at, expires_at, active)
         VALUES (?1, ?2, ?3, ?4, 1)",
        rusqlite::params![token, node_id, created, expires],
    )
    .map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;

    Ok(Session {
        token,
        node_id: node_id.to_string(),
        created_at: created,
        expires_at: expires,
        active: true,
    })
}

pub fn validate_session(db: &Database, token: &str) -> Result<Option<Session>, DatabaseError> {
    let conn = db.conn.lock().map_err(|_| DatabaseError::LockFailed)?;
    let now = now_secs();

    let result = conn.query_row(
        "SELECT token, node_id, created_at, expires_at, active
         FROM sessions WHERE token = ?1",
        rusqlite::params![token],
        |row| {
            Ok(Session {
                token: row.get(0)?,
                node_id: row.get(1)?,
                created_at: row.get(2)?,
                expires_at: row.get(3)?,
                active: row.get::<_, i64>(4)? != 0,
            })
        },
    );

    match result {
        Ok(session) => {
            if session.active && session.expires_at > now {
                Ok(Some(session))
            } else {
                Ok(None)
            }
        }
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(e) => Err(DatabaseError::QueryFailed(e.to_string())),
    }
}

pub fn destroy_session(db: &Database, token: &str) -> Result<(), DatabaseError> {
    let conn = db.conn.lock().map_err(|_| DatabaseError::LockFailed)?;
    conn.execute(
        "UPDATE sessions SET active = 0 WHERE token = ?1",
        rusqlite::params![token],
    )
    .map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;
    Ok(())
}

pub fn cleanup_expired_sessions(db: &Database) -> Result<u64, DatabaseError> {
    let conn = db.conn.lock().map_err(|_| DatabaseError::LockFailed)?;
    let now = now_secs();
    let affected = conn
        .execute(
            "UPDATE sessions SET active = 0 WHERE active = 1 AND expires_at <= ?1",
            rusqlite::params![now],
        )
        .map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;
    Ok(affected as u64)
}

pub fn get_active_sessions_for_node(
    db: &Database,
    node_id: &str,
) -> Result<Vec<Session>, DatabaseError> {
    let conn = db.conn.lock().map_err(|_| DatabaseError::LockFailed)?;
    let now = now_secs();
    let mut stmt = conn
        .prepare(
            "SELECT token, node_id, created_at, expires_at, active
         FROM sessions WHERE node_id = ?1 AND active = 1 AND expires_at > ?2",
        )
        .map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;
    let rows = stmt
        .query_map(rusqlite::params![node_id, now], |row| {
            Ok(Session {
                token: row.get(0)?,
                node_id: row.get(1)?,
                created_at: row.get(2)?,
                expires_at: row.get(3)?,
                active: row.get::<_, i64>(4)? != 0,
            })
        })
        .map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;
    let mut sessions = Vec::new();
    for row in rows {
        if let Ok(s) = row {
            sessions.push(s);
        }
    }
    Ok(sessions)
}
