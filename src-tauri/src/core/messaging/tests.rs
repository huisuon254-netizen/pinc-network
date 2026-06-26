#[cfg(test)]
mod tests {
    use crate::core::messaging::{
        encryption::{decrypt_message, encrypt_message, MAX_MESSAGE_BYTES},
        router::MessageRouter,
        types::{Message, MessageStatus, MessageType, OfflineMessageQueue},
    };
    use uuid::Uuid;

    fn mock_message(sender: &str, recipient: &str) -> Message {
        Message {
            id: Uuid::new_v4().to_string(),
            conversation_id: "conv-1".to_string(),
            sender_id: sender.to_string(),
            recipient_id: recipient.to_string(),
            msg_type: MessageType::Text,
            content: b"hello".to_vec(),
            content_hash: "abc".to_string(),
            status: MessageStatus::Sending,
            sent_at: 1700000000,
            delivered_at: None,
            read_at: None,
            reply_to: None,
            media_ref: None,
        }
    }

    #[test]
    fn test_encrypt_decrypt_roundtrip() {
        let sender_key = [1u8; 32];
        let recipient_key = [2u8; 32];
        let msg = b"hello secure world";
        let enc = encrypt_message(msg, &sender_key, &recipient_key).unwrap();
        let dec = decrypt_message(&enc, &recipient_key, &sender_key).unwrap();
        assert_eq!(&dec, msg);
    }

    #[test]
    fn test_message_too_large() {
        let big = vec![0u8; MAX_MESSAGE_BYTES + 1];
        let result = encrypt_message(&big, &[1u8; 32], &[2u8; 32]);
        assert!(result.is_err());
    }

    #[test]
    fn test_offline_queue_enqueue_drain() {
        let mut q = OfflineMessageQueue::new("node-x");
        let msg = mock_message("sender", "node-x");
        assert!(q.enqueue(msg));
        assert_eq!(q.len(), 1);
        let drained = q.drain();
        assert_eq!(drained.len(), 1);
        assert_eq!(q.len(), 0);
    }

    #[test]
    fn test_router_queues_offline() {
        let mut router = MessageRouter::new();
        let msg = mock_message("sender", "node-y");
        router.route(msg, false).unwrap();
        assert_eq!(router.queue_depth("node-y"), 1);
    }

    #[test]
    fn test_router_online_no_queue() {
        let mut router = MessageRouter::new();
        let msg = mock_message("sender", "node-z");
        router.route(msg, true).unwrap();
        assert_eq!(router.queue_depth("node-z"), 0);
    }

    #[test]
    fn test_drain_queue_for_reconnected_peer() {
        let mut router = MessageRouter::new();
        for _ in 0..3 {
            let msg = mock_message("sender", "node-a");
            router.route(msg, false).unwrap();
        }
        let msgs = router.drain_queue("node-a");
        assert_eq!(msgs.len(), 3);
        assert_eq!(router.queue_depth("node-a"), 0);
    }

    #[test]
    fn test_encrypt_produces_different_output_each_time() {
        let k1 = [1u8; 32];
        let k2 = [2u8; 32];
        let msg = b"same message";
        let enc1 = encrypt_message(msg, &k1, &k2).unwrap();
        let enc2 = encrypt_message(msg, &k1, &k2).unwrap();
        assert_ne!(enc1, enc2); // nonce randomness
    }
}
