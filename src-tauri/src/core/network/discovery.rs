use crate::core::network::{
    errors::NetworkError,
    types::{DiscoveredPeer, PeerSource},
};
use std::net::SocketAddr;

pub struct Discovery {
    bootstrap_nodes: Vec<String>,
    known_peers: Vec<DiscoveredPeer>,
}

impl Discovery {
    pub fn new() -> Self {
        Discovery {
            bootstrap_nodes: vec![
                "127.0.0.1:9000".to_string(),
                "127.0.0.1:9001".to_string(),
                "127.0.0.1:9002".to_string(),
            ],
            known_peers: Vec::new(),
        }
    }

    pub fn add_bootstrap(&mut self, addr: &str) {
        if !self.bootstrap_nodes.contains(&addr.to_string()) {
            self.bootstrap_nodes.push(addr.to_string());
        }
    }

    pub fn bootstrap_addrs(&self) -> &[String] {
        &self.bootstrap_nodes
    }

    pub fn set_bootstrap_nodes(&mut self, nodes: Vec<String>) {
        self.bootstrap_nodes = nodes;
    }

    pub fn parse_peer_announcement(data: &[u8]) -> Result<DiscoveredPeer, NetworkError> {
        serde_json::from_slice(data).map_err(|e| NetworkError::DiscoveryFailed(e.to_string()))
    }

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
    fn default() -> Self {
        Self::new()
    }
}

pub fn parse_addr(s: &str) -> Result<SocketAddr, NetworkError> {
    s.parse::<SocketAddr>()
        .map_err(|_| NetworkError::DiscoveryFailed(format!("invalid address: {}", s)))
}

pub fn dht_key_for_node(node_id: &str) -> Vec<u8> {
    use sha2::{Digest, Sha256};
    Sha256::digest(node_id.as_bytes()).to_vec()
}

/// Detect the local IP address by binding a UDP socket to a public endpoint
pub fn get_local_ip() -> Option<String> {
    let socket = std::net::UdpSocket::bind("0.0.0.0:0").ok()?;
    socket.connect("8.8.8.8:80").ok()?;
    Some(socket.local_addr().ok()?.ip().to_string())
}

/// Get the subnet prefix from an IP address (e.g., "192.168.1" from "192.168.1.42")
pub fn get_subnet_prefix(ip: &str) -> String {
    ip.rsplit_once('.')
        .map(|(prefix, _)| prefix.to_string())
        .unwrap_or_else(|| "192.168.1".to_string())
}

/// Get common default gateway addresses to try first
pub fn common_gateway_addresses(subnet: &str) -> Vec<SocketAddr> {
    vec![
        format!("{}.1:9000", subnet).parse().unwrap(),
        format!("{}.254:9000", subnet).parse().unwrap(),
        format!("{}.2:9000", subnet).parse().unwrap(),
    ]
}

/// Get the local subnet as a list of socket addresses to scan on a given port
pub fn local_scan_addrs_for_subnet(subnet: &str, port: u16) -> Vec<SocketAddr> {
    (1u8..=254)
        .filter_map(|i| format!("{}.{}:{}", subnet, i, port).parse().ok())
        .collect()
}
