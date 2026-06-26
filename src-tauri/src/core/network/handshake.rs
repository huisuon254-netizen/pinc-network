use crate::core::network::{errors::NetworkError, types::HandshakePayload};
use serde::{Deserialize, Serialize};
use std::time::{SystemTime, UNIX_EPOCH};

pub const PINC_PROTOCOL_VERSION: &str = "PINC/3.0";

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HandshakeAck {
    pub accepted: bool,
    pub node_id: String,
    pub public_key: String,
    pub version: String,
    pub timestamp: i64,
    pub reason: Option<String>,
}

/// Build the local handshake payload to send to a new peer
pub fn build_handshake(node_id: &str, public_key: &str) -> HandshakePayload {
    HandshakePayload {
        node_id: node_id.to_string(),
        public_key: public_key.to_string(),
        version: PINC_PROTOCOL_VERSION.to_string(),
        timestamp: SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs() as i64,
    }
}

/// Validate an incoming handshake payload
pub fn validate_handshake(payload: &HandshakePayload) -> Result<(), NetworkError> {
    if payload.node_id.is_empty() {
        return Err(NetworkError::HandshakeFailed("empty node_id".to_string()));
    }
    if payload.public_key.is_empty() {
        return Err(NetworkError::HandshakeFailed(
            "empty public_key".to_string(),
        ));
    }
    if !payload.version.starts_with("PINC/") {
        return Err(NetworkError::HandshakeFailed(format!(
            "unknown protocol version: {}",
            payload.version
        )));
    }
    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs() as i64;
    if (now - payload.timestamp).abs() > 300 {
        return Err(NetworkError::HandshakeFailed(
            "handshake timestamp too far from local clock".to_string(),
        ));
    }
    Ok(())
}

/// Serialize handshake to bytes for sending over QUIC stream
pub fn serialize_handshake(payload: &HandshakePayload) -> Result<Vec<u8>, NetworkError> {
    serde_json::to_vec(payload).map_err(|e| NetworkError::HandshakeFailed(e.to_string()))
}

/// Deserialize received bytes into a handshake payload
pub fn deserialize_handshake(bytes: &[u8]) -> Result<HandshakePayload, NetworkError> {
    serde_json::from_slice(bytes).map_err(|e| NetworkError::HandshakeFailed(e.to_string()))
}

/// Build an ack response
pub fn build_ack(
    node_id: &str,
    public_key: &str,
    accepted: bool,
    reason: Option<String>,
) -> HandshakeAck {
    HandshakeAck {
        accepted,
        node_id: node_id.to_string(),
        public_key: public_key.to_string(),
        version: PINC_PROTOCOL_VERSION.to_string(),
        timestamp: SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs() as i64,
        reason,
    }
}
