use std::collections::HashMap;

/// Centralized API key configuration for PINC
/// All keys are loaded from environment variables at runtime
pub struct ApiKeys {
    keys: HashMap<String, String>,
}

impl ApiKeys {
    pub fn new() -> Self {
        let mut keys = HashMap::new();

        // GamePix Publisher ID (for game feed)
        if let Ok(val) = std::env::var("GAMEPIX_SID") {
            keys.insert("gamepix_sid".into(), val);
        } else {
            keys.insert("gamepix_sid".into(), "4E437".into());
        }

        // GameDistribution Publisher ID (for game RSS feed)
        if let Ok(val) = std::env::var("GAMEDISTRIBUTION_PUBLISHER_ID") {
            keys.insert("gamedistribution_publisher_id".into(), val);
        }

        // ExchangeRate API (currency conversion)
        if let Ok(val) = std::env::var("EXCHANGERATE_API_KEY") {
            keys.insert("exchangerate_api_key".into(), val);
        }

        // Finnhub (stock/crypto data)
        if let Ok(val) = std::env::var("FINNHUB_API_KEY") {
            keys.insert("finnhub_api_key".into(), val);
        }

        // Alchemy (Ethereum RPC)
        if let Ok(val) = std::env::var("ALCHEMY_API_KEY") {
            keys.insert("alchemy_api_key".into(), val);
        }

        // Groq (LLM inference)
        if let Ok(val) = std::env::var("GROQ_API_KEY") {
            keys.insert("groq_api_key".into(), val);
        }

        // OpenAI (optional, for enhanced AI)
        if let Ok(val) = std::env::var("OPENAI_API_KEY") {
            keys.insert("openai_api_key".into(), val);
        }

        // CoinGecko (crypto prices, no key needed but base URL)
        keys.insert("coingecko_base_url".into(), "https://api.coingecko.com/api/v3".into());

        // Nominatim (geocoding, no key needed)
        keys.insert("nominatim_base_url".into(), "https://nominatim.openstreetmap.org".into());

        // Open-Meteo (weather, no key needed)
        keys.insert("openmeteo_base_url".into(), "https://api.open-meteo.com/v1".into());

        // WorldTimeAPI (time zones, no key needed)
        keys.insert("worldtimeapi_base_url".into(), "https://worldtimeapi.org/api".into());

        // REST Countries (country data, no key needed)
        keys.insert("restcountries_base_url".into(), "https://restcountries.com/v3.1".into());

        Self { keys }
    }

    pub fn get(&self, key: &str) -> Option<&str> {
        self.keys.get(key).map(|s| s.as_str())
    }

    pub fn get_or_default(&self, key: &str, default: &str) -> String {
        self.keys.get(key).cloned().unwrap_or_else(|| default.to_string())
    }

    pub fn has_key(&self, key: &str) -> bool {
        self.keys.contains_key(key) && !self.keys[key].is_empty()
    }

    /// Get all configured API keys (for settings display, masks sensitive values)
    pub fn list_keys(&self) -> Vec<(String, String, bool)> {
        let mut result = Vec::new();
        for (key, value) in &self.keys {
            let masked = if key.contains("key") || key.contains("token") || key.contains("secret") {
                if value.is_empty() {
                    "Not configured".to_string()
                } else {
                    format!("{}...{}", &value[..4.min(value.len())], &value[value.len().saturating_sub(4)..])
                }
            } else {
                value.clone()
            };
            result.push((key.clone(), masked, !value.is_empty()));
        }
        result.sort_by(|a, b| a.0.cmp(&b.0));
        result
    }
}

impl Default for ApiKeys {
    fn default() -> Self {
        Self::new()
    }
}

/// Returns the list of bootstrap node addresses for initial P2P network discovery.
/// Reads from the `PINC_BOOTSTRAP_NODES` env var (comma-separated) if set,
/// otherwise falls back to the default public bootstrap nodes.
pub fn bootstrap_nodes() -> Vec<String> {
    if let Ok(nodes) = std::env::var("PINC_BOOTSTRAP_NODES") {
        nodes
            .split(',')
            .map(|s| s.trim().to_string())
            .filter(|s| !s.is_empty())
            .collect()
    } else {
        // Default public bootstrap nodes — update these when VPS nodes are deployed
        vec![
            "bootstrap1.pinc.network:9000".to_string(),
            "bootstrap2.pinc.network:9000".to_string(),
            "bootstrap3.pinc.network:9000".to_string(),
        ]
    }
}

/// Returns the WebSocket signaling server URL for WebRTC coordination.
/// Reads from the `PINC_SIGNALING_URL` env var if set,
/// otherwise defaults to `ws://localhost:9001`.
pub fn signaling_server_url() -> String {
    std::env::var("PINC_SIGNALING_URL")
        .unwrap_or_else(|_| "ws://localhost:9001".to_string())
}

/// Returns the list of STUN server URIs used for WebRTC ICE candidate gathering.
pub fn stun_servers() -> Vec<String> {
    vec![
        "stun:stun.l.google.com:19302".to_string(),
        "stun:stun1.l.google.com:19302".to_string(),
        "stun:stun2.l.google.com:19302".to_string(),
        "stun:stun3.l.google.com:19302".to_string(),
        "stun:stun4.l.google.com:19302".to_string(),
        "stun:global.stun.twilio.com:3478".to_string(),
    ]
}
