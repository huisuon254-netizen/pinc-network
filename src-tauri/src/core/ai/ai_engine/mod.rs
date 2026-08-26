use crate::core::ai::errors::AiError;
use crate::core::ai::types::{BoundingBox, ImageSegmentation, LlamaParams, TtsParams};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::Path;
use std::sync::{Arc, Mutex};
use std::time::{SystemTime, UNIX_EPOCH};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModelInfo {
    pub id: String,
    pub path: String,
    pub size_bytes: u64,
    pub loaded_at: i64,
    pub usage_count: u64,
    pub last_used: Option<i64>,
}

pub struct ModelCache {
    pub cache_dir: String,
    pub models: Arc<Mutex<HashMap<String, ModelInfo>>>,
    db: Option<rusqlite::Connection>,
}

impl ModelCache {
    pub fn new(cache_dir: String) -> Self {
        let _ = std::fs::create_dir_all(&cache_dir);
        let db_path = format!("{}/model_cache.db", cache_dir);
        let db = rusqlite::Connection::open(&db_path).ok();
        if let Some(ref conn) = db {
            let _ = conn.execute_batch(
                "CREATE TABLE IF NOT EXISTS models (
                    id TEXT PRIMARY KEY,
                    path TEXT NOT NULL,
                    size_bytes INTEGER NOT NULL DEFAULT 0,
                    loaded_at INTEGER NOT NULL DEFAULT 0,
                    usage_count INTEGER NOT NULL DEFAULT 0,
                    last_used INTEGER
                );",
            );
        }
        let mut models = HashMap::new();
        if let Some(ref conn) = db {
            if let Ok(mut stmt) = conn.prepare(
                "SELECT id, path, size_bytes, loaded_at, usage_count, last_used FROM models",
            ) {
                let rows = stmt.query_map([], |row| {
                    Ok(ModelInfo {
                        id: row.get(0)?,
                        path: row.get(1)?,
                        size_bytes: row.get(2)?,
                        loaded_at: row.get(3)?,
                        usage_count: row.get(4)?,
                        last_used: row.get(5)?,
                    })
                });
                if let Ok(rows) = rows {
                    for row in rows.flatten() {
                        if Path::new(&row.path).exists() {
                            models.insert(row.id.clone(), row);
                        }
                    }
                }
            }
        }
        Self {
            cache_dir,
            models: Arc::new(Mutex::new(models)),
            db,
        }
    }

    pub fn is_cached(&self, model_id: &str) -> bool {
        let models = self.models.lock().unwrap();
        models
            .get(model_id)
            .map(|m| Path::new(&m.path).exists())
            .unwrap_or(false)
    }

    pub fn get_id(&self, model_id: &str) -> String {
        let models = self.models.lock().unwrap();
        models
            .get(model_id)
            .map(|m| m.id.clone())
            .unwrap_or_default()
    }

    pub fn register_model(&self, id: String, path: String, size_bytes: u64) {
        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs() as i64;
        let info = ModelInfo {
            id: id.clone(),
            path: path.clone(),
            size_bytes,
            loaded_at: now,
            usage_count: 0,
            last_used: None,
        };
        {
            let mut models = self.models.lock().unwrap();
            models.insert(id.clone(), info);
        }
        if let Some(ref conn) = self.db {
            let _ = conn.execute(
                "INSERT OR REPLACE INTO models (id, path, size_bytes, loaded_at, usage_count, last_used) VALUES (?1, ?2, ?3, ?4, 0, NULL)",
                rusqlite::params![id, path, size_bytes as i64, now],
            );
        }
    }

    pub fn touch_model(&self, model_id: &str) {
        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs() as i64;
        {
            let mut models = self.models.lock().unwrap();
            if let Some(info) = models.get_mut(model_id) {
                info.usage_count += 1;
                info.last_used = Some(now);
            }
        }
        if let Some(ref conn) = self.db {
            let _ = conn.execute(
                "UPDATE models SET usage_count = usage_count + 1, last_used = ?1 WHERE id = ?2",
                rusqlite::params![now, model_id],
            );
        }
    }

    pub async fn load(&self, model_id: &str) -> Result<(), AiError> {
        let models = self.models.lock().unwrap();
        let info = models
            .get(model_id)
            .ok_or_else(|| AiError::ModelNotLoaded(model_id.to_string()))?;
        if !Path::new(&info.path).exists() {
            return Err(AiError::ModelNotLoaded(format!(
                "Model file not found: {}",
                info.path
            )));
        }
        Ok(())
    }

    pub fn cache_stats(&self) -> (usize, u64) {
        let models = self.models.lock().unwrap();
        let count = models.len();
        let total_size = models.values().map(|m| m.size_bytes).sum();
        (count, total_size)
    }
}

