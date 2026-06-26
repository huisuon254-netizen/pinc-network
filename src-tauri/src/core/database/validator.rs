use crate::core::database::{connection::Database, errors::DatabaseError, schema::SCHEMA_VERSION};

pub fn check_schema_version(db: &Database) -> Result<(), DatabaseError> {
    let conn = db.conn.lock().map_err(|_| DatabaseError::LockFailed)?;
    let version: i64 = conn
        .query_row(
            "SELECT version FROM schema_version ORDER BY applied_at DESC LIMIT 1",
            [],
            |r| r.get(0),
        )
        .map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;
    if version != SCHEMA_VERSION {
        return Err(DatabaseError::SchemaMismatch {
            expected: SCHEMA_VERSION,
            found: version,
        });
    }
    Ok(())
}
