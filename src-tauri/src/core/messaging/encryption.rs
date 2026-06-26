use crate::core::messaging::errors::MessagingError;
use x25519_dalek::{PublicKey, SharedSecret, StaticSecret};

pub const MAX_MESSAGE_BYTES: usize = 64 * 1024; // 64KB per message
pub const MAX_MEDIA_BYTES: usize = 512 * 1024 * 1024; // 512MB for media

/// Encrypt a message for a specific recipient using X25519 ECDH + XChaCha20Poly1305.
///
/// 1. Derive shared secret via X25519 Diffie-Hellman
/// 2. Encrypt plaintext with XChaCha20Poly1305 using that shared secret
/// 3. Output = nonce (24 bytes) || ciphertext
pub fn encrypt_message(
    plaintext: &[u8],
    sender_private_key: &[u8; 32],
    recipient_public_key: &[u8; 32],
) -> Result<Vec<u8>, MessagingError> {
    if plaintext.len() > MAX_MESSAGE_BYTES {
        return Err(MessagingError::TooLarge {
            size: plaintext.len(),
            max: MAX_MESSAGE_BYTES,
        });
    }
    let shared_secret = derive_shared_secret(sender_private_key, recipient_public_key);
    encrypt_with_secret(shared_secret.as_bytes(), plaintext)
        .map_err(|e| MessagingError::EncryptionFailed(e))
}

/// Decrypt a message using recipient's private key + sender's public key.
///
/// Both parties derive the same X25519 shared secret:
///   sender_priv.diffie_hellman(recipient_pub) == recipient_priv.diffie_hellman(sender_pub)
pub fn decrypt_message(
    ciphertext: &[u8],
    recipient_private_key: &[u8; 32],
    sender_public_key: &[u8; 32],
) -> Result<Vec<u8>, MessagingError> {
    let shared_secret = derive_shared_secret(recipient_private_key, sender_public_key);
    decrypt_with_secret(shared_secret.as_bytes(), ciphertext)
        .map_err(|e| MessagingError::DecodeFailed(e))
}

/// Real X25519 Diffie-Hellman key agreement.
///
/// Produces a 32-byte shared secret that is identical for both parties:
///   a_priv.diffie_hellman(b_pub) == b_priv.diffie_hellman(a_pub)
fn derive_shared_secret(private_key: &[u8; 32], public_key: &[u8; 32]) -> SharedSecret {
    let secret = StaticSecret::from(*private_key);
    let pub_key = PublicKey::from(*public_key);
    secret.diffie_hellman(&pub_key)
}

fn encrypt_with_secret(key: &[u8; 32], data: &[u8]) -> Result<Vec<u8>, String> {
    use chacha20poly1305::{
        aead::{Aead, KeyInit},
        Key, XChaCha20Poly1305, XNonce,
    };
    use rand::RngCore;
    let mut nonce_bytes = [0u8; 24];
    rand::thread_rng().fill_bytes(&mut nonce_bytes);
    let cipher = XChaCha20Poly1305::new(Key::from_slice(key));
    let ct = cipher
        .encrypt(XNonce::from_slice(&nonce_bytes), data)
        .map_err(|e| e.to_string())?;
    let mut out = Vec::with_capacity(24 + ct.len());
    out.extend_from_slice(&nonce_bytes);
    out.extend_from_slice(&ct);
    Ok(out)
}

fn decrypt_with_secret(key: &[u8; 32], data: &[u8]) -> Result<Vec<u8>, String> {
    use chacha20poly1305::{
        aead::{Aead, KeyInit},
        Key, XChaCha20Poly1305, XNonce,
    };
    if data.len() < 24 {
        return Err("ciphertext too short".to_string());
    }
    let (nonce_bytes, ct) = data.split_at(24);
    let cipher = XChaCha20Poly1305::new(Key::from_slice(key));
    cipher
        .decrypt(XNonce::from_slice(nonce_bytes), ct)
        .map_err(|e| e.to_string())
}

/// Generate a fresh X25519 keypair for messaging.
/// Returns (private_key_bytes, public_key_bytes).
pub fn generate_messaging_keypair() -> ([u8; 32], [u8; 32]) {
    use rand::RngCore;
    let mut secret_bytes = [0u8; 32];
    rand::thread_rng().fill_bytes(&mut secret_bytes);
    let secret = StaticSecret::from(secret_bytes);
    let public = PublicKey::from(&secret);
    (secret_bytes, public.to_bytes())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_x25519_encrypt_decrypt_roundtrip() {
        let (sender_priv, sender_pub) = generate_messaging_keypair();
        let (recv_priv, recv_pub) = generate_messaging_keypair();

        let plaintext = b"hello secure world";
        let ciphertext = encrypt_message(plaintext, &sender_priv, &recv_pub).unwrap();
        let decrypted = decrypt_message(&ciphertext, &recv_priv, &sender_pub).unwrap();
        assert_eq!(&decrypted, plaintext);
    }

    #[test]
    fn test_reversed_keys_produce_same_secret() {
        let (priv_a, pub_a) = generate_messaging_keypair();
        let (priv_b, pub_b) = generate_messaging_keypair();

        let secret_ab = derive_shared_secret(&priv_a, &pub_b);
        let secret_ba = derive_shared_secret(&priv_b, &pub_a);
        assert_eq!(secret_ab.as_bytes(), secret_ba.as_bytes());
    }

    #[test]
    fn test_different_nonces_each_time() {
        let (priv_a, pub_a) = generate_messaging_keypair();
        let (priv_b, pub_b) = generate_messaging_keypair();

        let ct1 = encrypt_message(b"same msg", &priv_a, &pub_b).unwrap();
        let ct2 = encrypt_message(b"same msg", &priv_a, &pub_b).unwrap();
        assert_ne!(ct1, ct2);
    }

    #[test]
    fn test_message_too_large() {
        let (priv_a, pub_a) = generate_messaging_keypair();
        let (_, pub_b) = generate_messaging_keypair();
        let big = vec![0u8; MAX_MESSAGE_BYTES + 1];
        assert!(encrypt_message(&big, &priv_a, &pub_b).is_err());
    }
}
