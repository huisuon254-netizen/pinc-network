use crate::core::mesh::errors::MeshError;
use crate::core::mesh::types::{MeshConfig, MeshStatus};
use crate::core::network::analytics::{self, AnalyticsEngine, AnalyticsReport};
use crate::core::network::dtn::DtnEngine;
use crate::core::network::ghost_mode::{GhostModeEngine, SphinxPacket};
use crate::core::network::peer::PeerRegistry;
use crate::core::network::relay::RelayManager;
use std::sync::{Arc, Mutex};
use std::time::Duration;
use tokio::sync::{mpsc, watch};

pub struct MeshDaemon {
    pub config: MeshConfig,
    pub status: MeshStatus,
    pub ghost_mode: GhostModeEngine,
    pub dtn: Option<DtnEngine>,
    pub relay: Option<RelayManager>,
    pub peers: Option<PeerRegistry>,
    running: Arc<Mutex<bool>>,
    shutdown_tx: Option<watch::Sender<bool>>,
    packet_tx: Option<mpsc::Sender<SphinxPacket>>,
}

impl MeshDaemon {
    pub fn new(config: MeshConfig) -> Self {
        MeshDaemon {
            status: MeshStatus {
                phase: "Phase 3 — Transport Ready".to_string(),
                ..Default::default()
            },
            ghost_mode: GhostModeEngine::new(),
            dtn: None,
            relay: None,
            peers: None,
            config,
            running: Arc::new(Mutex::new(false)),
            shutdown_tx: None,
            packet_tx: None,
        }
    }

    pub fn initialize(&mut self, node_id: &str) {
        let engine = AnalyticsEngine::new(node_id);
        analytics::register_global(engine);
        self.ghost_mode.initialize(node_id.to_string());
        self.dtn = Some(DtnEngine::new(node_id));
        self.relay = Some(RelayManager::new(self.config.bandwidth_cap_kbps));
        self.peers = Some(PeerRegistry::new());
        self.status.ready = true;
        self.status.phase = "Phase 3 — Mesh Active".to_string();
        analytics::global_record("daemon", "initialized", true);
    }

    pub async fn start(&mut self) -> Result<(), MeshError> {
        let (shutdown_tx, mut shutdown_rx) = watch::channel(false);
        let (packet_tx, mut packet_rx) = mpsc::channel::<SphinxPacket>(1024);
        self.shutdown_tx = Some(shutdown_tx);
        self.packet_tx = Some(packet_tx);
        *self.running.lock().unwrap() = true;

        let running = self.running.clone();
        let relay = self.relay.clone();
        let _peers = self.peers.clone();
        let dtn = self.dtn.clone();
        let is_ready = self.status.ready;
        let ghost_mode_enabled = self.ghost_mode.enabled;
        let cover_interval = self.ghost_mode.cover_interval_ms;

        tokio::spawn(async move {
            let mut cover_ticker = tokio::time::interval(Duration::from_millis(cover_interval));
            let mut relay_ticker = tokio::time::interval(Duration::from_secs(30));

            loop {
                tokio::select! {
                    _ = shutdown_rx.changed() => {
                        if *shutdown_rx.borrow() {
                            analytics::global_record("daemon", "shutdown", true);
                            break;
                        }
                    }
                    _ = cover_ticker.tick() => {
                        analytics::global_record("daemon", "cover_tick", true);
                        if ghost_mode_enabled {
                            analytics::global_record("ghost_mode", "cover_generated", true);
                        }
                    }
                    _ = relay_ticker.tick() => {
                        analytics::global_record("daemon", "relay_tick", true);
                        if is_ready {
                            if let Some(ref dtn) = dtn {
                                let bundles = dtn.forwardable_bundles();
                                for bundle in bundles {
                                    analytics::global_record("dtn", "bundle_forwarded", true);
                                    dtn.mark_delivered(&bundle.bundle_id);
                                }
                            }
                            if let Some(ref relay) = relay {
                                let active = relay.active_sessions();
                                for _session in &active {
                                    analytics::global_record("relay", "session_active", true);
                                }
                            }
                        }
                    }
                    Some(_packet) = packet_rx.recv() => {
                        if ghost_mode_enabled {
                            analytics::global_record("ghost_mode", "packet_received", true);
                        }
                    }
                }
            }
            *running.lock().unwrap() = false;
        });

        analytics::global_record("daemon", "started", true);
        self.status.phase = "Phase 3 — Daemon Running".to_string();
        Ok(())
    }

    pub async fn stop(&mut self) {
        if let Some(ref tx) = self.shutdown_tx {
            let _ = tx.send(true);
        }
        analytics::global_record("daemon", "stopped", true);
        *self.running.lock().unwrap() = false;
        self.status.ready = false;
    }

    pub fn is_running(&self) -> bool {
        *self.running.lock().unwrap()
    }

    pub fn packet_tx(&self) -> Option<mpsc::Sender<SphinxPacket>> {
        self.packet_tx.clone()
    }

    pub fn analytics_report(&self) -> Option<AnalyticsReport> {
        analytics::global_report()
    }
}
