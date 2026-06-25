use serde::{Deserialize, Serialize};
use crate::core::ai::errors::AiError;
use crate::core::ai::ai_engine::{LlamaEngine, ModelCache};
use std::sync::{Arc, Mutex};

#[derive(Debug, Serialize, Deserialize)]
pub struct PlexStatus {
    pub engine_status: String,
    pub model_loaded: bool,
    pub active_workflows: u32,
    pub backend: String,
    pub api_configured: bool,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ChatMessage {
    pub role: String,
    pub content: String,
}

pub struct Plex {
    engine: LlamaEngine,
    cache: Arc<Mutex<ModelCache>>,
}

impl Plex {
    pub fn new(cache: Arc<Mutex<ModelCache>>) -> Self {
        Self {
            engine: LlamaEngine::new(cache.clone()),
            cache,
        }
    }

    pub async fn chat(&self, message: &str) -> Result<String, AiError> {
        if let Ok(api_key) = std::env::var("GROQ_API_KEY") {
            if !api_key.is_empty() {
                return self.call_groq_chat(&api_key, message).await;
            }
        }

        let prompt = format!("Plex PINC Controller: {}", message);
        let params = Default::default();
        let mut engine = LlamaEngine::new(self.cache.clone());
        engine.generate("plex-core", &prompt, &params).await
    }

    pub async fn transcribe(&self, audio_bytes: &[u8]) -> Result<String, AiError> {
        let api_key = std::env::var("GROQ_API_KEY")
            .or_else(|_| std::env::var("OPENAI_API_KEY"))
            .unwrap_or_default();
            
        if !api_key.is_empty() {
            return self.groq_transcribe(&api_key, audio_bytes).await;
        }
        
        Err(AiError::InferenceFailed("No API key configured. Set GROQ_API_KEY to enable transcription.".to_string()))
    }

    async fn groq_transcribe(&self, api_key: &str, audio_bytes: &[u8]) -> Result<String, AiError> {
        let client = reqwest::Client::new();
        let part = reqwest::multipart::Part::bytes(audio_bytes.to_vec())
            .file_name("audio.wav")
            .mime_str("audio/wav")
            .map_err(|e| AiError::InferenceFailed(e.to_string()))?;
        let form = reqwest::multipart::Form::new()
            .part("file", part)
            .text("model", "whisper-large-v3")
            .text("response_format", "text");
            
        // Use OpenAI fallback if using an openai key, else groq
        let url = if api_key.starts_with("sk-") {
            "https://api.openai.com/v1/audio/transcriptions"
        } else {
            "https://api.groq.com/openai/v1/audio/transcriptions"
        };
            
        let response = client
            .post(url)
            .header("Authorization", format!("Bearer {}", api_key))
            .multipart(form)
            .send()
            .await
            .map_err(|e| AiError::InferenceFailed(format!("HTTP error: {}", e)))?;
            
        if !response.status().is_success() {
            let err = response.text().await.unwrap_or_default();
            return Err(AiError::InferenceFailed(format!("Transcription error: {}", err)));
        }
        
        response.text().await
            .map_err(|e| AiError::InferenceFailed(format!("Response parse error: {}", e)))
    }

    pub async fn summarize(&self, text: &str) -> Result<String, AiError> {
        let prompt = format!("Summarize the following text concisely:\n\n{}", text);
        self.chat(&prompt).await
    }

    pub async fn process_workflow(&mut self, task: &str) -> Result<String, AiError> {
        let prompt = format!("Plex PINC Controller: Execute task: {}", task);
        let params = Default::default();
        self.engine.generate("plex-core", &prompt, &params).await
    }

    pub async fn complete(&self, messages: &[ChatMessage]) -> Result<String, AiError> {
        let api_key = std::env::var("GROQ_API_KEY")
            .or_else(|_| std::env::var("OPENAI_API_KEY"))
            .unwrap_or_default();
            
        if !api_key.is_empty() {
            let last = messages.last().map(|m| m.content.as_str()).unwrap_or("");
            return self.call_groq_chat(&api_key, last).await;
        }

        let fallback = messages.last().map(|m| m.content.as_str()).unwrap_or("hello");
        let prompt = format!("Plex PINC Controller: {}", fallback);
        let params = Default::default();
        let mut engine = LlamaEngine::new(self.cache.clone());
        engine.generate("plex-core", &prompt, &params).await
    }

