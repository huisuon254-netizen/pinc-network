use std::time::{SystemTime, UNIX_EPOCH};
use uuid::Uuid;
use crate::core::security::types::{DdosProtection, SecurityEvent, SecurityEventType, Severity};

pub struct RateLimiter {
    counts: std::collections::HashMap<String, (u64, i64)>,
    limit_per_sec: u64,
}

impl RateLimiter {
    pub fn new(limit_per_sec: u64) -> Self {
        RateLimiter { counts: std::collections::HashMap::new(), limit_per_sec }
    }

    pub fn check(&mut self, peer_id: &str) -> bool {
        let now = now_secs();
        let entry = self.counts.entry(peer_id.to_string()).or_insert((0, now));
        if now > entry.1 { *entry = (0, now); }
        entry.0 += 1;
        entry.0 <= self.limit_per_sec
    }

    pub fn reset(&mut self, peer_id: &str) {
        self.counts.remove(peer_id);
    }
}

pub fn detect_ddos(
    requests_per_sec: u64,
    ddos_cfg: &DdosProtection,
    source: &str,
) -> Option<SecurityEvent> {
    if !ddos_cfg.enabled { return None; }
    if requests_per_sec > ddos_cfg.block_threshold {
        return Some(SecurityEvent {
            id: Uuid::new_v4().to_string(),
            event_type: SecurityEventType::DdosAttempt,
            severity: Severity::Critical,
            source_node: Some(source.to_string()),
            description: format!("{} req/s from {}", requests_per_sec, source),
            mitigated: false,
            detected_at: now_secs(),
        });
    }
    None
}

pub fn validate_message_size(size_bytes: u64, max_kb: u64) -> Result<(), String> {
    let max = max_kb * 1024;
    if size_bytes > max {
        return Err(format!("message size {} exceeds limit {}", size_bytes, max));
    }
    Ok(())
}

pub fn scan_for_malware_patterns(data: &[u8]) -> (bool, Vec<String>) {
    let mut findings = Vec::new();
    // Simple pattern matching (Phase 14 uses ML-based scanner)
    if data.windows(4).any(|w| w == b"\x4d\x5a\x90\x00") {
        findings.push("Windows PE executable header detected".to_string());
    }
    if data.windows(7).any(|w| w == b"<script") {
        findings.push("Script injection pattern detected".to_string());
    }
    let flagged = !findings.is_empty();
    (flagged, findings)
}

fn now_secs() -> i64 {
    SystemTime::now().duration_since(UNIX_EPOCH).unwrap_or_default().as_secs() as i64
}
