use crate::core::network::errors::NetworkError;
use chacha20poly1305::{
    aead::{Aead, KeyInit},
    ChaCha20Poly1305, Nonce,
};
use hkdf::Hkdf;
use rand::{thread_rng, Rng};
use sha2::Sha256;
use std::time::Duration;
use tokio::sync::mpsc;

pub const SPHINX_VERSION: u8 = 1;
pub const ALPHA_SIZE: usize = 32;
pub const NONCE_SIZE: usize = 12;
pub const KEY_SIZE: usize = 32;
pub const DELAY_MEAN_MS: u64 = 500;
pub const COVER_INTERVAL_MS: u64 = 10_000;
const CMD_EXIT: u8 = 0x00;
const CMD_FORWARD: u8 = 0x01;

#[derive(Debug, Clone)]
pub struct MixHop {
    pub node_id: String,
    pub public_key: [u8; 32],
}

#[derive(Debug, Clone)]
pub struct SphinxRoute {
    pub entry: MixHop,
    pub middle: MixHop,
    pub exit: MixHop,
}

#[derive(Debug, Clone)]
pub struct SphinxPacket {
    pub version: u8,
    pub alpha: [u8; 32],
    pub inner: Vec<u8>,
}

struct PoolEntry {
    packet: SphinxPacket,
    release_at: tokio::time::Instant,
    is_cover: bool,
}

fn derive_keys(shared_secret: &[u8]) -> [u8; KEY_SIZE] {
    let hk = Hkdf::<Sha256>::new(None, shared_secret);
    let mut key = [0u8; KEY_SIZE];
    let _ = hk.expand(b"pinc-sphinx-key", &mut key);
    key
}

pub fn build_packet(
    route: &SphinxRoute,
    payload: &[u8],
    delays: [u64; 2],
) -> Result<SphinxPacket, NetworkError> {
    let mut rng = thread_rng();
    let ephemeral_secret = x25519_dalek::StaticSecret::random_from_rng(&mut rng);
    let ephemeral_public = x25519_dalek::PublicKey::from(&ephemeral_secret);

    let exit_pk = x25519_dalek::PublicKey::from(route.exit.public_key);
    let exit_shared = ephemeral_secret.diffie_hellman(&exit_pk);
    let exit_key = derive_keys(exit_shared.as_bytes());
    let mut layer0_data = vec![CMD_EXIT];
    layer0_data.extend_from_slice(payload);
    let layer0 = encrypt_layer(&exit_key, &layer0_data)?;

    let middle_pk = x25519_dalek::PublicKey::from(route.middle.public_key);
    let middle_shared = ephemeral_secret.diffie_hellman(&middle_pk);
    let middle_key = derive_keys(middle_shared.as_bytes());
    let mut layer1_data = vec![CMD_FORWARD];
    layer1_data.extend_from_slice(&delays[1].to_le_bytes());
    let exit_id_bytes = route.exit.node_id.as_bytes();
    let exit_id_len = exit_id_bytes.len() as u16;
    layer1_data.extend_from_slice(&exit_id_len.to_le_bytes());
    layer1_data.extend_from_slice(exit_id_bytes);
    layer1_data.extend_from_slice(&layer0);
    let layer1 = encrypt_layer(&middle_key, &layer1_data)?;

    let entry_pk = x25519_dalek::PublicKey::from(route.entry.public_key);
    let entry_shared = ephemeral_secret.diffie_hellman(&entry_pk);
    let entry_key = derive_keys(entry_shared.as_bytes());
    let mut layer2_data = vec![CMD_FORWARD];
    layer2_data.extend_from_slice(&delays[0].to_le_bytes());
    let middle_id_bytes = route.middle.node_id.as_bytes();
    let middle_id_len = middle_id_bytes.len() as u16;
    layer2_data.extend_from_slice(&middle_id_len.to_le_bytes());
    layer2_data.extend_from_slice(middle_id_bytes);
    layer2_data.extend_from_slice(&layer1);
    let layer2 = encrypt_layer(&entry_key, &layer2_data)?;

    Ok(SphinxPacket {
        version: SPHINX_VERSION,
        alpha: ephemeral_public.to_bytes(),
        inner: layer2,
    })
}

pub fn build_cover_packet() -> Result<SphinxPacket, NetworkError> {
    let mut rng = thread_rng();
    let mut alpha = [0u8; ALPHA_SIZE];
    rng.fill(&mut alpha);
    let inner_len = rng.gen_range(128..1024);
    let mut inner = vec![0u8; inner_len];
    rng.fill(inner.as_mut_slice());
    Ok(SphinxPacket {
        version: SPHINX_VERSION,
        alpha,
        inner,
    })
}

fn encrypt_layer(key: &[u8; KEY_SIZE], plaintext: &[u8]) -> Result<Vec<u8>, NetworkError> {
    let cipher = ChaCha20Poly1305::new_from_slice(key)
        .map_err(|e| NetworkError::CryptoFailed(e.to_string()))?;
    let mut rng = thread_rng();
    let mut nonce_bytes = [0u8; NONCE_SIZE];
    rng.fill(&mut nonce_bytes);
    let nonce = Nonce::from_slice(&nonce_bytes);
    let ciphertext = cipher
        .encrypt(nonce, plaintext)
        .map_err(|e| NetworkError::CryptoFailed(e.to_string()))?;
    let mut result = nonce_bytes.to_vec();
    result.extend_from_slice(&ciphertext);
    Ok(result)
}