    pub async fn chat_with_system(&self, system: &str, user: &str) -> Result<String, AiError> {
        let api_key = std::env::var("GROQ_API_KEY")
            .or_else(|_| std::env::var("OPENAI_API_KEY"))
            .unwrap_or_default();
            
        if !api_key.is_empty() {
            let client = reqwest::Client::new();
            let messages = vec![
                serde_json::json!({"role": "system", "content": system}),
                serde_json::json!({"role": "user", "content": user}),
            ];
            
            let (url, model) = if api_key.starts_with("sk-") {
                ("https://api.openai.com/v1/chat/completions", "gpt-4o-mini")
            } else {
                ("https://api.groq.com/openai/v1/chat/completions", "llama-3.1-8b-instant")
            };
            
            let response = client
                .post(url)
                .header("Authorization", format!("Bearer {}", api_key))
                .header("Content-Type", "application/json")
                .json(&serde_json::json!({
                    "model": model,
                    "messages": messages,
                    "max_tokens": 2048,
                    "temperature": 0.7,
                }))
                .send().await
                .map_err(|e| AiError::InferenceFailed(e.to_string()))?;
                
            let json: serde_json::Value = response.json().await
                .map_err(|e| AiError::InferenceFailed(e.to_string()))?;
                
            return json["choices"][0]["message"]["content"]
                .as_str().map(|s| s.to_string())
                .ok_or_else(|| AiError::InferenceFailed("Bad response".to_string()));
        }
        self.chat(user).await
    }

    async fn call_groq_chat(&self, api_key: &str, message: &str) -> Result<String, AiError> {
        let client = reqwest::Client::new();
        let messages = vec![
            serde_json::json!({
                "role": "system",
                "content": "You are PINC's local AI assistant. You help with network management, file storage, marketplace, identity, and payment operations. Be concise and helpful."
            }),
            serde_json::json!({
                "role": "user",
                "content": message
            }),
        ];

        let (url, model) = if api_key.starts_with("sk-") {
            ("https://api.openai.com/v1/chat/completions", "gpt-4o-mini")
        } else {
            ("https://api.groq.com/openai/v1/chat/completions", "llama-3.1-8b-instant")
        };

        let response = client
            .post(url)
            .header("Authorization", format!("Bearer {}", api_key))
            .header("Content-Type", "application/json")
            .json(&serde_json::json!({
                "model": model,
                "messages": messages,
                "max_tokens": 1024,
                "temperature": 0.7,
            }))
            .send()
            .await
            .map_err(|e| AiError::InferenceFailed(format!("HTTP request failed: {}", e)))?;

        let status = response.status();
        let json: serde_json::Value = response
            .json()
            .await
            .map_err(|e| AiError::InferenceFailed(format!("Failed to parse response: {}", e)))?;

        if !status.is_success() {
            let error_msg = json["error"]["message"]
                .as_str()
                .unwrap_or("Unknown API error");
            return Err(AiError::InferenceFailed(format!("API error ({}): {}", status, error_msg)));
        }

        json["choices"][0]["message"]["content"]
            .as_str()
            .map(|s| s.to_string())
            .ok_or_else(|| AiError::InferenceFailed("Invalid API response format".to_string()))
    }

    pub fn get_status(&self) -> PlexStatus {
        let api_configured = std::env::var("GROQ_API_KEY").map(|k| !k.is_empty()).unwrap_or(false) ||
                            std::env::var("OPENAI_API_KEY").map(|k| !k.is_empty()).unwrap_or(false);

        PlexStatus {
            engine_status: "Operational".to_string(),
            model_loaded: true,
            active_workflows: 0,
            backend: if api_configured {
                "External LLM API".to_string()
            } else {
                "Local (markov-chain fallback)".to_string()
            },
            api_configured,
        }
    }
}

pub async fn check_and_download_models(data_dir: &std::path::Path) -> Vec<String> {
    let models_dir = data_dir.join("models");
    let _ = std::fs::create_dir_all(&models_dir);
    
    let required_models = vec![
        ("whisper-base.en.bin", "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.en.bin"),
    ];
    
    let mut missing = Vec::new();
    for (name, url) in &required_models {
        let path = models_dir.join(name);
        if !path.exists() {
            missing.push(format!("{} ({})", name, url));
        }
    }
    missing
}
