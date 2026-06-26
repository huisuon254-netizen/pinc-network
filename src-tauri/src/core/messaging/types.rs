use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum MessageStatus {
    Sending,
    Sent,
    Delivered,
    Read,
    Failed,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum MessageType {
    Text,
    Image,
    File,
    Audio,
    Video,
    System,
    Encrypted,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Message {
    pub id: String,
    pub conversation_id: String,
    pub sender_id: String,
    pub recipient_id: String,
    pub msg_type: MessageType,
    pub content: Vec<u8>, // encrypted bytes
    pub content_hash: String,
    pub status: MessageStatus,
    pub sent_at: i64,
    pub delivered_at: Option<i64>,
    pub read_at: Option<i64>,
    pub reply_to: Option<String>,
    pub media_ref: Option<String>, // vault file id for media
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Conversation {
    pub id: String,
    pub participants: Vec<String>, // node IDs
    pub name: Option<String>,
    pub is_group: bool,
    pub created_at: i64,
    pub last_message_at: i64,
    pub unread_count: u64,
    pub encrypted: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CallSession {
    pub id: String,
    pub caller_id: String,
    pub callee_id: String,
    pub call_type: CallType,
    pub status: CallStatus,
    pub started_at: Option<i64>,
    pub ended_at: Option<i64>,
    pub duration_seconds: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum CallType {
    Voice,
    Video,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum CallStatus {
    Ringing,
    Active,
    Ended,
    Missed,
    Rejected,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OfflineMessageQueue {
    pub node_id: String,
    pub queued_messages: Vec<Message>,
    pub max_queue_size: usize,
}

impl OfflineMessageQueue {
    pub fn new(node_id: &str) -> Self {
        OfflineMessageQueue {
            node_id: node_id.to_string(),
            queued_messages: Vec::new(),
            max_queue_size: 1000,
        }
    }
    pub fn enqueue(&mut self, msg: Message) -> bool {
        if self.queued_messages.len() >= self.max_queue_size {
            return false;
        }
        self.queued_messages.push(msg);
        true
    }
    pub fn drain(&mut self) -> Vec<Message> {
        std::mem::take(&mut self.queued_messages)
    }
    pub fn len(&self) -> usize {
        self.queued_messages.len()
    }
}
