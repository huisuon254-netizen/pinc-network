use std::collections::HashMap;
use crate::core::messaging::{errors::MessagingError, types::{Message, MessageStatus, OfflineMessageQueue}};

pub struct MessageRouter {
    offline_queues: HashMap<String, OfflineMessageQueue>,
}

impl MessageRouter {
    pub fn new() -> Self { MessageRouter { offline_queues: HashMap::new() } }

    /// Route a message — if recipient offline, queue it
    pub fn route(&mut self, msg: Message, recipient_online: bool) -> Result<(), MessagingError> {
        if recipient_online {
            // In Phase 5: send over QUIC transport
            Ok(())
        } else {
            self.queue_offline(msg)
        }
    }

    pub fn queue_offline(&mut self, msg: Message) -> Result<(), MessagingError> {
        let queue = self.offline_queues
            .entry(msg.recipient_id.clone())
            .or_insert_with(|| OfflineMessageQueue::new(&msg.recipient_id));
        if !queue.enqueue(msg.clone()) {
            return Err(MessagingError::QueueFull(msg.recipient_id));
        }
        Ok(())
    }

    pub fn drain_queue(&mut self, node_id: &str) -> Vec<Message> {
        self.offline_queues.get_mut(node_id)
            .map(|q| q.drain())
            .unwrap_or_default()
    }

    pub fn queue_depth(&self, node_id: &str) -> usize {
        self.offline_queues.get(node_id).map(|q| q.len()).unwrap_or(0)
    }
}

impl Default for MessageRouter { fn default() -> Self { Self::new() } }