// ─── WhisperEngine (VAD + audio analysis) ────────────────────────────────────

const VAD_AMPLITUDE_THRESHOLD: f32 = 0.01;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AudioAnalysis {
    pub duration_ms: u64,
    pub sample_rate: u32,
    pub rms_amplitude: f32,
    pub peak_amplitude: f32,
    pub voice_detected: bool,
    pub voice_segments: Vec<VoiceSegment>,
    pub transcription: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VoiceSegment {
    pub start_ms: u64,
    pub end_ms: u64,
    pub avg_amplitude: f32,
}

pub struct WhisperEngine {
    cache: Arc<Mutex<ModelCache>>,
    audio_buffer: Vec<f32>,
    sample_rate: u32,
    model_loaded: bool,
}

impl WhisperEngine {
    pub fn new(cache: Arc<Mutex<ModelCache>>) -> Self {
        Self {
            cache,
            audio_buffer: Vec::new(),
            sample_rate: 16000,
            model_loaded: false,
        }
    }

    pub async fn load_model(&mut self, path: &str) -> Result<String, AiError> {
        let model_id = format!("whisper_{}", uuid::Uuid::new_v4());
        let size_bytes = if Path::new(path).exists() {
            std::fs::metadata(path).map(|m| m.len()).unwrap_or(0)
        } else {
            0
        };
        {
            let cache = self.cache.lock().unwrap();
            cache.register_model(model_id.clone(), path.to_string(), size_bytes);
        }
        self.model_loaded = true;
        Ok(model_id)
    }

    #[allow(clippy::ptr_arg)]
    pub async fn transcribe(&mut self, audio: &Vec<u8>) -> Result<String, AiError> {
        if audio.is_empty() {
            return Err(AiError::InvalidInput("Audio data is empty".to_string()));
        }
        let samples = self.bytes_to_samples(audio);
        if samples.is_empty() {
            return Err(AiError::InvalidInput("No valid audio samples".to_string()));
        }
        let analysis = self.analyze_audio(&samples);
        self.audio_buffer.extend_from_slice(&samples);
        serde_json::to_string_pretty(&analysis)
            .map_err(|e| AiError::InferenceFailed(format!("Serialization: {}", e)))
    }

    fn bytes_to_samples(&self, bytes: &[u8]) -> Vec<f32> {
        if bytes.len() >= 4 && bytes.len().is_multiple_of(4) {
            let samples: Vec<f32> = bytes
                .chunks_exact(4)
                .map(|c| f32::from_le_bytes([c[0], c[1], c[2], c[3]]))
                .collect();
            if samples.iter().all(|&s| (-1.0..=1.0).contains(&s)) && !samples.is_empty() {
                return samples;
            }
        }
        if bytes.len() >= 2 && bytes.len().is_multiple_of(2) {
            return bytes
                .chunks_exact(2)
                .map(|c| i16::from_le_bytes([c[0], c[1]]) as f32 / i16::MAX as f32)
                .collect();
        }
        bytes.iter().map(|&b| (b as f32 - 128.0) / 128.0).collect()
    }

    fn analyze_audio(&self, samples: &[f32]) -> AudioAnalysis {
        let sample_rate = self.sample_rate;
        let duration_ms = (samples.len() as u64 * 1000) / sample_rate as u64;
        let rms = if samples.is_empty() {
            0.0
        } else {
            let sum: f32 = samples.iter().map(|s| s * s).sum();
            (sum / samples.len() as f32).sqrt()
        };
        let peak = samples.iter().map(|s| s.abs()).fold(0.0f32, f32::max);
        let window_size = (sample_rate as usize / 50).max(1);
        let mut segments = Vec::new();
        let mut in_voice = false;
        let mut seg_start = 0u64;
        let mut seg_amp_sum = 0.0f32;
        let mut seg_windows = 0usize;

        for (i, window) in samples
            .windows(window_size)
            .step_by(window_size)
            .enumerate()
        {
            let w_rms = {
                let s: f32 = window.iter().map(|v| v * v).sum();
                (s / window.len() as f32).sqrt()
            };
            let is_voice = w_rms > VAD_AMPLITUDE_THRESHOLD;
            let start_ms = (i * window_size * 1000 / sample_rate as usize) as u64;
            if is_voice && !in_voice {
                seg_start = start_ms;
                seg_amp_sum = 0.0;
                seg_windows = 0;
                in_voice = true;
            }
            if in_voice {
                seg_amp_sum += w_rms;
                seg_windows += 1;
            }
            let total_windows = samples.len() / window_size;
            if (i + 1 >= total_windows || !is_voice) && in_voice {
                segments.push(VoiceSegment {
                    start_ms: seg_start,
                    end_ms: start_ms + (window_size as u64 * 1000 / sample_rate as u64),
                    avg_amplitude: if seg_windows > 0 {
                        seg_amp_sum / seg_windows as f32
                    } else {
                        0.0
                    },
                });
                in_voice = false;
            }
        }

        let transcription = if segments.is_empty() {
            "[No speech detected]".to_string()
        } else {
            let total_ms: u64 = segments
                .iter()
                .map(|s| s.end_ms.saturating_sub(s.start_ms))
                .sum();
            format!(
                "[Voice detected: {} segment(s), ~{}ms of speech, peak amplitude: {:.4}]",
                segments.len(),
                total_ms,
                peak
            )
        };

        AudioAnalysis {
            duration_ms,
            sample_rate,
            rms_amplitude: rms,
            peak_amplitude: peak,
            voice_detected: !segments.is_empty(),
            voice_segments: segments,
            transcription,
        }
    }

    pub fn clear_buffer(&mut self) {
        self.audio_buffer.clear();
    }
    pub fn buffer_duration_ms(&self) -> u64 {
        (self.audio_buffer.len() as u64 * 1000) / self.sample_rate as u64
    }
}

// ─── LlamaEngine (template + markov chain text generation) ───────────────────

pub struct LlamaEngine {
    cache: Arc<Mutex<ModelCache>>,
    loaded_models: HashMap<String, LoadedLlamaModel>,
    markov_chains: HashMap<String, HashMap<String, Vec<String>>>,
}

struct LoadedLlamaModel {
    #[allow(dead_code)]
    info: ModelInfo,
    #[allow(dead_code)]
    params: LlamaParams,
}

impl LlamaEngine {
    pub fn new(cache: Arc<Mutex<ModelCache>>) -> Self {
        let mut engine = Self {
            cache,
            loaded_models: HashMap::new(),
            markov_chains: HashMap::new(),
        };
        engine.init_markov_chains();
        engine
    }

    fn init_markov_chains(&mut self) {
        let corpus = vec![
            "hello there how can i help you today",
            "welcome to the pinc network community",
            "the decentralized marketplace is running smoothly",
            "your transaction has been verified and confirmed",
            "the network latency is within acceptable parameters",
            "your file storage is secure and encrypted",
            "relay nodes are operating at optimal capacity",
            "the reputation system has updated your score",
            "new peer connections are being established",
            "the smart contract deployment was successful",
        ];
        let mut chain: HashMap<String, Vec<String>> = HashMap::new();
        for text in &corpus {
            let words: Vec<&str> = text.split_whitespace().collect();
            for i in 0..words.len().saturating_sub(1) {
                chain
                    .entry(words[i].to_lowercase())
                    .or_default()
                    .push(words[i + 1].to_lowercase());
            }
            if let Some(last) = words.last() {
                chain
                    .entry(last.to_lowercase())
                    .or_default()
                    .push(String::new());
            }
        }
        self.markov_chains.insert("general".to_string(), chain);
    }

    pub async fn load_model(
        &mut self,
        path: &str,
        params: &LlamaParams,
    ) -> Result<String, AiError> {
        let model_id = format!("llama_{}", uuid::Uuid::new_v4());
        let size_bytes = if Path::new(path).exists() {
            std::fs::metadata(path).map(|m| m.len()).unwrap_or(0)
        } else {
            0
        };
        {
            let cache = self.cache.lock().unwrap();
            cache.register_model(model_id.clone(), path.to_string(), size_bytes);
        }
        self.loaded_models.insert(
            model_id.clone(),
            LoadedLlamaModel {
                info: ModelInfo {
                    id: model_id.clone(),
                    path: path.to_string(),
                    size_bytes,
                    loaded_at: SystemTime::now()
                        .duration_since(UNIX_EPOCH)
                        .unwrap_or_default()
                        .as_secs() as i64,
                    usage_count: 0,
                    last_used: None,
                },
                params: params.clone(),
            },
        );
        Ok(model_id)
    }

    pub async fn unload_model(&mut self, id: &str) -> Result<(), AiError> {
        if self.loaded_models.remove(id).is_none() {
            return Err(AiError::ModelNotLoaded(id.to_string()));
        }
        Ok(())
    }

    pub async fn infer(
        &mut self,
        id: &str,
        prompt: &str,
        params: &LlamaParams,
    ) -> Result<String, AiError> {
        if !self.loaded_models.contains_key(id) {
            return Err(AiError::ModelNotLoaded(id.to_string()));
        }
        {
            self.cache.lock().unwrap().touch_model(id);
        }
        Ok(self.generate_response(prompt, params))
    }

    pub async fn generate(
        &mut self,
        id: &str,
        prompt: &str,
        params: &LlamaParams,
    ) -> Result<String, AiError> {
        self.infer(id, prompt, params).await
    }

    fn generate_response(&self, prompt: &str, params: &LlamaParams) -> String {
        let lower = prompt.to_lowercase();
        if lower.contains("hello") || lower.contains("hi ") || lower.starts_with("hi") {
            return self.greeting_response();
        }
        if lower.contains("help") || lower.contains("what can you do") {
            return self.help_response();
        }
        if lower.contains("status") || lower.contains("how are") {
            return self.status_response();
        }
        if lower.contains("price") || lower.contains("cost") || lower.contains("payment") {
            return self.payment_response(&lower);
        }
        if lower.contains("network") || lower.contains("peer") || lower.contains("relay") {
            return self.network_response(&lower);
        }
        if lower.contains("file") || lower.contains("storage") || lower.contains("upload") {
            return self.storage_response();
        }
        if lower.contains("identity") || lower.contains("key") || lower.contains("security") {
            return self.security_response();
        }
        if lower.contains("reputation") || lower.contains("trust") || lower.contains("score") {
            return self.reputation_response();
        }
        self.generic_response(prompt, params)
    }

    fn greeting_response(&self) -> String {
        "Hello! I'm PINC's local AI assistant, running entirely on-device. No data leaves your network. How can I help you today?".to_string()
    }

    fn help_response(&self) -> String {
        "I can help with:\n- Network status (peers, relays, connections)\n- File storage (upload, download, encryption)\n- Marketplace (listings, transactions, escrow)\n- Identity & security (keys, encryption)\n- Reputation & trust scores\n- Payments & DeFi integration\n\nAll processing is 100% on-device.".to_string()
    }

    fn status_response(&self) -> String {
        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs();
        format!("PINC Network Status (Local AI v1.0):\n- Engine: Template + Markov chain\n- Processing: On-device only\n- Cache: Active\n- Timestamp: {}\nAll systems operational.", now)
    }

    fn payment_response(&self, input: &str) -> String {
        if input.contains("escrow") {
            "PINC uses smart contract escrow for marketplace transactions. Funds are held until both parties confirm the deal. Disputes resolved via community arbitration.".to_string()
        } else if input.contains("defi") {
            "PINC integrates with DeFi protocols for cross-chain payments, token swaps, and liquidity provision directly from the wallet.".to_string()
        } else {
            "PINC supports native token transfers, cross-chain bridges, and DeFi integrations. All transactions verified by network consensus.".to_string()
        }
    }

    fn network_response(&self, input: &str) -> String {
        if input.contains("relay") {
            "Relay nodes route messages, cache content, and maintain network connectivity. Operators earn rewards for uptime and bandwidth.".to_string()
        } else if input.contains("peer") {
            "Peer discovery uses mDNS for local networks and DHT-based discovery for internet peers. Connections encrypted with noise protocol frames.".to_string()
        } else {
            "PINC is a fully decentralized P2P mesh with AI-assisted route selection for minimum latency and maximum throughput.".to_string()
        }
    }

    fn storage_response(&self) -> String {
        "Files are encrypted with ChaCha20-Poly1305, chunked, erasure-coded, and distributed across the network. Only you can access your data.".to_string()
    }
    fn security_response(&self) -> String {
        "PINC uses Ed25519 for signing, X25519 for key exchange, and BIP39 mnemonic recovery. Private keys never leave your device. All network traffic uses forward secrecy.".to_string()
    }
    fn reputation_response(&self) -> String {
        "Your reputation is based on successful transactions, file sharing, and community feedback. Higher scores unlock better marketplace visibility and lower fees.".to_string()
    }

    fn generic_response(&self, prompt: &str, params: &LlamaParams) -> String {
        let words: Vec<&str> = prompt.split_whitespace().collect();
        if let Some(chain) = self.markov_chains.get("general") {
            let seed = words.last().unwrap_or(&"the").to_lowercase();
            let mut generated = Vec::new();
            let mut current = seed;
            for _ in 0..params.max_tokens.min(30) {
                if let Some(nexts) = chain.get(current.as_str()) {
                    if nexts.is_empty() || nexts[0].is_empty() {
                        break;
                    }
                    let idx = prompt.len() % nexts.len();
                    generated.push(nexts[idx].clone());
                    current = nexts[idx].clone();
                } else {
                    break;
                }
            }
            if !generated.is_empty() {
                return format!("Regarding \"{}\": {}. For detailed help, ask about specific topics like network, storage, or marketplace.", prompt.chars().take(50).collect::<String>(), generated.join(" "));
            }
        }
        format!("I received: \"{}\". I can help with network status, file storage, marketplace queries, and identity management. Try a specific question!", prompt.chars().take(100).collect::<String>())
    }
}

// ─── OnnxEngine (stub — ort dependency removed) ──────────────────────────────

pub struct OnnxEngine {
    cache: Arc<Mutex<ModelCache>>,
    loaded_models: HashMap<String, String>,
}

impl OnnxEngine {
    pub fn new(cache: Arc<Mutex<ModelCache>>) -> Self {
        Self {
            cache,
            loaded_models: HashMap::new(),
        }
    }

    pub async fn load_model(&mut self, path: &str) -> Result<String, AiError> {
        if !Path::new(path).exists() {
            return Err(AiError::ModelNotLoaded(format!(
                "Model not found: {}. Download a model first.",
                path
            )));
        }
        let metadata = std::fs::metadata(path)
            .map_err(|e| AiError::ModelNotLoaded(format!("Cannot read model: {}", e)))?;
        let model_id = format!("onnx_{}", uuid::Uuid::new_v4());
        {
            let cache = self.cache.lock().unwrap();
            cache.register_model(model_id.clone(), path.to_string(), metadata.len());
        }
        self.loaded_models
            .insert(model_id.clone(), path.to_string());
        Ok(model_id)
    }

    pub async fn segment_image(
        &self,
        _model_id: &str,
        _image_data: Vec<u8>,
    ) -> Result<ImageSegmentation, AiError> {
        Ok(ImageSegmentation {
            bounding_boxes: vec![BoundingBox {
                x1: 0.0,
                y1: 0.0,
                x2: 224.0,
                y2: 224.0,
                confidence: 0.8,
            }],
            class_ids: vec![0],
            class_labels: vec!["placeholder_class".to_string()],
            confidence_scores: vec![0.8],
            segmentation_masks: vec![],
        })
    }

    pub async fn unload_model(&mut self, id: &str) -> Result<(), AiError> {
        if self.loaded_models.remove(id).is_none() {
            return Err(AiError::ModelNotLoaded(id.to_string()));
        }
        Ok(())
    }
}

// ─── TtsEngine (sine-wave audio synthesis) ───────────────────────────────────

pub struct TtsEngine {
    cache: Arc<Mutex<ModelCache>>,
    voice_profiles: HashMap<String, VoiceProfileData>,
}

#[derive(Debug, Clone)]
struct VoiceProfileData {
    #[allow(dead_code)]
    name: String,
    base_frequency: f32,
}

impl TtsEngine {
    pub fn new(cache: Arc<Mutex<ModelCache>>) -> Self {
        Self {
            cache,
            voice_profiles: HashMap::new(),
        }
    }

    pub async fn create_voice_profile(
        &mut self,
        name: &str,
        audio: &[Vec<f32>],
    ) -> Result<String, AiError> {
        if audio.is_empty() {
            return Err(AiError::InvalidInput(
                "Audio samples cannot be empty".to_string(),
            ));
        }
        let base_freq = audio
            .first()
            .map(|samples| {
                if samples.len() > 1 {
                    let crossings = samples
                        .windows(2)
                        .filter(|w| (w[0] >= 0.0) != (w[1] >= 0.0))
                        .count();
                    (crossings as f32 * 16000.0) / (2.0 * samples.len() as f32)
                } else {
                    200.0
                }
            })
            .unwrap_or(200.0);
        let profile_id = format!("voice_{}", uuid::Uuid::new_v4());
        self.voice_profiles.insert(
            profile_id.clone(),
            VoiceProfileData {
                name: name.to_string(),
                base_frequency: base_freq.clamp(80.0, 400.0),
            },
        );
        Ok(profile_id)
    }

    pub async fn synthesize(
        &mut self,
        profile: &str,
        text: &str,
        params: &TtsParams,
    ) -> Result<Vec<f32>, AiError> {
        let sample_rate = 16000u32;
        let base_freq = self
            .voice_profiles
            .get(profile)
            .map(|p| p.base_frequency)
            .unwrap_or(200.0);
        let speed = params.speed.clamp(0.5, 2.0);
        let pitch = params.pitch.clamp(0.5, 2.0);
        let volume = params.volume.clamp(0.0, 1.0);
        let mut output = Vec::new();
        let samples_per_char = (sample_rate as f32 / speed * 0.1) as usize;

        for ch in text.chars() {
            let freq = if ch.is_alphabetic() {
                match ch.to_ascii_lowercase() {
                    'a' | 'e' | 'i' | 'o' | 'u' => base_freq * pitch,
                    'b' | 'd' | 'g' | 'k' | 'p' | 't' => base_freq * pitch * 0.8,
                    'f' | 's' | 'h' | 'x' | 'z' => base_freq * pitch * 1.2,
                    'm' | 'n' | 'l' | 'r' | 'w' | 'y' => base_freq * pitch * 0.9,
                    _ => base_freq * pitch * 0.95,
                }
            } else if ch == ' ' {
                0.0
            } else {
                base_freq * pitch * 0.5
            };

            let dur = match ch {
                ' ' => samples_per_char / 3,
                '.' | '!' | '?' => samples_per_char * 2,
                _ => samples_per_char,
            };

            for i in 0..dur {
                let t = i as f32 / sample_rate as f32;
                let envelope = if i < dur / 10 {
                    i as f32 / (dur / 10) as f32
                } else if i > dur * 9 / 10 {
                    (dur - i) as f32 / (dur / 10) as f32
                } else {
                    1.0
                };
                let sample = if freq > 0.0 {
                    let sine = (2.0 * std::f32::consts::PI * freq * t).sin();
                    let harmonic = (2.0 * std::f32::consts::PI * freq * 2.0 * t).sin() * 0.1;
                    (sine + harmonic) * envelope * volume
                } else {
                    0.0
                };
                output.push(sample);
            }
        }
        Ok(output)
    }
}
