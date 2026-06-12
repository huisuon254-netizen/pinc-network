#[derive(Debug, Clone, PartialEq)]
pub enum NonceType {
    ChaCha12,   // ChaCha20Poly1305  — 12-byte nonce
    XChaCha24,  // XChaCha20Poly1305 — 24-byte nonce
}

impl NonceType {
    pub fn size(&self) -> usize {
        match self {
            NonceType::ChaCha12  => 12,
            NonceType::XChaCha24 => 24,
        }
    }
}
