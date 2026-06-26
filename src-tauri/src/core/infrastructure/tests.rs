#[cfg(test)]
mod tests {
    use crate::core::infrastructure::types::{
        BootstrapNode, GlobalNetworkState, LoadBalancer, RegionLoad,
    };

    fn mock_bootstrap(id: &str, active: bool) -> BootstrapNode {
        BootstrapNode {
            id: id.to_string(),
            address: "1.2.3.4:9000".to_string(),
            region: "us-east".to_string(),
            public_key: "key".to_string(),
            active,
            latency_ms: Some(20),
            node_count_served: 1000,
            uptime_pct: 99.9,
        }
    }

    #[test]
    fn test_active_bootstrap_filter() {
        let nodes = vec![
            mock_bootstrap("b1", true),
            mock_bootstrap("b2", false),
            mock_bootstrap("b3", true),
        ];
        let active: Vec<_> = nodes.iter().filter(|n| n.active).collect();
        assert_eq!(active.len(), 2);
    }

    #[test]
    fn test_global_state_totals() {
        let state = GlobalNetworkState {
            total_nodes: 10_000,
            active_nodes: 8_500,
            total_peers: 250_000,
            total_storage_gb: 50_000.0,
            used_storage_gb: 12_000.0,
            total_bandwidth_tbps: 1.2,
            regions: vec!["us".to_string(), "eu".to_string()],
            snapshot_at: 1700000000,
        };
        assert_eq!(state.total_nodes, 10_000);
        assert!(state.used_storage_gb < state.total_storage_gb);
    }

    #[test]
    fn test_load_balancer_least_loaded() {
        let lb = LoadBalancer {
            regions: vec![
                RegionLoad {
                    region_id: "us".to_string(),
                    current_load: 0.7,
                    node_count: 100,
                    capacity_tbps: 1.0,
                },
                RegionLoad {
                    region_id: "eu".to_string(),
                    current_load: 0.3,
                    node_count: 80,
                    capacity_tbps: 0.8,
                },
                RegionLoad {
                    region_id: "ap".to_string(),
                    current_load: 0.9,
                    node_count: 60,
                    capacity_tbps: 0.6,
                },
            ],
            global_threshold: 0.8,
            rebalance_interval_secs: 300,
        };
        let best = lb
            .regions
            .iter()
            .min_by(|a, b| a.current_load.partial_cmp(&b.current_load).unwrap())
            .unwrap();
        assert_eq!(best.region_id, "eu");
    }
}