fn decrypt_layer(key: &[u8; KEY_SIZE], data: &[u8]) -> Result<Vec<u8>, NetworkError> {
    if data.len() < NONCE_SIZE + 16 {
        return Err(NetworkError::CryptoFailed("data too short".to_string()));
    }
    let cipher = ChaCha20Poly1305::new_from_slice(key)
        .map_err(|e| NetworkError::CryptoFailed(e.to_string()))?;
    let (nonce_bytes, ciphertext) = data.split_at(NONCE_SIZE);
    let nonce = Nonce::from_slice(nonce_bytes);
    cipher
        .decrypt(nonce, ciphertext)
        .map_err(|_| NetworkError::CryptoFailed("decryption failed".to_string()))
}

#[derive(Debug)]
pub enum ProcessResult {
    Forward {
        next_node: String,
        delay_ms: u64,
        inner_packet: Vec<u8>,
    },
    Deliver {
        payload: Vec<u8>,
    },
    Discard,
}

pub fn process_packet(
    packet: &SphinxPacket,
    our_private_key: &x25519_dalek::StaticSecret,
) -> ProcessResult {
    let their_public = x25519_dalek::PublicKey::from(packet.alpha);
    let shared_secret = our_private_key.diffie_hellman(&their_public);
    let key = derive_keys(shared_secret.as_bytes());
    let decrypted = match decrypt_layer(&key, &packet.inner) {
        Ok(d) => d,
        Err(_) => return ProcessResult::Discard,
    };
    if decrypted.is_empty() {
        return ProcessResult::Discard;
    }
    match decrypted[0] {
        CMD_EXIT => ProcessResult::Deliver {
            payload: decrypted[1..].to_vec(),
        },
        CMD_FORWARD => {
            if decrypted.len() < 11 {
                return ProcessResult::Discard;
            }
            let mut delay_bytes = [0u8; 8];
            delay_bytes.copy_from_slice(&decrypted[1..9]);
            let delay_ms = u64::from_le_bytes(delay_bytes);
            let mut id_len_bytes = [0u8; 2];
            id_len_bytes.copy_from_slice(&decrypted[9..11]);
            let id_len = u16::from_le_bytes(id_len_bytes) as usize;
            if decrypted.len() < 11 + id_len {
                return ProcessResult::Discard;
            }
            let node_id = String::from_utf8_lossy(&decrypted[11..11 + id_len]).to_string();
            let inner_packet = decrypted[11 + id_len..].to_vec();
            ProcessResult::Forward {
                next_node: node_id,
                delay_ms,
                inner_packet,
            }
        }
        _ => ProcessResult::Discard,
    }
}

pub struct MixNode {
    node_id: String,
    private_key: x25519_dalek::StaticSecret,
    public_key: [u8; 32],
    pool: Vec<PoolEntry>,
    _cover_tx: mpsc::Sender<SphinxPacket>,
    _packet_rx: mpsc::Receiver<SphinxPacket>,
}

impl MixNode {
    pub fn new(node_id: String) -> Self {
        let mut rng = thread_rng();
        let secret = x25519_dalek::StaticSecret::random_from_rng(&mut rng);
        let public = x25519_dalek::PublicKey::from(&secret);
        let (tx, rx) = mpsc::channel(1024);
        MixNode {
            node_id,
            private_key: secret,
            public_key: public.to_bytes(),
            pool: Vec::new(),
            _cover_tx: tx,
            _packet_rx: rx,
        }
    }

    pub fn public_key(&self) -> [u8; 32] {
        self.public_key
    }

    pub fn submit_packet(&mut self, packet: SphinxPacket) {
        let delay = poisson_delay(DELAY_MEAN_MS);
        self.pool.push(PoolEntry {
            packet,
            release_at: tokio::time::Instant::now() + Duration::from_millis(delay),
            is_cover: false,
        });
    }

    pub fn process_ready(&mut self) -> Vec<(SphinxPacket, ProcessResult)> {
        let now = tokio::time::Instant::now();
        let mut results = Vec::new();
        let mut i = 0;
        while i < self.pool.len() {
            if now >= self.pool[i].release_at {
                let entry = self.pool.remove(i);
                let result = if entry.is_cover {
                    ProcessResult::Discard
                } else {
                    process_packet(&entry.packet, &self.private_key)
                };
                results.push((entry.packet, result));
            } else {
                i += 1;
            }
        }
        results
    }

    pub fn generate_cover_packet(&mut self) {
        if let Ok(packet) = build_cover_packet() {
            let delay = poisson_delay(DELAY_MEAN_MS);
            self.pool.push(PoolEntry {
                packet,
                release_at: tokio::time::Instant::now() + Duration::from_millis(delay),
                is_cover: true,
            });
        }
    }

    pub fn pool_size(&self) -> usize {
        self.pool.len()
    }

    pub fn node_id(&self) -> &str {
        &self.node_id
    }
}

fn poisson_delay(mean_ms: u64) -> u64 {
    let mut rng = thread_rng();
    let u: f64 = rng.gen();
    let delay = -(mean_ms as f64) * (1.0 - u).ln();
    (delay as u64).max(10)
}

pub struct GhostModeEngine {
    pub enabled: bool,
    pub mix_node: Option<MixNode>,
    pub hop_count: usize,
    pub cover_interval_ms: u64,
}

impl GhostModeEngine {
    pub fn new() -> Self {
        GhostModeEngine {
            enabled: false,
            mix_node: None,
            hop_count: 3,
            cover_interval_ms: COVER_INTERVAL_MS,
        }
    }

    pub fn initialize(&mut self, node_id: String) {
        self.mix_node = Some(MixNode::new(node_id));
        self.enabled = true;
    }

    pub fn mix_node(&self) -> Option<&MixNode> {
        self.mix_node.as_ref()
    }

    pub fn mix_node_mut(&mut self) -> Option<&mut MixNode> {
        self.mix_node.as_mut()
    }
}

impl Default for GhostModeEngine {
    fn default() -> Self {
        Self::new()
    }
}
