#[cfg(test)]
mod tests {
    use crate::core::distributed::{
        chunker::{split_into_distributed_chunks, verify_chunk_integrity},
        replication::{node_score, replication_health, select_storage_nodes},
        storage_market::{contract_cost, create_contract, is_contract_valid},
        types::{StorageNode, CHUNK_SIZE_BYTES},
    };

    fn mock_node(id: &str, free_gb: u64) -> StorageNode {
        StorageNode {
            id: id.to_string(),
            address: "127.0.0.1:9000".to_string(),
            free_space_bytes: free_gb * 1024 * 1024 * 1024,
            used_space_bytes: 0,
            reputation: 0.9,
            uptime_pct: 99.0,
            online: true,
            last_seen: 0,
            chunks_hosted: 0,
        }
    }

    #[test]
    fn test_split_chunks_small_file() {
        let data = vec![0xAAu8; 1024];
        let (chunks, data_list) = split_into_distributed_chunks("file-1", &data).unwrap();
        assert_eq!(chunks.len(), 1);
        assert_eq!(data_list[0].len(), 1024);
    }

    #[test]
    fn test_split_chunks_large_file() {
        let data = vec![0xBBu8; CHUNK_SIZE_BYTES * 3 + 100];
        let (chunks, _) = split_into_distributed_chunks("file-2", &data).unwrap();
        assert_eq!(chunks.len(), 4);
    }

    #[test]
    fn test_chunk_integrity_ok() {
        let data = b"test chunk data";
        let (chunks, data_list) = split_into_distributed_chunks("f", data).unwrap();
        assert!(verify_chunk_integrity(&data_list[0], &chunks[0].hash));
    }

    #[test]
    fn test_chunk_integrity_tampered() {
        let (chunks, _) = split_into_distributed_chunks("f", b"data").unwrap();
        assert!(!verify_chunk_integrity(b"tampered", &chunks[0].hash));
    }

    #[test]
    fn test_select_storage_nodes_ok() {
        let nodes = vec![mock_node("n1", 10), mock_node("n2", 20), mock_node("n3", 5)];
        let selected = select_storage_nodes(&nodes, 1024, 2).unwrap();
        assert_eq!(selected.len(), 2);
    }

    #[test]
    fn test_select_nodes_insufficient() {
        let nodes = vec![mock_node("n1", 10)];
        assert!(select_storage_nodes(&nodes, 1024, 3).is_err());
    }

    #[test]
    fn test_node_score_range() {
        let n = mock_node("n1", 100);
        let score = node_score(&n);
        assert!(score >= 0.0 && score <= 1.0 + 1.0); // log2 term can push above 1
    }

    #[test]
    fn test_replication_health_full() {
        assert_eq!(replication_health(10, 10, 3), 1.0);
    }

    #[test]
    fn test_replication_health_degraded() {
        let h = replication_health(10, 5, 3);
        assert!(h < 1.0);
    }

    #[test]
    fn test_storage_contract_creation() {
        let c = create_contract("provider", "consumer", 1_000_000, 0.001, 30).unwrap();
        assert!(is_contract_valid(&c));
    }

    #[test]
    fn test_contract_zero_duration_fails() {
        assert!(create_contract("p", "c", 1_000_000, 0.001, 0).is_err());
    }

    #[test]
    fn test_contract_cost_calculation() {
        // 1 GB for 1 day at $0.001/GB/day = $0.001
        let cost = contract_cost(1024 * 1024 * 1024, 0.001, 1);
        assert!((cost - 0.001).abs() < 0.0001);
    }
}
