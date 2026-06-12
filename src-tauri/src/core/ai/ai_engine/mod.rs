use super::types::*;
use super::errors::*;
use std::sync::{Arc, Mutex};
use tokio::sync::Mutex as AsyncMutex;
use uuid::Uuid;

pub struct WhisperEngine {
    model_path: Option<String>,
    cache: Arc<Mutex<ModelCache>>,,
}

impl WhisperEngine {
    pub fn new(cache: Arc<Mutex<ModelCache>>) -> Self {
        Self {
            model_path: None,
            cache,
        }
    }

    pub async fn load_model(&mut self, model_path: &str) -> Result<(), AiError> {
        let cache = self.cache.lock().unwrap();
        if !cache.is_cached(model_path) {
            cache.load(model_path).await?;
        }
        self.model_path = Some(model_path.to_string());
        Ok(())
    }

    pub async fn transcribe(&self, audio_data: &[u8]) -> Result<String, AiError> {
        let cache = self.cache.lock().unwrap();
        let model_path = self.model_path.as_ref()
            .ok_or_else(|| AiError::ModelNotLoaded("Whisper model not loaded".to_string()))?;
        
        let model = cache.get(model_path).ok_or_else(|| 
            AiError::ModelNotLoaded(format!("Model not cached: {}", model_path)))?;
        
        let result = onnxruntime::transcribe(model, audio_data).await
            .map_err(|e| AiError::InferenceFailed(e))?;
        Ok(result)
    }
}

pub struct LlamaEngine {
    models: Arc<Mutex<HashMap<String, ModelInfo>>>,
    cache: Arc<Mutex<ModelCache>>,,
}

impl LlamaEngine {
    pub fn new(cache: Arc<Mutex<ModelCache>>) -> Self {
        Self {
            models: Arc::new(Mutex::new(HashMap::new())),
            cache,
        }
    }

    pub async fn load_model(&mut self, model_path: &str, params: &LlamaParams) -> Result<String, AiError> {
        let cache = self.cache.lock().unwrap();
        let model_id = if cache.is_cached(model_path) {
            cache.get_id(model_path)
        } else {
            let model_id = uuid::Uuid::new_v4().to_string();
            cache.load(model_path).await?;
            model_id
        };
        
        let model_info = ModelInfo {
            id: model_id.clone(),
            path: model_path.to_string(),
            params: params.clone(),
            loaded_at: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap_or_default()
                .as_secs() as i64,
            usage_count: 0,
        };
        
        let mut models = self.models.lock().unwrap();
        models.insert(model_id.clone(), model_info);
        
        Ok(model_id)
    }

    pub async fn infer(&self, model_id: &str, prompt: &str, params: &LlamaParams) -> Result<String, AiError> {
        let models = self.models.lock().unwrap();
        let model_info = models.get(model_id)
            .ok_or_else(|| AiError::ModelNotLoaded(format!("Model not found: {}", model_id)))?;
        
        let cache = self.cache.lock().unwrap();
        let model = cache.get(&model_info.path)
            .ok_or_else(|| AiError::ModelNotLoaded(format!("Model not cached: {}", model_info.path)))?;
        
        let result = onnxruntime::infer(model, prompt, params).await
            .map_err(|e| AiError::InferenceFailed(e))?;
        
        Ok(result)
    }

    pub async fn generate(&self, model_id: &str, prompt: &str, params: &LlamaParams) -> Result<String, AiError> {
        let models = self.models.lock().unwrap();
        let model_info = models.get(model_id)
            .ok_or_else(|| AiError::ModelNotLoaded(format!("Model not found: {}", model_id)))?;
        
        let cache = self.cache.lock().unwrap();
        let model = cache.get(&model_info.path)
            .ok_or_else(|| AiError::ModelNotLoaded(format!("Model not cached: {}", model_info.path)))?;
        
        let result = onnxruntime::generate(model, prompt, params).await
            .map_err(|e| AiError::InferenceFailed(e))?;
        
        Ok(result)
    }

    pub async fn unload_model(&mut self, model_id: &str) -> Result<(), AiError> {
        let mut models = self.models.lock().unwrap();
        if let Some(model_info) = models.remove(model_id) {
            let cache = self.cache.lock().unwrap();
            cache.unload(&model_info.path);
            Ok(())
        } else {
            Err(AiError::ModelNotLoaded(format!("Model not found: {}", model_id)))
        }
    }
}

pub struct OnnxEngine {
    models: Arc<Mutex<HashMap<String, ModelInfo>>>,
    cache: Arc<Mutex<ModelCache>>,,
}

impl OnnxEngine {
    pub fn new(cache: Arc<Mutex<ModelCache>>) -> Self {
        Self {
            models: Arc::new(Mutex::new(HashMap::new())),
            cache,
        }
    }

    pub async fn load_model(&mut self, model_path: &str) -> Result<String, AiError> {
        let cache = self.cache.lock().unwrap();
        let model_id = if cache.is_cached(model_path) {
            cache.get_id(model_path)
        } else {
            let model_id = uuid::Uuid::new_v4().to_string();
            cache.load(model_path).await?;
            model_id
        };
        
        let model_info = ModelInfo {
            id: model_id.clone(),
            path: model_path.to_string(),
            params: LlamaParams::default(),
            loaded_at: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap_or_default()
                .as_secs() as i64,
            usage_count: 0,
        };
        
        let mut models = self.models.lock().unwrap();
        models.insert(model_id.clone(), model_info);
        
        Ok(model_id)
    }

