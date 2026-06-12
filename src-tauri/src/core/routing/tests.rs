#[cfg(test)]
mod tests {
    use std::collections::HashMap;
    use crate::core::routing::{
        engine::{find_shortest_path, prune_stale_routes, select_region},
        types::{RegionConfig, Route, RoutingTable},
    };

    fn make_table(node: &str, dest: &str, lat: u64) -> RoutingTable {
        RoutingTable {
            node_id: node.to_string(),
            routes: vec![Route {
                destination: dest.to_string(), next_hop: dest.to_string(),
                hops: 1, latency_ms: lat, bandwidth_kbps: 10_000.0,
                reliability: 0.99, last_verified: 1700000000,
            }],
            updated_at: 1700000000,
        }
    }

    #[test]
    fn test_direct_path_found() {
        let mut tables = HashMap::new();
        tables.insert("a".to_string(), make_table("a", "b", 20));
        tables.insert("b".to_string(), make_table("b", "c", 30));
        let path = find_shortest_path("a", "b", &tables).unwrap();
        assert_eq!(path.hops, vec!["a", "b"]);
        assert_eq!(path.total_latency_ms, 20);
    }

    #[test]
    fn test_multi_hop_path() {
        let mut tables = HashMap::new();
        tables.insert("a".to_string(), make_table("a", "b", 10));
        tables.insert("b".to_string(), make_table("b", "c", 15));
        let path = find_shortest_path("a", "c", &tables).unwrap();
        assert_eq!(path.hops, vec!["a", "b", "c"]);
        assert_eq!(path.total_latency_ms, 25);
    }

    #[test]
    fn test_no_path_returns_none() {
        let tables = HashMap::new();
        assert!(find_shortest_path("a", "z", &tables).is_none());
    }

    #[test]
    fn test_select_least_loaded_region() {
        let regions = vec![
            RegionConfig { region_id: "us".to_string(), name: "US East".to_string(), seed_nodes: vec![], load: 0.8, node_count: 100 },
            RegionConfig { region_id: "eu".to_string(), name: "EU West".to_string(), seed_nodes: vec![], load: 0.3, node_count: 80 },
        ];
        let selected = select_region(&regions).unwrap();
        assert_eq!(selected.region_id, "eu");
    }

    #[test]
    fn test_prune_stale_routes() {
        let mut table = make_table("a", "b", 10);
        table.routes[0].last_verified = 0; // very old
        prune_stale_routes(&mut table, 86400);
        assert!(table.routes.is_empty());
    }

    #[test]
    fn test_fresh_routes_not_pruned() {
        let mut table = make_table("a", "b", 10);
        // last_verified = 1700000000 which is in the past but within 10 years
        prune_stale_routes(&mut table, i64::MAX);
        assert_eq!(table.routes.len(), 1);
    }
}
