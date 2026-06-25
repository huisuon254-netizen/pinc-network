use crate::core::data::types::ModelInfo;
use std::path::PathBuf;

pub struct ModelManager {
    models_dir: PathBuf,
}

impl ModelManager {
    pub fn new() -> Self {
        let home = dirs::data_local_dir().unwrap_or_else(|| PathBuf::from("."));
        let models_dir = home.join("com.pinc.app").join("models");
        std::fs::create_dir_all(&models_dir).ok();
        Self { models_dir }
    }

    pub fn with_dir(models_dir: PathBuf) -> Self {
        std::fs::create_dir_all(&models_dir).ok();
        Self { models_dir }
    }

    pub fn list_models(&self) -> Vec<ModelInfo> {
        let mut models = Vec::new();
        if let Ok(entries) = std::fs::read_dir(&self.models_dir) {
            for entry in entries.flatten() {
                let path = entry.path();
                if path.is_file() {
                    let size = std::fs::metadata(&path).map(|m| m.len()).unwrap_or(0);
                    let name = path
                        .file_stem()
                        .and_then(|s| s.to_str())
                        .unwrap_or("unknown")
                        .to_string();
                    let ext = path
                        .extension()
                        .and_then(|s| s.to_str())
                        .unwrap_or("")
                        .to_string();
                    models.push(ModelInfo {
                        name,
                        path,
                        size_bytes: size,
                        model_type: ext,
                        version: "latest".to_string(),
                        downloaded_at: None,
                        last_used: None,
                    });
                }
            }
        }
        models
    }

    pub fn get_model_path(&self, model_type: &str) -> Option<PathBuf> {
        let models = self.list_models();
        models
            .iter()
            .find(|m| m.model_type == model_type || m.name == model_type)
            .map(|m| m.path.clone())
    }

    pub fn delete_model(&self, model_type: &str) -> Result<(), String> {
        let path = self
            .get_model_path(model_type)
            .ok_or_else(|| format!("Model not found: {}", model_type))?;
        std::fs::remove_file(&path).map_err(|e| format!("Failed to delete model: {}", e))?;
        Ok(())
    }

    pub fn get_total_size(&self) -> u64 {
        self.list_models().iter().map(|m| m.size_bytes).sum()
    }

    pub fn get_models_dir(&self) -> &PathBuf {
        &self.models_dir
    }
}

impl Default for ModelManager {
    fn default() -> Self {
        Self::new()
    }
}
