use crate::core::crypto::errors::CryptoError;

pub fn validate_key_32(key: &[u8]) -> Result<(), CryptoError> {
    if key.len() != 32 {
        return Err(CryptoError::InvalidKeyLength {
            expected: 32,
            got: key.len(),
        });
    }
    Ok(())
}

pub fn crypto_self_test() -> bool {
    use crate::core::crypto::{
        cipher::{decrypt, encrypt},
        types::NonceType,
    };
    let key = [0u8; 32];
    let msg = b"pinc-self-test";
    match encrypt(&key, msg, NonceType::XChaCha24) {
        Ok(enc) => decrypt(&key, &enc, NonceType::XChaCha24).map_or(false, |v| v == msg),
        Err(_) => false,
    }
}
