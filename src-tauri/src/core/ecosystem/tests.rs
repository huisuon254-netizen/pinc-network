#[cfg(test)]
mod tests {
    use crate::core::ecosystem::types::*;

    #[test]
    fn test_ecosystem_status_fields() {
        let s = EcosystemStatus {
            phase: 15, network_nodes: 1_000_000, active_users: 500_000,
            total_storage_pb: 100.0, total_bandwidth_tbps: 50.0,
            active_jobs: 5000, total_escrow_value: 1_000_000.0,
            messages_relayed_total: 1_000_000_000, active_tournaments: 200,
            ai_agents_running: 50_000, regions_active: vec!["us".to_string(), "eu".to_string(), "ap".to_string()],
            health: EcosystemHealth::Healthy,
        };
        assert_eq!(s.phase, 15);
        assert_eq!(s.health, EcosystemHealth::Healthy);
        assert_eq!(s.regions_active.len(), 3);
    }

    #[test]
    fn test_event_priority_ordering() {
        assert!(EventPriority::Critical > EventPriority::High);
        assert!(EventPriority::High > EventPriority::Normal);
        assert!(EventPriority::Normal > EventPriority::Low);
    }

    #[test]
    fn test_platform_capabilities() {
        let cap = PlatformCapabilities {
            platform: Platform::Linux, supports_quic: true, supports_relay: true,
            supports_vault: true, supports_ai: true, supports_video_calls: true,
            max_storage_gb: 1000.0, max_bandwidth_kbps: 1_000_000.0,
        };
        assert_eq!(cap.platform, Platform::Linux);
        assert!(cap.supports_quic);
    }

    #[test]
    fn test_ecosystem_plugin() {
        let plugin = EcosystemPlugin {
            id: "p1".to_string(), name: "PINC Analytics".to_string(),
            version: "1.0.0".to_string(), author_node_id: "PINC-AA-0001".to_string(),
            description: "Real-time analytics".to_string(),
            hooks: vec!["JobCompleted".to_string(), "PaymentMade".to_string()],
            enabled: true, verified: true, install_count: 1500,
        };
        assert!(plugin.verified);
        assert_eq!(plugin.hooks.len(), 2);
    }
}