    pub async fn segment_image(&self, model_id: &str, image_data: &[u8]) -> Result<ImageSegmentation, AiError> {
        let models = self.models.lock().unwrap();
        let model_info = models.get(model_id)
            .ok_or_else(|| AiError::ModelNotLoaded(format!("Model not found: {}", model_id)))?;
        
        let cache = self.cache.lock().unwrap();
        let model = cache.get(&model_info.path)
            .ok_or_else(|| AiError::ModelNotLoaded(format!("Model not cached: {}", model_info.path)))?;
        
        let result = onnxruntime::segment_image(model, image_data).await
            .map_err(|e| AiError::InferenceFailed(e))?;
        
        Ok(result)
    }

    pub async fn unload_model(&mut self, model_id: &str) -> Result<(), AiError> {
        let mut models = self.models.lock().unwrap();
        if let Some(model_info) = models.remove(model_id) {
            let cache = self.cache.lock().unwrap();
            cache.unload(&model_info.path);
            Ok(())
        } else {
            Err(AiError::ModelNotLoaded(format!("Model not found: {}", model_id)))
        }
    }
}

pub struct TtsEngine {
    voice_profiles: Arc<Mutex<HashMap<String, VoiceProfile>>>,
    cache: Arc<Mutex<ModelCache>>,,
}

impl TtsEngine {
    pub fn new(cache: Arc<Mutex<ModelCache>>) -> Self {
        Self {
            voice_profiles: Arc::new(Mutex::new(HashMap::new())),
            cache,
        }
    }

    pub async fn create_voice_profile(&mut self, name: &str, audio_samples: &[Vec<f32>]) -> Result<String, AiError> {
        if audio_samples.len() < 5 {
            return Err(AiError::InvalidInput("Need at least 5 audio samples for voice cloning".to_string()));
        }
        
        let profile_id = uuid::Uuid::new_v4().to_string();
        let mut voice_profiles = self.voice_profiles.lock().unwrap();
        
        let profile = VoiceProfile {
            id: profile_id.clone(),
            name: name.to_string(),
            audio_samples: audio_samples.to_vec(),
            embedding: onnxruntime::create_embedding(audio_samples).await
                .map_err(|e| AiError::InferenceFailed(e))?,
            created_at: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap_or_default()
                .as_secs() as i64,
        };
        
        voice_profiles.insert(profile_id.clone(), profile);
        
        Ok(profile_id)
    }

    pub async fn synthesize(&self, profile_id: &str, text: &str, params: &TtsParams) -> Result<Vec<f32>, AiError> {
        let voice_profiles = self.voice_profiles.lock().unwrap();
        let profile = voice_profiles.get(profile_id)
            .ok_or_else(|| AiError::ModelNotLoaded(format!("Voice profile not found: {}", profile_id)))?;
        
        let audio_data = onnxruntime::synthesize_speech(profile, text, params).await
            .map_err(|e| AiError::InferenceFailed(e))?;
        
        Ok(audio_data)
    }
}

pub struct ModelCache {
    models: Arc<Mutex<HashMap<String, ModelData>>>,
    redis_client: Option<redis::Client>,
    local_dir: String,
}

impl ModelCache {
    pub fn new(local_dir: String) -> Self {
        let redis_client = None;
        Self {
            models: Arc::new(Mutex::new(HashMap::new())),
            redis_client,
            local_dir,
        }
    }

    pub fn is_cached(&self, model_path: &str) -> bool {
        let models = self.models.lock().unwrap();
        models.contains_key(model_path)
    }

    pub fn get(&self, model_path: &str) -> Option<ModelData> {
        let models = self.models.lock().unwrap();
        models.get(model_path).cloned()
    }

    pub fn get_id(&self, model_path: &str) -> Option<String> {
        let models = self.models.lock().unwrap();
        models.get(model_path).map(|m| m.id.clone())
    }

    pub async fn load(&mut self, model_path: &str) -> Result<(), AiError> {
        let model_id = uuid::Uuid::new_v4().to_string();
        
        let model_data = if let Some(ref mut client) = self.redis_client {
            if let Ok(cached) = self.load_from_redis(client, model_path).await {
                cached
            } else {
                self.load_locally(model_path).await?
            }
        } else {
            self.load_locally(model_path).await?
        };
        
        let mut models = self.models.lock().unwrap();
        models.insert(model_path.to_string(), model_data.clone());
        
        Ok(())
    }

    async fn load_from_redis(&self, client: &mut redis::Client, model_path: &str) -> Result<ModelData, AiError> {
        let key = format!("model:{}:data", model_path);
        let _: () = client.get_connection()?.reqdel(&key)
            .map_err(|e| AiError::InferenceFailed(format!("Redis error: {}", e)))?;
        
        let model_data = ModelData {
            id: uuid::Uuid::new_v4().to_string(),
            path: model_path.to_string(),
            data: Vec::new(),
            size_bytes: 0,
            loaded_at: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap_or_default()
                .as_secs() as i64,
        };
        
        Ok(model_data)
    }

    async fn load_locally(&self, model_path: &str) -> Result<ModelData, AiError> {
        let model_id = uuid::Uuid::new_v4().to_string();
        let model_data = ModelData {
            id: model_id,
            path: model_path.to_string(),
            data: Vec::new(),
            size_bytes: 0,
            loaded_at: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap_or_default()
                .as_secs() as i64,
        };
        
        Ok(model_data)
    }

    pub fn unload(&mut self, model_path: &str) {
        let mut models = self.models.lock().unwrap();
        models.remove(model_path);
    }
}
