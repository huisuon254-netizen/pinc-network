use thiserror::Error;
#[derive(Debug, Error)]
pub enum MessagingError {
    #[error("Encryption failed: {0}")] EncryptionFailed(String),
    #[error("Peer offline: {0}")] PeerOffline(String),
    #[error("Message too large: {size} bytes (max {max})")] TooLarge { size: usize, max: usize },
    #[error("Conversation not found: {0}")] ConversationNotFound(String),
    #[error("Queue full for peer: {0}")] QueueFull(String),
    #[error("Invalid recipient: {0}")] InvalidRecipient(String),
    #[error("Call failed: {0}")] CallFailed(String),
    #[error("Media error: {0}")] MediaError(String),
    #[error("Decode failed: {0}")] DecodeFailed(String),
}
