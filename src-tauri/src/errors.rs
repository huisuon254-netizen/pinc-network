use thiserror::Error;

pub type AppResult<T> = Result<T, AppError>;

#[derive(Debug, Error)]
pub enum AppError {
    // ── Crypto ──────────────────────────────────────────────────────────────
    #[error("Invalid nonce: expected {expected} bytes, got {got}")]
    InvalidNonce { expected: usize, got: usize },
    #[error("Encryption failed: {0}")]
    EncryptionFailed(String),
    #[error("Decryption failed")]
    DecryptionFailed,
    #[error("Key generation failed: {0}")]
    KeyGenerationFailed(String),
    #[error("Invalid key length: expected {expected}, got {got}")]
    InvalidKeyLength { expected: usize, got: usize },
    #[error("Hash failed: {0}")]
    HashFailed(String),

    // ── Identity ─────────────────────────────────────────────────────────────
    #[error("Identity generation failed: {0}")]
    IdentityGenerationFailed(String),
    #[error("Identity not found")]
    IdentityNotFound,
    #[error("Identity validation failed: {0}")]
    IdentityValidationFailed(String),
    #[error("Recovery failed: {0}")]
    RecoveryFailed(String),
    #[error("Device fingerprint error: {0}")]
    DeviceFingerprintError(String),

    // ── Database ─────────────────────────────────────────────────────────────
    #[error("Database error: {0}")]
    DatabaseError(String),
    #[error("Record not found")]
    NotFound,
    #[error("Migration failed: {0}")]
    MigrationFailed(String),
    #[error("Schema mismatch: expected {expected}, found {found}")]
    SchemaMismatch { expected: i64, found: i64 },

    // ── Vault ─────────────────────────────────────────────────────────────────
    #[error("Vault encryption failed: {0}")]
    VaultEncryptionFailed(String),
    #[error("Vault corruption detected")]
    VaultCorruption,
    #[error("Chunk error: {0}")]
    ChunkError(String),
    #[error("Compression failed: {0}")]
    CompressionFailed(String),
    #[error("Storage error: {0}")]
    StorageError(String),

    // ── Network ───────────────────────────────────────────────────────────────
    #[error("Network error: {0}")]
    NetworkError(String),
    #[error("Peer connection failed: {0}")]
    PeerConnectionFailed(String),
    #[error("TLS config failed: {0}")]
    TlsConfigFailed(String),
    #[error("Transport error: {0}")]
    TransportError(String),
    #[error("Peer not found: {0}")]
    PeerNotFound(String),
    #[error("Handshake failed: {0}")]
    HandshakeFailed(String),
    #[error("Discovery failed: {0}")]
    DiscoveryFailed(String),

    // ── Mesh ──────────────────────────────────────────────────────────────────
    #[error("Mesh error: {0}")]
    MeshError(String),

    // ── Permissions ───────────────────────────────────────────────────────────
    #[error("Permission denied: {0}")]
    PermissionDenied(String),

    // ── Telemetry ─────────────────────────────────────────────────────────────
    #[error("Telemetry error: {0}")]
    TelemetryError(String),

    // ── Settings ──────────────────────────────────────────────────────────────
    #[error("Settings error: {0}")]
    SettingsError(String),

    // ── Startup ───────────────────────────────────────────────────────────────
    #[error("Startup check failed at: {component}")]
    StartupCheckFailed { component: String },

    // ── Phases 4-15 stubs ─────────────────────────────────────────────────────
    #[error("Distributed storage error: {0}")]
    DistributedStorageError(String),
    #[error("Messaging error: {0}")]
    MessagingError(String),
    #[error("Marketplace error: {0}")]
    MarketplaceError(String),
    #[error("Payment error: {0}")]
    PaymentError(String),
    #[error("Reputation error: {0}")]
    ReputationError(String),
    #[error("Social error: {0}")]
    SocialError(String),
    #[error("Wager error: {0}")]
    WagerError(String),
    #[error("AI error: {0}")]
    AiError(String),

    // ── General ───────────────────────────────────────────────────────────────
    #[error("Not implemented: {0}")]
    NotImplemented(String),
    #[error("Timestamp error")]
    TimestampFailed,
    #[error("IO error: {0}")]
    IoError(String),
    #[error("Serialization error: {0}")]
    SerializationError(String),
}

// ── Conversions ──────────────────────────────────────────────────────────────

impl From<std::io::Error> for AppError {
    fn from(e: std::io::Error) -> Self {
        AppError::IoError(e.to_string())
    }
}

impl From<serde_json::Error> for AppError {
    fn from(e: serde_json::Error) -> Self {
        AppError::SerializationError(e.to_string())
    }
}

impl From<rusqlite::Error> for AppError {
    fn from(e: rusqlite::Error) -> Self {
        AppError::DatabaseError(e.to_string())
    }
}

impl From<String> for AppError {
    fn from(s: String) -> Self {
        AppError::NetworkError(s)
    }
}

impl From<AppError> for String {
    fn from(e: AppError) -> Self {
        e.to_string()
    }
}

// Module error conversions
impl From<crate::core::crypto::errors::CryptoError> for AppError {
    fn from(e: crate::core::crypto::errors::CryptoError) -> Self {
        match e {
            crate::core::crypto::errors::CryptoError::InvalidNonce { expected, got } => {
                AppError::InvalidNonce { expected, got }
            }
            crate::core::crypto::errors::CryptoError::EncryptionFailed(m) => {
                AppError::EncryptionFailed(m)
            }
            crate::core::crypto::errors::CryptoError::DecryptionFailed => {
                AppError::DecryptionFailed
            }
            crate::core::crypto::errors::CryptoError::KeyGenerationFailed(m) => {
                AppError::KeyGenerationFailed(m)
            }
            crate::core::crypto::errors::CryptoError::InvalidKeyLength { expected, got } => {
                AppError::InvalidKeyLength { expected, got }
            }
        }
    }
}

impl From<crate::core::database::errors::DatabaseError> for AppError {
    fn from(e: crate::core::database::errors::DatabaseError) -> Self {
        AppError::DatabaseError(e.to_string())
    }
}

impl From<crate::core::identity::errors::IdentityError> for AppError {
    fn from(e: crate::core::identity::errors::IdentityError) -> Self {
        AppError::IdentityGenerationFailed(e.to_string())
    }
}

impl From<crate::core::vault::errors::VaultError> for AppError {
    fn from(e: crate::core::vault::errors::VaultError) -> Self {
        AppError::VaultEncryptionFailed(e.to_string())
    }
}

impl From<crate::core::network::errors::NetworkError> for AppError {
    fn from(e: crate::core::network::errors::NetworkError) -> Self {
        AppError::NetworkError(e.to_string())
    }
}
