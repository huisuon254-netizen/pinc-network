#[cfg(test)]
mod tests {
    use crate::core::crypto::{
        cipher::{decrypt, encrypt},
        hash::{blake3_hex, sha256_hex, verify_hash},
        keys::{generate_keypair, generate_symmetric_key, validate_key_length},
        nonce::{generate_nonce, validate_nonce},
        types::NonceType,
        validator::crypto_self_test,
    };

    #[test]
    fn test_chacha12_nonce_size() {
        assert_eq!(generate_nonce(&NonceType::ChaCha12).len(), 12);
    }
    #[test]
    fn test_xchacha24_nonce_size() {
        assert_eq!(generate_nonce(&NonceType::XChaCha24).len(), 24);
    }
    #[test]
    fn test_invalid_nonce_rejected() {
        assert!(validate_nonce(&[0u8; 8], &NonceType::ChaCha12).is_err());
    }
    #[test]
    fn test_valid_nonce_accepted() {
        assert!(validate_nonce(&[0u8; 12], &NonceType::ChaCha12).is_ok());
    }
    #[test]
    fn test_nonce_uniqueness() {
        assert_ne!(
            generate_nonce(&NonceType::XChaCha24),
            generate_nonce(&NonceType::XChaCha24)
        );
    }

    #[test]
    fn test_encrypt_decrypt_xchacha24() {
        let key = [42u8; 32];
        let msg = b"hello PINC";
        let enc = encrypt(&key, msg, NonceType::XChaCha24).unwrap();
        let dec = decrypt(&key, &enc, NonceType::XChaCha24).unwrap();
        assert_eq!(&dec, msg);
    }

    #[test]
    fn test_encrypt_decrypt_chacha12() {
        let key = [7u8; 32];
        let msg = b"chacha12 test";
        let enc = encrypt(&key, msg, NonceType::ChaCha12).unwrap();
        let dec = decrypt(&key, &enc, NonceType::ChaCha12).unwrap();
        assert_eq!(&dec, msg);
    }

    #[test]
    fn test_wrong_key_fails() {
        let enc = encrypt(&[1u8; 32], b"secret", NonceType::XChaCha24).unwrap();
        assert!(decrypt(&[2u8; 32], &enc, NonceType::XChaCha24).is_err());
    }

    #[test]
    fn test_empty_plaintext() {
        let key = [0u8; 32];
        let enc = encrypt(&key, b"", NonceType::XChaCha24).unwrap();
        let dec = decrypt(&key, &enc, NonceType::XChaCha24).unwrap();
        assert_eq!(dec, b"");
    }

    #[test]
    fn test_ciphertext_differs_from_plaintext() {
        let key = [5u8; 32];
        let msg = b"not encrypted";
        let enc = encrypt(&key, msg, NonceType::XChaCha24).unwrap();
        assert_ne!(enc.ciphertext.as_slice(), msg.as_ref());
    }

    #[test]
    fn test_sha256_known() {
        assert_eq!(
            sha256_hex(b"hello"),
            "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824"
        );
    }
    #[test]
    fn test_blake3_returns_hex() {
        assert_eq!(blake3_hex(b"hello").len(), 64);
    }
    #[test]
    fn test_verify_hash_matches() {
        let h = sha256_hex(b"data");
        assert!(verify_hash(b"data", &h));
    }
    #[test]
    fn test_verify_hash_detects_tamper() {
        let h = sha256_hex(b"original");
        assert!(!verify_hash(b"tampered", &h));
    }

    #[test]
    fn test_keypair_generation() {
        let (pub_key, priv_key) = generate_keypair().unwrap();
        assert_eq!(pub_key.len(), 32);
        assert_eq!(priv_key.len(), 32);
    }

    #[test]
    fn test_keypairs_unique() {
        let (p1, _) = generate_keypair().unwrap();
        let (p2, _) = generate_keypair().unwrap();
        assert_ne!(p1, p2);
    }
    #[test]
    fn test_symmetric_key_32_bytes() {
        assert_eq!(generate_symmetric_key().len(), 32);
    }
    #[test]
    fn test_validate_key_length_ok() {
        assert!(validate_key_length(&[0u8; 32]).is_ok());
    }
    #[test]
    fn test_validate_key_length_fail() {
        assert!(validate_key_length(&[0u8; 16]).is_err());
    }
    #[test]
    fn test_crypto_self_test_passes() {
        assert!(crypto_self_test());
    }
}
