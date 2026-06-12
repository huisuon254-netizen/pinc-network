use sha2::{Sha256, Digest};
use crate::core::distributed::{
    errors::DistributedError,
    types::{DistributedChunk, CHUNK_SIZE_BYTES},
};
use uuid::Uuid;
use std::time::{SystemTime, UNIX_EPOCH};

pub fn split_into_distributed_chunks(
    file_id: &str,
    data: &[u8],
) -> Result<(Vec<DistributedChunk>, Vec<Vec<u8>>), DistributedError> {
    if data.is_empty() {
        return Err(DistributedError::EncodingError("empty data".to_string()));
    }

    let mut chunks = Vec::new();
    let mut chunk_data_list = Vec::new();

    for (index, chunk_bytes) in data.chunks(CHUNK_SIZE_BYTES).enumerate() {
        let hash = sha256_hex(chunk_bytes);
        let chunk = DistributedChunk {
            id: Uuid::new_v4().to_string(),
            file_id: file_id.to_string(),
            chunk_index: index,
            size: chunk_bytes.len() as u64,
            hash,
            replicas: Vec::new(),
        };
        chunks.push(chunk);
        chunk_data_list.push(chunk_bytes.to_vec());
    }

    Ok((chunks, chunk_data_list))
}

pub fn reassemble_chunks(
    chunks: &[(usize, Vec<u8>)],
    expected_hash: &str,
) -> Result<Vec<u8>, DistributedError> {
    let mut sorted = chunks.to_vec();
    sorted.sort_by_key(|(idx, _)| *idx);

    let data: Vec<u8> = sorted.into_iter().flat_map(|(_, d)| d).collect();

    let actual_hash = sha256_hex(&data);
    if actual_hash != expected_hash {
        return Err(DistributedError::IntegrityFailed(
            format!("expected {}, got {}", &expected_hash[..16], &actual_hash[..16])
        ));
    }

    Ok(data)
}

pub fn verify_chunk_integrity(data: &[u8], expected_hash: &str) -> bool {
    sha256_hex(data) == expected_hash
}

fn sha256_hex(data: &[u8]) -> String {
    let mut h = Sha256::new();
    h.update(data);
    format!("{:x}", h.finalize())
}
