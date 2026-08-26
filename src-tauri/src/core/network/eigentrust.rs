use std::collections::HashMap;

pub const DEFAULT_ALPHA: f64 = 0.5;
pub const MIN_TRUST: f64 = 0.0;
pub const MAX_TRUST: f64 = 1.0;
pub const TRUST_THRESHOLD: f64 = 0.3;

#[derive(Debug, Clone)]
pub struct TrustScore {
    pub node_id: String,
    pub local_score: f64,
    pub global_score: f64,
    pub interactions: u64,
    pub successful_relays: u64,
    pub failed_relays: u64,
}

pub struct EigenTrustEngine {
    alpha: f64,
    local_trust: HashMap<String, HashMap<String, f64>>,
    global_trust: HashMap<String, f64>,
    pretrusted: Vec<String>,
    node_id: String,
}

impl EigenTrustEngine {
    pub fn new(node_id: &str) -> Self {
        EigenTrustEngine {
            alpha: DEFAULT_ALPHA,
            local_trust: HashMap::new(),
            global_trust: HashMap::new(),
            pretrusted: Vec::new(),
            node_id: node_id.to_string(),
        }
    }

    pub fn set_pretrusted(&mut self, nodes: Vec<String>) {
        for id in &nodes {
            self.global_trust.insert(id.clone(), MAX_TRUST);
        }
        self.pretrusted = nodes;
    }

    pub fn report_interaction(&mut self, peer: &str, success: bool) {
        let entry = self.local_trust.entry(self.node_id.clone()).or_default();
        let score = entry.entry(peer.to_string()).or_insert(0.0);
        if success {
            *score = (*score + 0.1).min(MAX_TRUST);
        } else {
            *score = (*score - 0.2).max(MIN_TRUST);
        }
    }

    pub fn get_local_score(&self, peer: &str) -> f64 {
        self.local_trust
            .get(&self.node_id)
            .and_then(|m| m.get(peer))
            .copied()
            .unwrap_or(0.5)
    }

    pub fn get_global_score(&self, peer: &str) -> f64 {
        self.global_trust.get(peer).copied().unwrap_or(0.5)
    }

    pub fn get_trust_score(&self, peer: &str) -> TrustScore {
        let local = self.get_local_score(peer);
        let global = self.get_global_score(peer);
        TrustScore {
            node_id: peer.to_string(),
            local_score: local,
            global_score: global,
            interactions: 0,
            successful_relays: 0,
            failed_relays: 0,
        }
    }

    pub fn compute_global(&mut self, peers: &[String]) {
        let n = peers.len();
        if n == 0 {
            return;
        }
        let mut t_k = HashMap::<String, f64>::new();
        for id in peers {
            t_k.insert(id.clone(), 1.0 / n as f64);
        }
        for _ in 0..10 {
            let mut t_next = HashMap::new();
            for j in peers {
                let mut sum = 0.0;
                for i in peers {
                    let trust_ij = self
                        .local_trust
                        .get(i)
                        .and_then(|m| m.get(j))
                        .copied()
                        .unwrap_or(0.0);
                    let t_i = t_k.get(i).copied().unwrap_or(0.0);
                    sum += trust_ij * t_i;
                }
                let pj = if self.pretrusted.contains(j) {
                    1.0 / self.pretrusted.len() as f64
                } else {
                    0.0
                };
                t_next.insert(j.clone(), (1.0 - self.alpha) * sum + self.alpha * pj);
            }
            t_k = t_next;
        }
        for (id, score) in t_k {
            self.global_trust.insert(id, score);
        }
    }

    pub fn is_trusted(&self, peer: &str) -> bool {
        self.get_global_score(peer) >= TRUST_THRESHOLD
    }
}
