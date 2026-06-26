use crate::core::distributed::{
    chunker::{reassemble_chunks, verify_chunk_integrity},
    errors::DistributedError,
    types::{ChunkReplica, RetrievalResult},
};
use std::time::Instant;

/// Find the best replica for a chunk (lowest latency, highest trust)
pub fn select_best_replica<'a>(replicas: &'a [ChunkReplica]) -> Option<&'a ChunkReplica> {
    replicas.iter().filter(|r| r.verified).next()
}

/// Simulate chunk fetch from a replica (real impl uses QUIC transport)
pub fn fetch_chunk_from_replica(
    _replica: &ChunkReplica,
    _chunk_hash: &str,
) -> Result<Vec<u8>, DistributedError> {
    // Phase 4 implementation: use network transport to fetch chunk
    // For now returns stub error indicating transport required
    Err(DistributedError::NodeUnreachable(
        "Phase 4: network transport required for distributed fetch".to_string(),
    ))
}

/// Reassemble a distributed file from fetched chunks
pub fn reassemble_file(
    file_id: &str,
    file_hash: &str,
    chunk_data: Vec<(usize, Vec<u8>)>,
    expected_total: usize,
    start: Instant,
) -> RetrievalResult {
    let chunks_fetched = chunk_data.len();
    let chunks_failed = expected_total.saturating_sub(chunks_fetched);

    if chunks_failed > 0 {
        return RetrievalResult {
            file_id: file_id.to_string(),
            success: false,
            chunks_fetched,
            chunks_failed,
            data: None,
            integrity_verified: false,
            elapsed_ms: start.elapsed().as_millis() as u64,
        };
    }

    match reassemble_chunks(&chunk_data, file_hash) {
        Ok(data) => RetrievalResult {
            file_id: file_id.to_string(),
            success: true,
            chunks_fetched,
            chunks_failed: 0,
            data: Some(data),
            integrity_verified: true,
            elapsed_ms: start.elapsed().as_millis() as u64,
        },
        Err(_) => RetrievalResult {
            file_id: file_id.to_string(),
            success: false,
            chunks_fetched,
            chunks_failed,
            data: None,
            integrity_verified: false,
            elapsed_ms: start.elapsed().as_millis() as u64,
        },
    }
}
