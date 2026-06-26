use crate::core::distributed::{
    errors::DistributedError,
    types::{ChunkReplica, StorageNode},
};
use std::time::{SystemTime, UNIX_EPOCH};

/// Select best nodes to store a chunk on, sorted by score
pub fn select_storage_nodes(
    nodes: &[StorageNode],
    chunk_size: u64,
    replication_factor: usize,
) -> Result<Vec<&StorageNode>, DistributedError> {
    let candidates: Vec<&StorageNode> = nodes
        .iter()
        .filter(|n| n.online && n.free_space_bytes >= chunk_size)
        .collect();

    if candidates.len() < replication_factor {
        return Err(DistributedError::InsufficientReplicas {
            needed: replication_factor,
            available: candidates.len(),
        });
    }

    let mut scored: Vec<(&StorageNode, f64)> = candidates
        .into_iter()
        .map(|n| {
            let score = node_score(n);
            (n, score)
        })
        .collect();

    scored.sort_by(|a, b| b.1.partial_cmp(&a.1).unwrap_or(std::cmp::Ordering::Equal));
    Ok(scored
        .into_iter()
        .take(replication_factor)
        .map(|(n, _)| n)
        .collect())
}

/// Score a storage node for chunk placement
pub fn node_score(node: &StorageNode) -> f64 {
    let space_score = (node.free_space_bytes as f64).log2() / 40.0;
    let uptime_score = node.uptime_pct / 100.0;
    let rep_score = node.reputation;
    (space_score * 0.3) + (uptime_score * 0.4) + (rep_score * 0.3)
}

/// Build a replica record for a stored chunk
pub fn build_replica(chunk_id: &str, node: &StorageNode) -> ChunkReplica {
    let now = now_secs();
    ChunkReplica {
        chunk_id: chunk_id.to_string(),
        node_id: node.id.clone(),
        address: node.address.clone(),
        verified: true,
        stored_at: now,
        last_verified: now,
    }
}

/// Check if a file has enough healthy replicas
pub fn replication_health(
    total_chunks: usize,
    chunks_with_healthy_replicas: usize,
    factor: usize,
) -> f64 {
    if total_chunks == 0 {
        return 1.0;
    }
    (chunks_with_healthy_replicas as f64 * factor as f64) / (total_chunks as f64 * factor as f64)
}

/// Return true if replication needs repair
pub fn needs_repair(health: f64, threshold: f64) -> bool {
    health < threshold
}

fn now_secs() -> i64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs() as i64
}
