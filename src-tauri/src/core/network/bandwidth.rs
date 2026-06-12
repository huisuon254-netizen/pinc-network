use std::{
    sync::{Arc, Mutex},
    time::{Duration, Instant},
};

pub struct BandwidthMonitor {
    bytes_sent: Arc<Mutex<u64>>,
    bytes_recv: Arc<Mutex<u64>>,
    window_start: Arc<Mutex<Instant>>,
    window_sent: Arc<Mutex<u64>>,
    window_recv: Arc<Mutex<u64>>,
}

impl BandwidthMonitor {
    pub fn new() -> Self {
        BandwidthMonitor {
            bytes_sent: Arc::new(Mutex::new(0)),
            bytes_recv: Arc::new(Mutex::new(0)),
            window_start: Arc::new(Mutex::new(Instant::now())),
            window_sent: Arc::new(Mutex::new(0)),
            window_recv: Arc::new(Mutex::new(0)),
        }
    }

    pub fn record_sent(&self, bytes: u64) {
        *self.bytes_sent.lock().unwrap() += bytes;
        *self.window_sent.lock().unwrap() += bytes;
    }

    pub fn record_recv(&self, bytes: u64) {
        *self.bytes_recv.lock().unwrap() += bytes;
        *self.window_recv.lock().unwrap() += bytes;
    }

    /// Returns (kbps_up, kbps_down) over the last measurement window
    pub fn current_kbps(&self) -> (f64, f64) {
        let elapsed = self.window_start.lock().unwrap().elapsed();
        if elapsed < Duration::from_millis(100) {
            return (0.0, 0.0);
        }
        let secs = elapsed.as_secs_f64();
        let sent = *self.window_sent.lock().unwrap();
        let recv = *self.window_recv.lock().unwrap();

        // Reset window
        *self.window_start.lock().unwrap() = Instant::now();
        *self.window_sent.lock().unwrap() = 0;
        *self.window_recv.lock().unwrap() = 0;

        let kbps_up = (sent as f64 * 8.0) / (secs * 1000.0);
        let kbps_down = (recv as f64 * 8.0) / (secs * 1000.0);
        (kbps_up, kbps_down)
    }

    pub fn total_bytes_sent(&self) -> u64 { *self.bytes_sent.lock().unwrap() }
    pub fn total_bytes_recv(&self) -> u64 { *self.bytes_recv.lock().unwrap() }
}

impl Default for BandwidthMonitor {
    fn default() -> Self { Self::new() }
}

/// Speed test payload size for calibration
pub const SPEED_TEST_PAYLOAD_BYTES: usize = 1024 * 1024; // 1 MB

pub fn measure_latency_ms(start: Instant) -> u64 {
    start.elapsed().as_millis() as u64
}
