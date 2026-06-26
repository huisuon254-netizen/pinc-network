use crate::core::network::{errors::NetworkError, types::PeerInfo};
use std::{
    collections::HashMap,
    sync::{Arc, Mutex},
    time::{SystemTime, UNIX_EPOCH},
};

pub struct PeerRegistry {
    peers: Arc<Mutex<HashMap<String, PeerInfo>>>,
}

impl PeerRegistry {
    pub fn new() -> Self {
        PeerRegistry {
            peers: Arc::new(Mutex::new(HashMap::new())),
        }
    }

    pub fn add_peer(&self, peer: PeerInfo) {
        let mut peers = self.peers.lock().unwrap();
        peers.insert(peer.id.clone(), peer);
    }

    pub fn remove_peer(&self, peer_id: &str) {
        self.peers.lock().unwrap().remove(peer_id);
    }

    pub fn get_peer(&self, peer_id: &str) -> Option<PeerInfo> {
        self.peers.lock().unwrap().get(peer_id).cloned()
    }

    pub fn list_peers(&self) -> Vec<PeerInfo> {
        self.peers.lock().unwrap().values().cloned().collect()
    }

    pub fn online_count(&self) -> usize {
        self.peers
            .lock()
            .unwrap()
            .values()
            .filter(|p| p.online)
            .count()
    }

    pub fn update_last_seen(&self, peer_id: &str) {
        let mut peers = self.peers.lock().unwrap();
        if let Some(peer) = peers.get_mut(peer_id) {
            peer.last_seen = SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .unwrap_or_default()
                .as_secs() as i64;
            peer.online = true;
        }
    }

    pub fn update_latency(&self, peer_id: &str, latency_ms: u64) {
        let mut peers = self.peers.lock().unwrap();
        if let Some(peer) = peers.get_mut(peer_id) {
            peer.latency_ms = latency_ms;
        }
    }

    pub fn mark_offline(&self, peer_id: &str) {
        let mut peers = self.peers.lock().unwrap();
        if let Some(peer) = peers.get_mut(peer_id) {
            peer.online = false;
        }
    }

    /// Return best relay peer by combined trust + relay score
    pub fn best_relay_peer(&self) -> Option<PeerInfo> {
        self.peers
            .lock()
            .unwrap()
            .values()
            .filter(|p| p.online)
            .max_by(|a, b| {
                let score_a = a.trust_score + a.relay_score;
                let score_b = b.trust_score + b.relay_score;
                score_a
                    .partial_cmp(&score_b)
                    .unwrap_or(std::cmp::Ordering::Equal)
            })
            .cloned()
    }
}

impl Default for PeerRegistry {
    fn default() -> Self {
        Self::new()
    }
}

/// Score a peer based on latency and reliability
pub fn compute_trust_score(latency_ms: u64, uptime_pct: f64, failed_relays: u64) -> f64 {
    let latency_score = if latency_ms < 50 {
        1.0
    } else if latency_ms < 150 {
        0.8
    } else if latency_ms < 500 {
        0.5
    } else {
        0.2
    };
    let uptime_score = uptime_pct / 100.0;
    let reliability = 1.0 - (failed_relays as f64 * 0.05).min(1.0);
    ((latency_score * 0.4) + (uptime_score * 0.4) + (reliability * 0.2)).min(1.0)
}
