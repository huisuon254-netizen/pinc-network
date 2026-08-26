use crate::core::network::errors::NetworkError;
use std::{
    sync::{Arc, Mutex},
    time::{SystemTime, UNIX_EPOCH},
};

pub const MAX_BUNDLE_SIZE: usize = 16 * 1024 * 1024;
pub const DEFAULT_TTL_SECS: u64 = 3600;
pub const MAX_HOP_COUNT: u8 = 32;

#[derive(Debug, Clone)]
pub struct DtnBundle {
    pub bundle_id: String,
    pub source: String,
    pub destination: String,
    pub payload: Vec<u8>,
    pub creation_timestamp: i64,
    pub ttl_secs: u64,
    pub hop_count: u8,
    pub custody: bool,
    pub custodian: Option<String>,
}

#[derive(Debug, Clone)]
pub struct CustodySignal {
    pub bundle_id: String,
    pub custodian: String,
    pub accepted: bool,
    pub timestamp: i64,
}

#[derive(Debug, Clone)]
struct BundleEntry {
    bundle: DtnBundle,
    received_at: i64,
    retries: u8,
}

#[derive(Clone)]
pub struct DtnEngine {
    pending_bundles: Arc<Mutex<Vec<BundleEntry>>>,
    delivered_bundles: Arc<Mutex<Vec<String>>>,
    custody_received: Arc<Mutex<Vec<CustodySignal>>>,
    node_id: String,
}

impl DtnEngine {
    pub fn new(node_id: &str) -> Self {
        DtnEngine {
            pending_bundles: Arc::new(Mutex::new(Vec::new())),
            delivered_bundles: Arc::new(Mutex::new(Vec::new())),
            custody_received: Arc::new(Mutex::new(Vec::new())),
            node_id: node_id.to_string(),
        }
    }

    pub fn create_bundle(
        &self,
        destination: &str,
        payload: &[u8],
        ttl_secs: u64,
        custody: bool,
    ) -> Result<DtnBundle, NetworkError> {
        if payload.len() > MAX_BUNDLE_SIZE {
            return Err(NetworkError::RelayFailed("bundle exceeds max size".into()));
        }
        let bundle_id = uuid::Uuid::new_v4().to_string();
        let now = now_secs();
        Ok(DtnBundle {
            bundle_id,
            source: self.node_id.clone(),
            destination: destination.to_string(),
            payload: payload.to_vec(),
            creation_timestamp: now,
            ttl_secs,
            hop_count: 0,
            custody,
            custodian: None,
        })
    }

    pub fn receive_bundle(&self, bundle: DtnBundle) -> Result<Option<CustodySignal>, NetworkError> {
        let now = now_secs();
        if bundle.creation_timestamp + (bundle.ttl_secs as i64) < now {
            return Err(NetworkError::RelayFailed("bundle expired".into()));
        }
        if bundle.hop_count >= MAX_HOP_COUNT {
            return Err(NetworkError::RelayFailed("max hop count reached".into()));
        }
        if self.is_delivered(&bundle.bundle_id) {
            return Ok(None);
        }
        let mut bundle = bundle;
        bundle.hop_count += 1;
        let custody_signal = if bundle.custody && bundle.custodian.is_none() {
            bundle.custodian = Some(self.node_id.clone());
            Some(CustodySignal {
                bundle_id: bundle.bundle_id.clone(),
                custodian: self.node_id.clone(),
                accepted: true,
                timestamp: now,
            })
        } else {
            None
        };
        let mut pending = self.pending_bundles.lock().unwrap();
        if !pending
            .iter()
            .any(|e| e.bundle.bundle_id == bundle.bundle_id)
        {
            pending.push(BundleEntry {
                bundle,
                received_at: now,
                retries: 0,
            });
        }
        Ok(custody_signal)
    }

    pub fn bundles_for_peer(&self, peer_id: &str) -> Vec<DtnBundle> {
        let mut pending = self.pending_bundles.lock().unwrap();
        self.expire_stale(&mut pending);
        let mut out = Vec::new();
        let mut i = 0;
        while i < pending.len() {
            if pending[i].bundle.destination == peer_id || pending[i].bundle.destination == *"*" {
                let bundle = pending.remove(i);
                out.push(bundle.bundle);
            } else {
                i += 1;
            }
        }
        out
    }

    pub fn forwardable_bundles(&self) -> Vec<DtnBundle> {
        let mut pending = self.pending_bundles.lock().unwrap();
        self.expire_stale(&mut pending);
        pending
            .iter()
            .filter(|e| e.bundle.destination != self.node_id)
            .take(50)
            .map(|e| e.bundle.clone())
            .collect()
    }

    pub fn process_custody_signal(&self, signal: CustodySignal) {
        if signal.accepted {
            let mut pending = self.pending_bundles.lock().unwrap();
            pending.retain(|e| e.bundle.bundle_id != signal.bundle_id);
        }
        self.custody_received.lock().unwrap().push(signal);
    }

    pub fn mark_delivered(&self, bundle_id: &str) {
        let mut pending = self.pending_bundles.lock().unwrap();
        pending.retain(|e| e.bundle.bundle_id != bundle_id);
        self.delivered_bundles
            .lock()
            .unwrap()
            .push(bundle_id.to_string());
    }

    pub fn is_delivered(&self, bundle_id: &str) -> bool {
        self.delivered_bundles
            .lock()
            .unwrap()
            .contains(&bundle_id.to_string())
    }

    pub fn bundle_count(&self) -> usize {
        self.pending_bundles.lock().unwrap().len()
    }

    pub fn pending_bundles(&self) -> Vec<DtnBundle> {
        let pending = self.pending_bundles.lock().unwrap();
        pending.iter().map(|e| e.bundle.clone()).collect()
    }

    fn expire_stale(&self, pending: &mut Vec<BundleEntry>) {
        let now = now_secs();
        pending.retain(|e| {
            let expires = e.bundle.creation_timestamp + (e.bundle.ttl_secs as i64);
            now < expires
        });
    }
}

fn now_secs() -> i64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs() as i64
}
