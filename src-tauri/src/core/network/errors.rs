use thiserror::Error;

#[derive(Debug, Error)]
pub enum NetworkError {
    #[error("Bind failed: {0}")]
    BindFailed(String),
    #[error("TLS config failed: {0}")]
    TlsConfigFailed(String),
    #[error("Connection failed to {addr}: {reason}")]
    ConnectionFailed { addr: String, reason: String },
    #[error("Handshake failed: {0}")]
    HandshakeFailed(String),
    #[error("Peer not found: {0}")]
    PeerNotFound(String),
    #[error("Send failed: {0}")]
    SendFailed(String),
    #[error("Receive failed: {0}")]
    ReceiveFailed(String),
    #[error("Discovery failed: {0}")]
    DiscoveryFailed(String),
    #[error("Relay failed: {0}")]
    RelayFailed(String),
    #[error("Bandwidth limit exceeded")]
    BandwidthExceeded,
    #[error("Certificate error: {0}")]
    CertError(String),
    #[error("Crypto error: {0}")]
    CryptoFailed(String),
}
