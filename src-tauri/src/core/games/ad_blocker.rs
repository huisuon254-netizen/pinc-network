use std::sync::Arc;
use tokio::sync::Mutex;
use super::ad_proxy::AdBlockConfig;

pub struct AdBlocker {
    pub config: Arc<Mutex<AdBlockConfig>>,
    proxy_port: u16,
    running: bool,
}

impl AdBlocker {
    pub fn new() -> Self {
        Self {
            config: Arc::new(Mutex::new(AdBlockConfig::new())),
            proxy_port: 14890,
            running: false,
        }
    }

    pub async fn start(&mut self) -> Result<(), String> {
        if self.running { return Ok(()); }
        self.running = true;
        log::info!("Ad blocker activated on port {}", self.proxy_port);
        Ok(())
    }

    pub fn stop(&mut self) {
        self.running = false;
        log::info!("Ad blocker stopped");
    }

    pub fn is_running(&self) -> bool { self.running }
    pub fn proxy_port(&self) -> u16 { self.proxy_port }

    pub fn proxied_game_url(&self, game_id: &str, original_url: &str) -> String {
        if self.running {
            format!("http://127.0.0.1:{}/proxy/{}", self.proxy_port, game_id)
        } else {
            original_url.to_string()
        }
    }
}
