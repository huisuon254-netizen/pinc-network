use std::net::{SocketAddr, IpAddr, Ipv4Addr};
use crate::core::network::{errors::NetworkError, types::{DiscoveredPeer, PeerSource}};

/// Known bootstrap nodes — replace with real IPs in production
pub const BOOTSTRAP_NODES: &[&str] = &[
    "bootstrap1.pinc.network:9000",
    "bootstrap2.pinc.network:9000",
    "bootstrap3.pinc.network:9000",
];

pub struct Discovery {
    bootstrap_nodes: Vec<String>,
    known_peers: Vec<DiscoveredPeer>,
}

impl Discovery {
    pub fn new() -> Self {
        Discovery {
            bootstrap_nodes: BOOTSTRAP_NODES.iter().map(|s| s.to_string()).collect(),
            known_peers: Vec::new(),
        }
    }

    /// Add a custom bootstrap node
    pub fn add_bootstrap(&mut self, addr: &str) {
        self.bootstrap_nodes.push(addr.to_string());
    }

    /// Returns list of bootstrap addresses to try
    pub fn bootstrap_addrs(&self) -> &[String] {
        &self.bootstrap_nodes
    }

    /// Scan local network for PINC nodes on port 9000
    pub fn local_scan_addrs(&self) -> Vec<SocketAddr> {
        // Scan 192.168.1.1 - 192.168.1.254 on port 9000
        (1u8..=254)
            .map(|i| SocketAddr::new(IpAddr::V4(Ipv4Addr::new(192, 168, 1, i)), 9000))
            .collect()
    }

    /// Parse a peer announcement payload
    pub fn parse_peer_announcement(data: &[u8]) -> Result<DiscoveredPeer, NetworkError> {
        serde_json::from_slice(data)
            .map_err(|e| NetworkError::DiscoveryFailed(e.to_string()))
    }

    /// Serialize this node as a peer announcement
    pub fn build_announcement(node_id: &str, public_key: &str, addr: &str) -> Vec<u8> {
        let peer = DiscoveredPeer {
            address: addr.to_string(),
            node_id: node_id.to_string(),
            public_key: public_key.to_string(),
            source: PeerSource::Bootstrap,
        };
        serde_json::to_vec(&peer).unwrap_or_default()
    }

    pub fn add_discovered(&mut self, peer: DiscoveredPeer) {
        if !self.known_peers.iter().any(|p| p.node_id == peer.node_id) {
            self.known_peers.push(peer);
        }
    }

    pub fn known_peers(&self) -> &[DiscoveredPeer] {
        &self.known_peers
    }
}

impl Default for Discovery {
    fn default() -> Self { Self::new() }
}

/// Parse "host:port" string into SocketAddr
pub fn parse_addr(s: &str) -> Result<SocketAddr, NetworkError> {
    s.parse::<SocketAddr>()
        .map_err(|_| NetworkError::DiscoveryFailed(format!("invalid address: {}", s)))
}

/// Simple DHT key for peer lookup (stub — Phase 3B)
pub fn dht_key_for_node(node_id: &str) -> Vec<u8> {
    use sha2::{Sha256, Digest};
    Sha256::digest(node_id.as_bytes()).to_vec()
}
