#[cfg(test)]
mod tests {
    use crate::core::vault::{
        chunker::{merge_chunks, split_chunks},
        compression::{compress, decompress},
        encryptor::{vault_decrypt, vault_encrypt},
        integrity::{compute_hash, verify_integrity},
        types::CHUNK_SIZE,
    };

    const KEY: [u8; 32] = [55u8; 32];

    #[test]
    fn test_encrypt_decrypt_roundtrip() {
        let d = b"vault data pinc";
        let b = vault_encrypt(&KEY, d).unwrap();
        assert_eq!(vault_decrypt(&KEY, &b).unwrap().as_slice(), d);
    }
    #[test]
    fn test_empty_data_ok() {
        let b = vault_encrypt(&KEY, b"").unwrap();
        assert_eq!(vault_decrypt(&KEY, &b).unwrap(), b"");
    }
    #[test]
    fn test_corrupt_blob_fails() {
        let mut b = vault_encrypt(&KEY, b"hello").unwrap();
        let l = b.len() - 1;
        b[l] ^= 0xFF;
        assert!(vault_decrypt(&KEY, &b).is_err());
    }
    #[test]
    fn test_short_blob_fails() {
        assert!(vault_decrypt(&KEY, &[0u8; 10]).is_err());
    }
    #[test]
    fn test_wrong_key_fails() {
        let b = vault_encrypt(&KEY, b"secret").unwrap();
        assert!(vault_decrypt(&[99u8; 32], &b).is_err());
    }

    #[test]
    fn test_large_data_roundtrip() {
        let data = vec![0xABu8; 2_000_000];
        let blob = vault_encrypt(&KEY, &data).unwrap();
        assert_eq!(vault_decrypt(&KEY, &blob).unwrap(), data);
    }

    #[test]
    fn test_chunk_merge_roundtrip() {
        let data: Vec<u8> = (0u8..=255).cycle().take(700_000).collect();
        let chunks = split_chunks(&data);
        assert!(chunks.len() >= 1);
        assert_eq!(merge_chunks(&chunks), data);
    }

    #[test]
    fn test_small_data_one_chunk() {
        let chunks = split_chunks(&[1u8; 100]);
        assert_eq!(chunks.len(), 1);
    }
    #[test]
    fn test_large_data_multiple_chunks() {
        let data = vec![0u8; CHUNK_SIZE * 3 + 100];
        assert_eq!(split_chunks(&data).len(), 4);
    }

    #[test]
    fn test_chunk_hashes_correct() {
        let chunks = split_chunks(b"test data");
        for c in &chunks {
            assert_eq!(c.hash, compute_hash(&c.data));
        }
    }

    #[test]
    fn test_integrity_match() {
        let h = compute_hash(b"data");
        assert!(verify_integrity(b"data", &h).is_ok());
    }
    #[test]
    fn test_integrity_tamper() {
        let h = compute_hash(b"orig");
        assert!(verify_integrity(b"tampered", &h).is_err());
    }

    #[test]
    fn test_compress_decompress_roundtrip() {
        let orig = b"compressible data compressible data compressible data";
        let c = compress(orig).unwrap();
        assert_eq!(decompress(&c).unwrap().as_slice(), orig);
    }

    #[test]
    fn test_compression_reduces_size() {
        let data = vec![0xAAu8; 10_000];
        assert!(compress(&data).unwrap().len() < data.len());
    }
}
