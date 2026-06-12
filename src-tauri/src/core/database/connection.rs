use rusqlite::Connection;
use std::sync::{Arc, Mutex};
use crate::core::database::errors::DatabaseError;

pub struct Database {
    pub conn: Arc<Mutex<Connection>>,
}

impl Database {
    pub fn open(path: &str) -> Result<Self, DatabaseError> {
        let conn = Connection::open(path)
            .map_err(|e| DatabaseError::OpenFailed(e.to_string()))?;
        conn.execute_batch(
            "PRAGMA journal_mode=WAL;
             PRAGMA foreign_keys=ON;
             PRAGMA synchronous=NORMAL;",
        ).map_err(|e| DatabaseError::PragmaFailed(e.to_string()))?;
        Ok(Database { conn: Arc::new(Mutex::new(conn)) })
    }
}

#[cfg(test)]
pub fn open_test_db() -> Result<Database, DatabaseError> {
    let conn = Connection::open_in_memory()
        .map_err(|e| DatabaseError::OpenFailed(e.to_string()))?;
    let db = Database { conn: Arc::new(Mutex::new(conn)) };
    crate::core::database::migrations::run_migrations(&db)?;
    Ok(db)
}
