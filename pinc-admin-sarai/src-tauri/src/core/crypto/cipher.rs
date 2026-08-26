use crate::core::crypto::{
    errors::CryptoError,
    nonce::{generate_nonce, validate_nonce},
    types::NonceType,
};
use chacha20poly1305::{
    aead::{Aead, KeyInit},
    ChaCha20Poly1305, Key, Nonce, XChaCha20Poly1305, XNonce,
};

pub struct EncryptedData {
    pub ciphertext: Vec<u8>,
    pub nonce: Vec<u8>,
}

pub fn encrypt(
    key: &[u8; 32],
    plaintext: &[u8],
    nonce_type: NonceType,
) -> Result<EncryptedData, CryptoError> {
    let nonce_bytes = generate_nonce(&nonce_type);
    validate_nonce(&nonce_bytes, &nonce_type)?;
    let k = Key::from_slice(key);

    let ciphertext = match nonce_type {
        NonceType::ChaCha12 => {
            let cipher = ChaCha20Poly1305::new(k);
            let n = Nonce::from_slice(&nonce_bytes);
            cipher
                .encrypt(n, plaintext)
                .map_err(|e| CryptoError::EncryptionFailed(e.to_string()))?
        }
        NonceType::XChaCha24 => {
            let cipher = XChaCha20Poly1305::new(k);
            let n = XNonce::from_slice(&nonce_bytes);
            cipher
                .encrypt(n, plaintext)
                .map_err(|e| CryptoError::EncryptionFailed(e.to_string()))?
        }
    };

    Ok(EncryptedData {
        ciphertext,
        nonce: nonce_bytes,
    })
}

pub fn decrypt(
    key: &[u8; 32],
    data: &EncryptedData,
    nonce_type: NonceType,
) -> Result<Vec<u8>, CryptoError> {
    validate_nonce(&data.nonce, &nonce_type)?;
    let k = Key::from_slice(key);

    let plaintext = match nonce_type {
        NonceType::ChaCha12 => {
            let cipher = ChaCha20Poly1305::new(k);
            let n = Nonce::from_slice(&data.nonce);
            cipher
                .decrypt(n, data.ciphertext.as_ref())
                .map_err(|_| CryptoError::DecryptionFailed)?
        }
        NonceType::XChaCha24 => {
            let cipher = XChaCha20Poly1305::new(k);
            let n = XNonce::from_slice(&data.nonce);
            cipher
                .decrypt(n, data.ciphertext.as_ref())
                .map_err(|_| CryptoError::DecryptionFailed)?
        }
    };

    Ok(plaintext)
}
