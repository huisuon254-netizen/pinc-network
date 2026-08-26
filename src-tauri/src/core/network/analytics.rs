use chrono::Utc;
use serde::{Deserialize, Serialize};
use std::{
    collections::HashMap,
    fs::{self, OpenOptions},
    io::Write,
    path::PathBuf,
    sync::{Arc, Mutex},
    time::{SystemTime, UNIX_EPOCH},
};

static GLOBAL_ANALYTICS: Mutex<Option<AnalyticsEngine>> = Mutex::new(None);

// ─── Per-Subsystem Metrics ─────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct GhostModeMetrics {
    pub packets_received: u64,
    pub packets_forwarded: u64,
    pub packets_delivered: u64,
    pub packets_discarded: u64,
    pub cover_generated: u64,
    pub decryption_failures: u64,
    pub avg_mixing_delay_ms: f64,
    pub pool_peak: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct DtnMetrics {
    pub bundles_created: u64,
    pub bundles_received: u64,
    pub bundles_forwarded: u64,
    pub bundles_delivered: u64,
    pub bundles_expired: u64,
    pub custody_accepted: u64,
    pub custody_signals_sent: u64,
    pub total_bundle_bytes: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct RelayMetrics {
    pub sessions_opened: u64,
    pub sessions_closed: u64,
    pub bytes_relayed: u64,
    pub sessions_failed: u64,
    pub peak_bandwidth_kbps: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct HtlcMetrics {
    pub channels_opened: u64,
    pub channels_claimed: u64,
    pub channels_refunded: u64,
    pub channels_expired: u64,
    pub total_paid: u64,
    pub total_received: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct EigenTrustMetrics {
    pub scores_computed: u64,
    pub interactions_recorded: u64,
    pub peers_evaluated: u64,
    pub trust_changes: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct ObfuscationMetrics {
    pub packets_obfuscated: u64,
    pub packets_deobfuscated: u64,
    pub bytes_processed: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct PeerMetrics {
    pub connections_established: u64,
    pub connections_lost: u64,
    pub handshake_failures: u64,
    pub avg_latency_ms: f64,
    pub peak_peers: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct DaemonMetrics {
    pub uptime_seconds: u64,
    pub loop_ticks: u64,
    pub errors: u64,
    pub last_error: Option<String>,
    pub ghost_cover_ticks: u64,
    pub relay_process_ticks: u64,
    pub dtn_forward_ticks: u64,
}

// ─── Event Log Entry ──────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AnalyticsEvent {
    pub timestamp: String,
    pub unix_ts: i64,
    pub subsystem: String,
    pub event: String,
    pub node_id: String,
    pub success: bool,
    pub duration_ms: Option<u64>,
    pub bytes: Option<u64>,
    pub peer: Option<String>,
    pub details: HashMap<String, String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct StareranAnalytics {
    pub ghost_mode: GhostModeMetrics,
    pub dtn: DtnMetrics,
    pub relay: RelayMetrics,
    pub htlc: HtlcMetrics,
    pub eigentrust: EigenTrustMetrics,
    pub obfuscation: ObfuscationMetrics,
    pub peer: PeerMetrics,
    pub daemon: DaemonMetrics,
    pub events: Vec<AnalyticsEvent>,
    pub subsystem_health: HashMap<String, String>,
    pub start_time: i64,
    pub node_id: String,
}

impl StareranAnalytics {
    pub fn new(node_id: &str) -> Self {
        StareranAnalytics {
            start_time: now_secs(),
            node_id: node_id.to_string(),
            subsystem_health: HashMap::from([
                ("ghost_mode".to_string(), "untested".to_string()),
                ("dtn".to_string(), "untested".to_string()),
                ("relay".to_string(), "untested".to_string()),
                ("htlc".to_string(), "untested".to_string()),
                ("eigentrust".to_string(), "untested".to_string()),
                ("obfuscation".to_string(), "untested".to_string()),
                ("peer".to_string(), "untested".to_string()),
                ("daemon".to_string(), "untested".to_string()),
            ]),
            ..Default::default()
        }
    }
}

// ─── Analytics Engine ─────────────────────────────────────────────────────

pub struct AnalyticsEngine {
    data: Arc<Mutex<StareranAnalytics>>,
    log_path: Option<PathBuf>,
    event_count: Arc<Mutex<u64>>,
}

impl AnalyticsEngine {
    pub fn new(node_id: &str) -> Self {
        let log_dir = dirs::data_local_dir()
            .unwrap_or_else(|| PathBuf::from("."))
            .join("pinc")
            .join("logs");
        fs::create_dir_all(&log_dir).ok();
        let log_path = log_dir.join("stareran_events.jsonl");
        AnalyticsEngine {
            data: Arc::new(Mutex::new(StareranAnalytics::new(node_id))),
            log_path: Some(log_path),
            event_count: Arc::new(Mutex::new(0)),
        }
    }

    pub fn record(&self, subsystem: &str, event: &str, success: bool) {
        self.record_detailed(subsystem, event, success, None, None, None, HashMap::new());
    }

    #[allow(clippy::too_many_arguments)]
    pub fn record_detailed(
        &self,
        subsystem: &str,
        event: &str,
        success: bool,
        duration_ms: Option<u64>,
        bytes: Option<u64>,
        peer: Option<String>,
        details: HashMap<String, String>,
    ) {
        let ts = Utc::now();
        let unix_ts = ts.timestamp();
        let timestamp = ts.format("%Y-%m-%dT%H:%M:%S%.3fZ").to_string();

        let node_id;
        let entry = {
            let mut data = self.data.lock().unwrap();
            node_id = data.node_id.clone();
            self.update_counters(&mut data, subsystem, event, success, bytes);

            let entry = AnalyticsEvent {
                timestamp: timestamp.clone(),
                unix_ts,
                subsystem: subsystem.to_string(),
                event: event.to_string(),
                node_id: node_id.clone(),
                success,
                duration_ms,
                bytes,
                peer,
                details,
            };
            data.events.push(entry.clone());
            if data.events.len() > 10000 {
                data.events.remove(0);
            }
            entry
        };

        let mut count = self.event_count.lock().unwrap();
        *count += 1;

        if let Some(ref log_path) = self.log_path {
            if let Ok(mut file) = OpenOptions::new().create(true).append(true).open(log_path) {
                if let Ok(json) = serde_json::to_string(&entry) {
                    let _ = writeln!(file, "{}", json);
                }
            }
        }
    }

    pub fn mark_healthy(&self, subsystem: &str) {
        self.data
            .lock()
            .unwrap()
            .subsystem_health
            .insert(subsystem.to_string(), "healthy".to_string());
    }

    pub fn mark_failing(&self, subsystem: &str, reason: &str) {
        self.data
            .lock()
            .unwrap()
            .subsystem_health
            .insert(subsystem.to_string(), format!("failing: {}", reason));
    }

    pub fn snapshot(&self) -> StareranAnalytics {
        let mut data = self.data.lock().unwrap();
        data.daemon.uptime_seconds = (now_secs() - data.start_time) as u64;
        data.clone()
    }

    pub fn report(&self) -> AnalyticsReport {
        let snap = self.snapshot();
        AnalyticsReport::from_analytics(&snap)
    }

    fn update_counters(
        &self,
        data: &mut StareranAnalytics,
        subsystem: &str,
        event: &str,
        success: bool,
        bytes: Option<u64>,
    ) {
        match subsystem {
            "ghost_mode" => {
                match event {
                    "packet_received" => data.ghost_mode.packets_received += 1,
                    "packet_forwarded" => data.ghost_mode.packets_forwarded += 1,
                    "packet_delivered" => data.ghost_mode.packets_delivered += 1,
                    "packet_discarded" => data.ghost_mode.packets_discarded += 1,
                    "cover_generated" => data.ghost_mode.cover_generated += 1,
                    "decryption_fail" => data.ghost_mode.decryption_failures += 1,
                    _ => {}
                }
                if !success {
                    data.daemon.errors += 1;
                    data.daemon.last_error = Some(format!("{}:{}", subsystem, event));
                }
            }
            "dtn" => {
                match event {
                    "bundle_created" => data.dtn.bundles_created += 1,
                    "bundle_received" => data.dtn.bundles_received += 1,
                    "bundle_forwarded" => {
                        data.dtn.bundles_forwarded += 1;
                        if let Some(b) = bytes {
                            data.dtn.total_bundle_bytes += b;
                        }
                    }
                    "bundle_delivered" => data.dtn.bundles_delivered += 1,
                    "bundle_expired" => data.dtn.bundles_expired += 1,
                    "custody_accepted" => data.dtn.custody_accepted += 1,
                    "custody_signal" => data.dtn.custody_signals_sent += 1,
                    _ => {}
                }
                if !success {
                    data.daemon.errors += 1;
                    data.daemon.last_error = Some(format!("{}:{}", subsystem, event));
                }
            }
            "relay" => {
                match event {
                    "session_opened" => data.relay.sessions_opened += 1,
                    "session_closed" => data.relay.sessions_closed += 1,
                    "bytes_relayed" => {
                        if let Some(b) = bytes {
                            data.relay.bytes_relayed += b;
                        }
                    }
                    "session_failed" => data.relay.sessions_failed += 1,
                    _ => {}
                }
                if !success {
                    data.daemon.errors += 1;
                    data.daemon.last_error = Some(format!("{}:{}", subsystem, event));
                }
            }
            "htlc" => {
                match event {
                    "channel_opened" => data.htlc.channels_opened += 1,
                    "channel_claimed" => {
                        data.htlc.channels_claimed += 1;
                        if let Some(b) = bytes {
                            data.htlc.total_received += b;
                        }
                    }
                    "channel_refunded" => data.htlc.channels_refunded += 1,
                    "channel_expired" => data.htlc.channels_expired += 1,
                    "payment_sent" => {
                        if let Some(b) = bytes {
                            data.htlc.total_paid += b;
                        }
                    }
                    _ => {}
                }
                if !success {
                    data.daemon.errors += 1;
                    data.daemon.last_error = Some(format!("{}:{}", subsystem, event));
                }
            }
            "eigentrust" => match event {
                "score_computed" => data.eigentrust.scores_computed += 1,
                "interaction_recorded" => data.eigentrust.interactions_recorded += 1,
                "peers_evaluated" => data.eigentrust.peers_evaluated += 1,
                "trust_changed" => data.eigentrust.trust_changes += 1,
                _ => {}
            },
            "obfuscation" => match event {
                "packet_obfuscated" => {
                    data.obfuscation.packets_obfuscated += 1;
                    if let Some(b) = bytes {
                        data.obfuscation.bytes_processed += b;
                    }
                }
                "packet_deobfuscated" => {
                    data.obfuscation.packets_deobfuscated += 1;
                    if let Some(b) = bytes {
                        data.obfuscation.bytes_processed += b;
                    }
                }
                _ => {}
            },
            "peer" => {
                match event {
                    "connected" => data.peer.connections_established += 1,
                    "disconnected" => data.peer.connections_lost += 1,
                    "handshake_fail" => data.peer.handshake_failures += 1,
                    _ => {}
                }
                if !success {
                    data.daemon.errors += 1;
                    data.daemon.last_error = Some(format!("{}:{}", subsystem, event));
                }
            }
            "daemon" => match event {
                "tick" => data.daemon.loop_ticks += 1,
                "cover_tick" => data.daemon.ghost_cover_ticks += 1,
                "relay_tick" => data.daemon.relay_process_ticks += 1,
                "dtn_tick" => data.daemon.dtn_forward_ticks += 1,
                "error" => {
                    data.daemon.errors += 1;
                    data.daemon.last_error = Some(event.to_string());
                }
                _ => {}
            },
            _ => {}
        }
    }
}

// ─── Analytics Report (human-readable summary) ───────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AnalyticsReport {
    pub node_id: String,
    pub uptime_seconds: u64,
    pub total_events: u64,
    pub total_errors: u64,
    pub subsystem_report: Vec<SubsystemReport>,
    pub health: HashMap<String, String>,
    pub verdict: String,
    pub failed_events: Vec<String>,
    pub log_file: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SubsystemReport {
    pub name: String,
    pub health: String,
    pub ops: Vec<String>,
    pub error_count: u64,
}

impl AnalyticsReport {
    pub fn from_analytics(a: &StareranAnalytics) -> Self {
        let mut failed = Vec::new();
        for ev in &a.events {
            if !ev.success {
                failed.push(format!("[{}] {}:{}", ev.subsystem, ev.event, ev.timestamp));
            }
        }
        let failed_count = failed.len() as u64;

        let subsystem_report = vec![
            make_subsystem_report("ghost_mode", &a.subsystem_health, &a.ghost_mode, &a.events),
            make_dtn_report(&a.subsystem_health, &a.dtn, &a.events),
            make_subsystem_report("relay", &a.subsystem_health, &a.relay, &a.events),
            make_subsystem_report("htlc", &a.subsystem_health, &a.htlc, &a.events),
            make_subsystem_report("eigentrust", &a.subsystem_health, &a.eigentrust, &a.events),
            make_subsystem_report(
                "obfuscation",
                &a.subsystem_health,
                &a.obfuscation,
                &a.events,
            ),
            make_subsystem_report("peer", &a.subsystem_health, &a.peer, &a.events),
            make_daemon_report(&a.subsystem_health, &a.daemon, &a.events),
        ];

        let verdict = if failed_count == 0 {
            "ALL SUBSYSTEMS HEALTHY".to_string()
        } else if failed_count < 5 {
            format!("{} FAILURES — MINOR ISSUES", failed_count)
        } else {
            format!("{} FAILURES — INVESTIGATION NEEDED", failed_count)
        };

        AnalyticsReport {
            node_id: a.node_id.clone(),
            uptime_seconds: a.daemon.uptime_seconds,
            total_events: a.events.len() as u64,
            total_errors: a.daemon.errors,
            subsystem_report,
            health: a.subsystem_health.clone(),
            verdict,
            failed_events: failed,
            log_file: format!(
                "{:?}/pinc/logs/stareran_events.jsonl",
                dirs::data_local_dir().unwrap_or_default()
            ),
        }
    }
}

fn make_subsystem_report(
    name: &str,
    health: &HashMap<String, String>,
    _metrics: &impl std::fmt::Debug,
    events: &[AnalyticsEvent],
) -> SubsystemReport {
    let h = health.get(name).cloned().unwrap_or("unknown".to_string());
    let error_count = events
        .iter()
        .filter(|e| e.subsystem == name && !e.success)
        .count() as u64;
    let ops: Vec<String> = events
        .iter()
        .rev()
        .filter(|e| e.subsystem == name)
        .take(10)
        .map(|e| format!("{} {} (ok={})", e.event, e.timestamp, e.success))
        .collect();
    SubsystemReport {
        name: name.to_string(),
        health: h,
        ops,
        error_count,
    }
}

fn make_dtn_report(
    health: &HashMap<String, String>,
    m: &DtnMetrics,
    events: &[AnalyticsEvent],
) -> SubsystemReport {
    let h = health.get("dtn").cloned().unwrap_or("unknown".to_string());
    let error_count = events
        .iter()
        .filter(|e| e.subsystem == "dtn" && !e.success)
        .count() as u64;
    let ops = vec![
        format!(
            "bundles: created={} received={} fwd={} delivered={}",
            m.bundles_created, m.bundles_received, m.bundles_forwarded, m.bundles_delivered
        ),
        format!(
            "expired={} custody={} signals={} bytes={}",
            m.bundles_expired, m.custody_accepted, m.custody_signals_sent, m.total_bundle_bytes
        ),
    ];
    SubsystemReport {
        name: "dtn".to_string(),
        health: h,
        ops,
        error_count,
    }
}

fn make_daemon_report(
    health: &HashMap<String, String>,
    m: &DaemonMetrics,
    events: &[AnalyticsEvent],
) -> SubsystemReport {
    let h = health
        .get("daemon")
        .cloned()
        .unwrap_or("unknown".to_string());
    let error_count = events
        .iter()
        .filter(|e| e.subsystem == "daemon" && !e.success)
        .count() as u64;
    let ops = vec![
        format!(
            "uptime={}s ticks={} errors={}",
            m.uptime_seconds, m.loop_ticks, m.errors
        ),
        format!(
            "cover_ticks={} relay_ticks={} dtn_ticks={}",
            m.ghost_cover_ticks, m.relay_process_ticks, m.dtn_forward_ticks
        ),
    ];
    SubsystemReport {
        name: "daemon".to_string(),
        health: h,
        ops,
        error_count,
    }
}

// ─── Global Accessors (for Tauri commands + daemon) ───────────────────────

pub fn register_global(engine: AnalyticsEngine) {
    if let Ok(mut guard) = GLOBAL_ANALYTICS.lock() {
        *guard = Some(engine);
    }
}

pub fn with_global<F, R>(f: F) -> Option<R>
where
    F: FnOnce(&AnalyticsEngine) -> R,
{
    if let Ok(guard) = GLOBAL_ANALYTICS.lock() {
        guard.as_ref().map(f)
    } else {
        None
    }
}

pub fn global_record(subsystem: &str, event: &str, success: bool) {
    if let Ok(guard) = GLOBAL_ANALYTICS.lock() {
        if let Some(ref a) = *guard {
            a.record(subsystem, event, success);
        }
    }
}

pub fn global_report() -> Option<AnalyticsReport> {
    if let Ok(guard) = GLOBAL_ANALYTICS.lock() {
        guard.as_ref().map(|a| a.report())
    } else {
        None
    }
}

fn now_secs() -> i64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs() as i64
}
