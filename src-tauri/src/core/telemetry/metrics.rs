use std::sync::{Arc, Mutex};
use crate::core::telemetry::types::NodeMetrics;

pub struct MetricsCollector { inner: Arc<Mutex<NodeMetrics>> }

impl MetricsCollector {
    pub fn new() -> Self { MetricsCollector { inner: Arc::new(Mutex::new(NodeMetrics::default())) } }
    pub fn inc_relayed(&self, bytes: u64) { let mut m = self.inner.lock().unwrap(); m.messages_relayed += 1; m.bytes_relayed += bytes; }
    pub fn inc_vault_op(&self) { self.inner.lock().unwrap().vault_operations += 1; }
    pub fn inc_peer_conn(&self) { self.inner.lock().unwrap().peer_connections += 1; }
    pub fn snapshot(&self) -> NodeMetrics { self.inner.lock().unwrap().clone() }
}

impl Default for MetricsCollector { fn default() -> Self { Self::new() } }
