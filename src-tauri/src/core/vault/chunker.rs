use crate::core::{crypto::hash::sha256_hex, vault::types::{ChunkMeta, CHUNK_SIZE}};

pub fn split_chunks(data: &[u8]) -> Vec<ChunkMeta> {
    data.chunks(CHUNK_SIZE)
        .enumerate()
        .map(|(i, chunk)| ChunkMeta {
            index: i,
            hash: sha256_hex(chunk),
            data: chunk.to_vec(),
        })
        .collect()
}

pub fn merge_chunks(chunks: &[ChunkMeta]) -> Vec<u8> {
    let mut sorted = chunks.to_vec();
    sorted.sort_by_key(|c| c.index);
    sorted.into_iter().flat_map(|c| c.data).collect()
}
