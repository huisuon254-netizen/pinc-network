#[cfg(test)]
mod tests {
    use crate::core::network::{
        handshake::{build_handshake, validate_handshake, serialize_handshake, deserialize_handshake},
        peer::{PeerRegistry, compute_trust_score},
        relay::{RelayManager, validate_relay_request},
        bandwidth::BandwidthMonitor,
        discovery::Discovery,
        types::{RelayRequest, PeerInfo},
    };

    fn mock_peer(id: &str) -> PeerInfo {
        PeerInfo { id: id.to_string(), address: "127.0.0.1:9000".to_string(),
            public_key: "key".to_string(), latency_ms: 50, trust_score: 0.8,
            relay_score: 0.7, online: true, last_seen: 1700000000 }
    }

    #[test]
    fn test_handshake_build_and_validate() {
        let h = build_handshake("PINC-AB-1234", "pubkey123");
        assert!(validate_handshake(&h).is_ok());
    }

    #[test]
    fn test_handshake_empty_node_id_fails() {
        let mut h = build_handshake("", "pubkey");
        assert!(validate_handshake(&h).is_err());
    }

    #[test]
    fn test_handshake_serialize_deserialize() {
        let h = build_handshake("PINC-AB-1234", "mypubkey");
        let bytes = serialize_handshake(&h).unwrap();
        let h2 = deserialize_handshake(&bytes).unwrap();
        assert_eq!(h.node_id, h2.node_id);
        assert_eq!(h.public_key, h2.public_key);
    }

    #[test]
    fn test_peer_registry_add_and_get() {
        let reg = PeerRegistry::new();
        reg.add_peer(mock_peer("peer-1"));
        assert!(reg.get_peer("peer-1").is_some());
        assert!(reg.get_peer("peer-2").is_none());
    }

    #[test]
    fn test_peer_registry_online_count() {
        let reg = PeerRegistry::new();
        reg.add_peer(mock_peer("p1"));
        reg.add_peer(mock_peer("p2"));
        assert_eq!(reg.online_count(), 2);
        reg.mark_offline("p1");
        assert_eq!(reg.online_count(), 1);
    }

    #[test]
    fn test_trust_score_high_latency() {
        let score = compute_trust_score(1000, 99.0, 0);
        assert!(score < 0.8);
    }

    #[test]
    fn test_trust_score_low_latency() {
        let score = compute_trust_score(20, 99.0, 0);
        assert!(score > 0.7);
    }

    #[test]
    fn test_relay_manager_session() {
        let mgr = RelayManager::new(1000.0);
        let sid = mgr.open_session("node-a", "node-b");
        assert!(mgr.record_relay(&sid, 1024).is_ok());
        assert_eq!(mgr.total_bytes(), 1024);
        mgr.close_session(&sid);
        assert_eq!(mgr.active_sessions().len(), 0);
    }

    #[test]
    fn test_relay_request_validation_ok() {
        let req = RelayRequest { from_node: "a".into(), to_node: "b".into(), payload: vec![1,2,3], encrypted: true };
        assert!(validate_relay_request(&req).is_ok());
    }

    #[test]
    fn test_relay_request_empty_payload_fails() {
        let req = RelayRequest { from_node: "a".into(), to_node: "b".into(), payload: vec![], encrypted: true };
        assert!(validate_relay_request(&req).is_err());
    }

    #[test]
    fn test_bandwidth_monitor_records() {
        let mon = BandwidthMonitor::new();
        mon.record_sent(5000);
        mon.record_recv(3000);
        assert_eq!(mon.total_bytes_sent(), 5000);
        assert_eq!(mon.total_bytes_recv(), 3000);
    }

    #[test]
    fn test_discovery_bootstrap_addrs() {
        let d = Discovery::new();
        assert!(!d.bootstrap_addrs().is_empty());
    }

    #[test]
    fn test_discovery_dedup() {
        use crate::core::network::types::{DiscoveredPeer, PeerSource};
        let mut d = Discovery::new();
        let peer = DiscoveredPeer { address: "1.2.3.4:9000".into(), node_id: "PINC-XX-0001".into(), public_key: "k".into(), source: PeerSource::Bootstrap };
        d.add_discovered(peer.clone());
        d.add_discovered(peer);
        assert_eq!(d.known_peers().len(), 1);
    }
}
