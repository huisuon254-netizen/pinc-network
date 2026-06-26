use crate::core::network::bandwidth::BandwidthMonitor;
use rand::Rng;
use serde::{Deserialize, Serialize};
use std::time::{Duration, Instant};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SpeedTestResult {
    pub download_kbps: f64,
    pub upload_kbps: f64,
    pub latency_ms: u64,
    pub jitter_ms: u64,
    pub timestamp: i64,
}

pub struct NexusEngine {
    pub sharing_active: bool,
    pub bandwidth_monitor: BandwidthMonitor,
    pub bandwidth_limit_kbps: Option<u64>,
}

impl Default for NexusEngine {
    fn default() -> Self {
        Self::new()
    }
}

impl NexusEngine {
    pub fn new() -> Self {
        NexusEngine {
            sharing_active: false,
            bandwidth_monitor: BandwidthMonitor::new(),
            bandwidth_limit_kbps: None,
        }
    }

    pub async fn run_speed_test_logic() -> SpeedTestResult {
        let start = Instant::now();

        // Simulating a real multi-stage speed test
        // 1. Latency (Ping)
        tokio::time::sleep(Duration::from_millis(42)).await;
        let latency = start.elapsed().as_millis() as u64;

        // 2. Download simulation
        tokio::time::sleep(Duration::from_millis(200)).await;
        let (download, upload, jitter) = {
            let mut rng = rand::thread_rng();
            (
                42000.0 + rng.gen_range(-2000.0..5000.0), // 40-47 Mbps
                12000.0 + rng.gen_range(-1000.0..2000.0), // 11-14 Mbps
                rng.gen_range(1..5),
            )
        };

        // 3. Upload simulation (Wait more after calc to simulate transfer time)
        tokio::time::sleep(Duration::from_millis(150)).await;

        SpeedTestResult {
            download_kbps: download,
            upload_kbps: upload,
            latency_ms: latency,
            jitter_ms: jitter as u64,
            timestamp: chrono::Utc::now().timestamp(),
        }
    }

    pub fn set_bandwidth_limit(&mut self, limit: Option<u64>) {
        self.bandwidth_limit_kbps = limit;
    }

    pub fn toggle_sharing(&mut self, active: bool) {
        self.sharing_active = active;
    }
}
