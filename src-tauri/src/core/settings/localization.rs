use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LanguagePack {
    pub code: String,
    pub name: String,
    pub native_name: String,
    pub rtl: bool,
    pub strings: HashMap<String, String>,
}

pub const DEFAULT_LANGUAGES: &[(&str, &str, &str, bool)] = &[
    ("en", "English", "English", false),
    ("ar", "Arabic", "العربية", true),
    ("es", "Spanish", "Español", false),
    ("fr", "French", "Français", false),
    ("ru", "Russian", "Русский", false),
    ("zh", "Chinese", "中文", false),
    ("hi", "Hindi", "हिन्दी", false),
    ("pt", "Portuguese", "Português", false),
    ("ja", "Japanese", "日本語", false),
    ("de", "German", "Deutsch", false),
];

pub struct LocalizationEngine {
    pub current_lang: String,
    pub loaded_packs: HashMap<String, LanguagePack>,
}

impl LocalizationEngine {
    pub fn new() -> Self {
        let mut loaded = HashMap::new();
        // Load English by default
        loaded.insert("en".to_string(), LanguagePack {
            code: "en".to_string(),
            name: "English".to_string(),
            native_name: "English".to_string(),
            rtl: false,
            strings: HashMap::new(), // In production, this would load from a JSON file
        });

        LocalizationEngine {
            current_lang: "en".to_string(),
            loaded_packs: loaded,
        }
    }

    pub fn list_available(&self) -> Vec<(&'static str, &'static str, &'static str, bool)> {
        DEFAULT_LANGUAGES.to_vec()
    }

    pub async fn download_pack(&mut self, code: &str) -> Result<(), String> {
        // Mocking P2P download logic
        tokio::time::sleep(std::time::Duration::from_millis(800)).await;
        
        let entry = DEFAULT_LANGUAGES.iter().find(|(c, _, _, _)| *c == code)
            .ok_or_else(|| format!("Language {} not found", code))?;

        self.loaded_packs.insert(code.to_string(), LanguagePack {
            code: code.to_string(),
            name: entry.1.to_string(),
            native_name: entry.2.to_string(),
            rtl: entry.3,
            strings: HashMap::new(),
        });

        Ok(())
    }

    pub fn set_language(&mut self, code: &str) -> Result<(), String> {
        if self.loaded_packs.contains_key(code) {
            self.current_lang = code.to_string();
            Ok(())
        } else {
            Err("Language pack not loaded".to_string())
        }
    }
}
