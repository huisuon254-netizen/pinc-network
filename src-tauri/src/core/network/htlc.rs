use sha3::{Digest, Sha3_256};
use std::{
    collections::HashMap,
    sync::{Arc, Mutex},
    time::{SystemTime, UNIX_EPOCH},
};

pub const MICRO_PAY_PER_BYTE: u64 = 1;
pub const HTLC_TIMEOUT_SECS: u64 = 3600;
pub const MIN_CHANNEL_BALANCE: u64 = 1000;

#[derive(Debug, Clone)]
pub struct PaymentChannel {
    pub channel_id: String,
    pub from: String,
    pub to: String,
    pub balance: u64,
    pub capacity: u64,
    pub hash_lock: [u8; 32],
    pub preimage: Option<[u8; 32]>,
    pub expires_at: i64,
    pub active: bool,
}

#[derive(Debug, Clone)]
pub struct PaymentReceipt {
    pub bundle_id: String,
    pub from: String,
    pub to: String,
    pub amount: u64,
    pub bytes_relayed: u64,
    pub timestamp: i64,
}

pub struct HtlcEngine {
    channels: Arc<Mutex<HashMap<String, PaymentChannel>>>,
    receipts: Arc<Mutex<Vec<PaymentReceipt>>>,
    pending_claims: Arc<Mutex<Vec<String>>>,
    node_id: String,
}

impl HtlcEngine {
    pub fn new(node_id: &str) -> Self {
        HtlcEngine {
            channels: Arc::new(Mutex::new(HashMap::new())),
            receipts: Arc::new(Mutex::new(Vec::new())),
            pending_claims: Arc::new(Mutex::new(Vec::new())),
            node_id: node_id.to_string(),
        }
    }

    pub fn open_channel(&self, peer: &str, capacity: u64, hash_lock: [u8; 32]) -> PaymentChannel {
        let channel_id = uuid::Uuid::new_v4().to_string();
        let now = now_secs();
        let channel = PaymentChannel {
            channel_id: channel_id.clone(),
            from: self.node_id.clone(),
            to: peer.to_string(),
            balance: capacity,
            capacity,
            hash_lock,
            preimage: None,
            expires_at: now + HTLC_TIMEOUT_SECS as i64,
            active: true,
        };
        self.channels
            .lock()
            .unwrap()
            .insert(channel_id, channel.clone());
        channel
    }

    pub fn claim(&self, channel_id: &str, preimage: [u8; 32]) -> Result<u64, String> {
        let mut channels = self.channels.lock().unwrap();
        let channel = channels.get_mut(channel_id).ok_or("channel not found")?;
        if !channel.active {
            return Err("channel inactive".to_string());
        }
        let now = now_secs();
        if now > channel.expires_at {
            channel.active = false;
            return Err("channel expired".to_string());
        }
        let mut hasher = Sha3_256::new();
        hasher.update(preimage);
        let computed_lock: [u8; 32] = hasher.finalize().into();
        if computed_lock != channel.hash_lock {
            return Err("invalid preimage".to_string());
        }
        let payout = channel.balance;
        channel.balance = 0;
        channel.active = false;
        channel.preimage = Some(preimage);
        Ok(payout)
    }

    pub fn refund(&self, channel_id: &str) -> Result<u64, String> {
        let mut channels = self.channels.lock().unwrap();
        let channel = channels.get_mut(channel_id).ok_or("channel not found")?;
        if !channel.active {
            return Err("already claimed".to_string());
        }
        let now = now_secs();
        if now <= channel.expires_at {
            return Err("not yet expired".to_string());
        }
        let refund = channel.balance;
        channel.balance = 0;
        channel.active = false;
        Ok(refund)
    }

    pub fn pay_per_relay(&self, peer: &str, bytes: u64) -> Result<PaymentReceipt, String> {
        let amount = bytes * MICRO_PAY_PER_BYTE;
        let receipt = PaymentReceipt {
            bundle_id: uuid::Uuid::new_v4().to_string(),
            from: self.node_id.clone(),
            to: peer.to_string(),
            amount,
            bytes_relayed: bytes,
            timestamp: now_secs(),
        };
        self.receipts.lock().unwrap().push(receipt.clone());
        Ok(receipt)
    }

    pub fn channel_count(&self) -> usize {
        self.channels.lock().unwrap().len()
    }

    pub fn total_paid(&self) -> u64 {
        self.receipts.lock().unwrap().iter().map(|r| r.amount).sum()
    }
}

fn now_secs() -> i64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs() as i64
}
