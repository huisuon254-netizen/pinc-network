use flate2::{write::GzEncoder, read::GzDecoder, Compression};
use std::io::{Read, Write};
use crate::core::vault::errors::VaultError;

pub fn compress(data: &[u8]) -> Result<Vec<u8>, VaultError> {
    let mut enc = GzEncoder::new(Vec::new(), Compression::default());
    enc.write_all(data).map_err(|e| VaultError::CompressionFailed(e.to_string()))?;
    enc.finish().map_err(|e| VaultError::CompressionFailed(e.to_string()))
}

pub fn decompress(data: &[u8]) -> Result<Vec<u8>, VaultError> {
    let mut dec = GzDecoder::new(data);
    let mut out = Vec::new();
    dec.read_to_end(&mut out).map_err(|e| VaultError::CompressionFailed(e.to_string()))?;
    Ok(out)
}
