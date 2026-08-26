use thiserror::Error;

#[derive(Debug, Error)]
pub enum DatabaseError {
    #[error("Failed to open: {0}")]
    OpenFailed(String),
    #[error("Pragma failed: {0}")]
    PragmaFailed(String),
    #[error("Migration failed: {0}")]
    MigrationFailed(String),
    #[error("Schema mismatch: expected {expected}, found {found}")]
    SchemaMismatch { expected: i64, found: i64 },
    #[error("Query failed: {0}")]
    QueryFailed(String),
    #[error("Record not found: {0}")]
    NotFound(String),
    #[error("Lock poisoned")]
    LockFailed,
}
