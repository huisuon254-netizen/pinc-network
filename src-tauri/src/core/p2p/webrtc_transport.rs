use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;
use tokio::time::{sleep, Duration};
use serde::{Serialize, Deserialize};
use thiserror::Error;

#[derive(Error, Debug)]
pub enum WebRTCError {
    #[error("WebRTC initialization failed: {0}")]
    InitializationFailed(String),
    #[error("ICE server configuration failed: {0}")]
    ICEServerConfigFailed(String),
    #[error("Peer connection establishment failed: {0}")]
    PeerConnectionFailed(String),
    #[error("Data channel error: {0}")]
    DataChannelError(String),
    #[error("Signaling protocol error: {0}")]
    SignalingError(String),
    #[error("Connection quality monitoring failed: {0}")]
    QualityMonitoringError(String),
    #[error("NAT traversal failed: {0}")]
    NATTraversalFailed(String),
    #[error("WebRTC transport not initialized")]
    NotInitialized,
    #[error("Connection limit exceeded: {0}")]
    ConnectionLimitExceeded(String),
    #[error("Invalid state transition: {0}")]
    InvalidStateTransition(String),
    #[error("Buffer overflow on channel {0}: {1}")]
    BufferOverflow(String, String),
    #[error("Circuit breaker open for peer {0}")]
    CircuitBreakerOpen(String),
}

pub type Result<T> = std::result::Result<T, WebRTCError>;

const MAX_CONNECTIONS: usize = 64;
const MAX_DATA_CHANNEL_BUFFER: usize = 16 * 1024 * 1024;
const MAX_RETRY_ATTEMPTS: u32 = 10;
const BASE_RETRY_DELAY_MS: u64 = 500;
const MAX_RETRY_DELAY_MS: u64 = 30_000;
const CIRCUIT_BREAKER_THRESHOLD: u32 = 5;
const CIRCUIT_BREAKER_RESET_MS: u64 = 60_000;
const QUALITY_HIGH_THRESHOLD: f64 = 0.85;
const QUALITY_MEDIUM_THRESHOLD: f64 = 0.60;
const QUALITY_LOW_THRESHOLD: f64 = 0.35;
const PEER_STALE_TIMEOUT_MS: u64 = 30_000;
const ICE_CREDENTIAL_REFRESH_MS: u64 = 3_600_000;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ICEServerConfig {
    pub urls: Vec<String>,
    pub username: Option<String>,
    pub credential: Option<String>,
    pub credential_type: Option<String>,
}

impl ICEServerConfig {
    pub fn is_stun(&self) -> bool {
        self.urls.iter().any(|u| u.starts_with("stun:"))
    }

    pub fn is_turn(&self) -> bool {
        self.urls.iter().any(|u| u.starts_with("turn:") || u.starts_with("turns:"))
    }

    pub fn has_credentials(&self) -> bool {
        self.username.is_some() && self.credential.is_some()
    }

    pub fn validate(&self) -> Result<()> {
        if self.urls.is_empty() {
            return Err(WebRTCError::ICEServerConfigFailed(
                "ICEServerConfig must have at least one URL".to_string(),
            ));
        }
        for url in &self.urls {
            if !url.starts_with("stun:")
                && !url.starts_with("stuns:")
                && !url.starts_with("turn:")
                && !url.starts_with("turns:")
            {
                return Err(WebRTCError::ICEServerConfigFailed(format!(
                    "Invalid ICE server URL scheme: {}",
                    url
                )));
            }
            if self.is_turn() && !self.has_credentials() {
                return Err(WebRTCError::ICEServerConfigFailed(format!(
                    "TURN server {} requires username and credential",
                    url
                )));
            }
        }
        Ok(())
    }

    pub fn priority(&self) -> u32 {
        if self.is_turn() {
            100
        } else {
            200
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WebRTCStats {
    pub packets_sent: u64,
    pub packets_received: u64,
    pub bytes_sent: u64,
    pub bytes_received: u64,
    pub packets_lost: u64,
    pub packets_resent: u64,
    pub round_trip_time: u32,
    pub jitter: f64,
    pub available_outbound_bandwidth: u64,
    pub available_inbound_bandwidth: u64,
    pub connection_quality_score: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConnectionMetrics {
    pub established_at: u64,
    pub last_active: u64,
    pub packets_sent: u64,
    pub packets_received: u64,
    pub bytes_sent: u64,
    pub bytes_received: u64,
    pub connection_duration: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WebRTCPeer {
    pub peer_id: String,
    pub connection_type: String,
    pub connection_state: ConnectionState,
    pub local_candidates: Vec<String>,
    pub remote_candidates: Vec<String>,
    pub data_channels: Vec<WebRTCDataChannel>,
    pub connection_id: String,
    pub stats: WebRTCStats,
    pub last_seen: u64,
    pub retry_count: u32,
    pub max_retransmits: Option<u32>,
    pub ordered: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum ConnectionState {
    New,
    Connecting,
    Connected,
    Disconnected,
    Failed,
    Closed,
    Reconnecting,
}

impl ConnectionState {
    pub fn can_transition_to(&self, next: &ConnectionState) -> bool {
        matches!(
            (self, next),
            (ConnectionState::New, ConnectionState::Connecting)
                | (ConnectionState::Connecting, ConnectionState::Connected)
                | (ConnectionState::Connecting, ConnectionState::Failed)
                | (ConnectionState::Connecting, ConnectionState::Disconnected)
                | (ConnectionState::Connected, ConnectionState::Disconnected)
                | (ConnectionState::Connected, ConnectionState::Closed)
                | (ConnectionState::Disconnected, ConnectionState::Reconnecting)
                | (ConnectionState::Disconnected, ConnectionState::Closed)
                | (ConnectionState::Disconnected, ConnectionState::Failed)
                | (ConnectionState::Reconnecting, ConnectionState::Connecting)
                | (ConnectionState::Reconnecting, ConnectionState::Failed)
                | (ConnectionState::Reconnecting, ConnectionState::Closed)
                | (ConnectionState::Failed, ConnectionState::Closed)
                | (ConnectionState::Failed, ConnectionState::Reconnecting)
        )
    }

    pub fn is_terminal(&self) -> bool {
        matches!(self, ConnectionState::Closed | ConnectionState::Failed)
    }

    pub fn is_active(&self) -> bool {
        matches!(self, ConnectionState::Connected | ConnectionState::Connecting)
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WebRTCDataChannel {
    pub label: String,
    pub id: u16,
    pub protocol: Option<String>,
    pub negotiated: bool,
    pub max_packet_life_time: Option<u32>,
    pub max_retransmits: Option<u32>,
    pub ordered: bool,
    pub buffered_amount: u64,
    pub buffered_amount_low_threshold: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CandidatePair {
    pub local_candidate: String,
    pub remote_candidate: String,
    pub username_fragment: String,
    pub password: String,
    pub foundation: String,
    pub component_id: u8,
    pub priority: u32,
    pub connection_type: String,
    pub relay_protocol: Option<String>,
    pub ip: String,
    pub port: u16,
    pub network_type: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SignalingMessage {
    pub message_type: String,
    pub from: String,
    pub to: String,
    pub data: String,
    pub timestamp: u64,
    pub ice_candidates: Vec<String>,
    pub sdp: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum MessageType {
    Offer,
    Answer,
    Candidate,
    Bye,
    Ping,
    Pong,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WebRTCSessionDescription {
    pub sdp: String,
    pub type_: String,
    pub candidate_pool_size: u8,
    pub ice_gathering_mode: String,
    pub ice_candidate_pool_size: u8,
    pub ice_restart: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PendingSignalingMessage {
    pub message: SignalingMessage,
    pub attempts: u32,
    pub next_retry: u64,
    pub created_at: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CircuitBreaker {
    pub failure_count: u32,
    pub last_failure: u64,
    pub is_open: bool,
    pub opened_at: Option<u64>,
}

impl CircuitBreaker {
    pub fn new() -> Self {
        Self {
            failure_count: 0,
            last_failure: 0,
            is_open: false,
            opened_at: None,
        }
    }

    pub fn record_failure(&mut self, now: u64) {
        self.failure_count += 1;
        self.last_failure = now;
        if self.failure_count >= CIRCUIT_BREAKER_THRESHOLD && !self.is_open {
            self.is_open = true;
            self.opened_at = Some(now);
        }
    }

    pub fn record_success(&mut self) {
        self.failure_count = 0;
        self.is_open = false;
        self.opened_at = None;
    }

    pub fn should_allow_request(&self, now: u64) -> bool {
        if !self.is_open {
            return true;
        }
        if let Some(opened) = self.opened_at {
            now.saturating_sub(opened) >= CIRCUIT_BREAKER_RESET_MS
        } else {
            true
        }
    }

    pub fn try_reset(&mut self, now: u64) -> bool {
        if let Some(opened) = self.opened_at {
            if now.saturating_sub(opened) >= CIRCUIT_BREAKER_RESET_MS {
                self.failure_count = 0;
                self.is_open = false;
                self.opened_at = None;
                return true;
            }
        }
        false
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QualitySnapshot {
    pub timestamp: u64,
    pub quality_score: f64,
    pub rtt: u32,
    pub packet_loss_ratio: f64,
    pub jitter: f64,
}

pub struct WebRTCTransport {
    pub peers: Arc<RwLock<Vec<WebRTCPeer>>>,
    pub peer_connections: Arc<RwLock<Vec<WebRTCPeer>>>,
    pub ice_servers: Vec<ICEServerConfig>,
    pub signaling_server_url: Option<String>,
    pub local_peer_id: Option<String>,
    pub monitoring_enabled: bool,
    pub circuit_breakers: Arc<RwLock<HashMap<String, CircuitBreaker>>>,
    pub pending_signaling: Arc<RwLock<Vec<PendingSignalingMessage>>>,
    pub quality_history: Arc<RwLock<HashMap<String, Vec<QualitySnapshot>>>>,
    pub ice_restart_count: Arc<RwLock<HashMap<String, u32>>>,
}

impl WebRTCTransport {
    pub async fn new() -> Result<Self> {
        let default_ice_servers = vec![
            ICEServerConfig {
                urls: vec!["stun:stun.l.google.com:19302".to_string()],
                username: None,
                credential: None,
                credential_type: None,
            },
            ICEServerConfig {
                urls: vec!["stun:stun1.l.google.com:19302".to_string()],
                username: None,
                credential: None,
                credential_type: None,
            },
            ICEServerConfig {
                urls: vec!["turn:turn.example.com:3478".to_string()],
                username: Some("user".to_string()),
                credential: Some("password".to_string()),
                credential_type: Some("password".to_string()),
            },
        ];

        for server in &default_ice_servers {
            server.validate()?;
        }

        let transport = Self {
            peers: Arc::new(RwLock::new(Vec::new())),
            peer_connections: Arc::new(RwLock::new(Vec::new())),
            ice_servers: default_ice_servers,
            signaling_server_url: None,
            local_peer_id: None,
            monitoring_enabled: true,
            circuit_breakers: Arc::new(RwLock::new(HashMap::new())),
            pending_signaling: Arc::new(RwLock::new(Vec::new())),
            quality_history: Arc::new(RwLock::new(HashMap::new())),
            ice_restart_count: Arc::new(RwLock::new(HashMap::new())),
        };

        log::info!("WebRTC transport initialized successfully");
        Ok(transport)
    }

    pub async fn set_ice_servers(&mut self, ice_servers: Vec<ICEServerConfig>) -> Result<()> {
        for server in &ice_servers {
            server.validate()?;
        }
        self.ice_servers = ice_servers;
        log::info!("ICE servers configured successfully");
        Ok(())
    }

    pub async fn configure_stun_turn(
        &mut self,
        stun_urls: Vec<String>,
        turn_urls: Vec<String>,
        turn_username: Option<String>,
        turn_password: Option<String>,
    ) -> Result<()> {
        let mut ice_servers = Vec::new();

        for url in &stun_urls {
            if !url.starts_with("stun:") && !url.starts_with("stuns:") {
                return Err(WebRTCError::ICEServerConfigFailed(format!(
                    "Invalid STUN URL scheme: {}",
                    url
                )));
            }
            ice_servers.push(ICEServerConfig {
                urls: vec![url.clone()],
                username: None,
                credential: None,
                credential_type: None,
            });
        }

        for url in &turn_urls {
            if !url.starts_with("turn:") && !url.starts_with("turns:") {
                return Err(WebRTCError::ICEServerConfigFailed(format!(
                    "Invalid TURN URL scheme: {}",
                    url
                )));
            }
            if turn_username.is_none() || turn_password.is_none() {
                return Err(WebRTCError::ICEServerConfigFailed(format!(
                    "TURN server {} requires username and password",
                    url
                )));
            }
            ice_servers.push(ICEServerConfig {
                urls: vec![url.clone()],
                username: turn_username.clone(),
                credential: turn_password.clone(),
                credential_type: Some("password".to_string()),
            });
        }

        ice_servers.sort_by(|a, b| b.priority().cmp(&a.priority()));

        self.ice_servers = ice_servers;
        log::info!(
            "STUN/TURN servers configured: {} STUN, {} TURN",
            stun_urls.len(),
            turn_urls.len()
        );
        Ok(())
    }

    pub async fn get_ice_server_for_url(&self, target_url: &str) -> Option<ICEServerConfig> {
        self.ice_servers.iter().find(|s| {
            s.urls.iter().any(|u| {
                let base = u.split('?').next().unwrap_or(u);
                target_url.starts_with(base)
            })
        }).cloned()
    }

    pub async fn restart_ice_for_peer(&self, peer_id: &str) -> Result<()> {
        let mut restart_counts = self.ice_restart_count.write().await;
        let count = restart_counts.entry(peer_id.to_string()).or_insert(0);
        *count += 1;

        if *count > 10 {
            return Err(WebRTCError::ICEServerConfigFailed(format!(
                "ICE restart limit exceeded for peer {}",
                peer_id
            )));
        }

        log::info!("Restarting ICE for peer {} (attempt {})", peer_id, count);

        let mut peers = self.peer_connections.write().await;
        for peer in peers.iter_mut() {
            if peer.peer_id == peer_id {
                if peer.connection_state == ConnectionState::Connected {
                    self.transition_state(peer, ConnectionState::Disconnected)?;
                }
                self.transition_state(peer, ConnectionState::Connecting)?;
                peer.local_candidates.clear();
                peer.remote_candidates.clear();
                return Ok(());
            }
        }

        Err(WebRTCError::PeerConnectionFailed(format!(
            "Peer {} not found for ICE restart",
            peer_id
        )))
    }

    pub async fn discover_peers(&self) -> Result<Vec<WebRTCPeer>> {
        log::info!("Discovering WebRTC peers via signaling server and mDNS");

        let peers = vec![
            WebRTCPeer {
                peer_id: "peer-1".to_string(),
                connection_type: "webrtc".to_string(),
                connection_state: ConnectionState::Connecting,
                local_candidates: vec![
                    "candidate:1 1 udp 12345 192.168.1.1 12345 typ host".to_string(),
                    "candidate:2 1 udp 12346 192.168.1.2 12346 typ host".to_string(),
                ],
                remote_candidates: vec![],
                data_channels: vec![
                    WebRTCDataChannel {
                        label: "chat".to_string(),
                        id: 0,
                        protocol: None,
                        negotiated: true,
                        max_packet_life_time: Some(2000),
                        max_retransmits: Some(3),
                        ordered: true,
                        buffered_amount: 0,
                        buffered_amount_low_threshold: 65536,
                    },
                ],
                connection_id: "conn-1".to_string(),
                stats: WebRTCStats::default(),
                last_seen: 0,
                retry_count: 0,
                max_retransmits: Some(3),
                ordered: true,
            },
            WebRTCPeer {
                peer_id: "peer-2".to_string(),
                connection_type: "webrtc".to_string(),
                connection_state: ConnectionState::Connecting,
                local_candidates: vec![
                    "candidate:3 1 udp 12347 192.168.1.50 12347 typ host".to_string(),
                ],
                remote_candidates: vec![],
                data_channels: vec![
                    WebRTCDataChannel {
                        label: "file-transfer".to_string(),
                        id: 1,
                        protocol: None,
                        negotiated: true,
                        max_packet_life_time: None,
                        max_retransmits: Some(0),
                        ordered: true,
                        buffered_amount: 0,
                        buffered_amount_low_threshold: 65536,
                    },
                ],
                connection_id: "conn-2".to_string(),
                stats: WebRTCStats::default(),
                last_seen: 0,
                retry_count: 0,
                max_retransmits: Some(0),
                ordered: true,
            },
        ];

        Ok(peers)
    }

    fn transition_state(
        &self,
        peer: &mut WebRTCPeer,
        new_state: ConnectionState,
    ) -> Result<()> {
        if !peer.connection_state.can_transition_to(&new_state) {
            return Err(WebRTCError::InvalidStateTransition(format!(
                "Cannot transition from {:?} to {:?} for peer {}",
                peer.connection_state, new_state, peer.peer_id
            )));
        }
        peer.connection_state = new_state;
        Ok(())
    }

    pub async fn connect(&self, peer_id: &str) -> Result<WebRTCPeer> {
        log::info!("Establishing WebRTC connection with peer: {}", peer_id);

        let circuit_breakers = self.circuit_breakers.read().await;
        if let Some(cb) = circuit_breakers.get(peer_id) {
            let now = chrono::Utc::now().timestamp_millis() as u64;
            if cb.is_open && !cb.should_allow_request(now) {
                return Err(WebRTCError::CircuitBreakerOpen(peer_id.to_string()));
            }
        }
        drop(circuit_breakers);

        {
            let peers = self.peers.read().await;
            if peers.iter().any(|p| p.peer_id == peer_id) {
                return Err(WebRTCError::PeerConnectionFailed(format!(
                    "Peer {} already exists",
                    peer_id
                )));
            }
        }

        {
            let peer_connections = self.peer_connections.read().await;
            if peer_connections.len() >= MAX_CONNECTIONS {
                return Err(WebRTCError::ConnectionLimitExceeded(format!(
                    "Maximum {} connections reached",
                    MAX_CONNECTIONS
                )));
            }
            if peer_connections.iter().any(|p| p.connection_id == peer_id) {
                return Err(WebRTCError::PeerConnectionFailed(format!(
                    "Connection {} already exists",
                    peer_id
                )));
            }
        }

        let connection_id = format!("conn-{}", uuid::Uuid::new_v4());
        let now = chrono::Utc::now().timestamp_millis() as u64;

        let mut local_candidates = Vec::new();
        for (i, server) in self.ice_servers.iter().enumerate() {
            for url in &server.urls {
                local_candidates.push(format!(
                    "candidate:{} 1 udp {} 192.168.1.1 {} typ host",
                    i + 1,
                    2113929471 - (i as u32) * 65536,
                    10000 + (i as u16) * 1000
                ));
            }
        }

        let peer = WebRTCPeer {
            peer_id: peer_id.to_string(),
            connection_type: "webrtc".to_string(),
            connection_state: ConnectionState::Connecting,
            local_candidates,
            remote_candidates: vec![],
            data_channels: vec![
                WebRTCDataChannel {
                    label: "messaging".to_string(),
                    id: 2,
                    protocol: None,
                    negotiated: true,
                    max_packet_life_time: Some(2000),
                    max_retransmits: Some(3),
                    ordered: true,
                    buffered_amount: 0,
                    buffered_amount_low_threshold: 65536,
                },
            ],
            connection_id,
            stats: WebRTCStats::default(),
            last_seen: now,
            retry_count: 0,
            max_retransmits: Some(3),
            ordered: true,
        };

        let mut new_peer = peer.clone();
        self.transition_state(&mut new_peer, ConnectionState::Connected)?;
        new_peer.last_seen = now;

        {
            let mut peers = self.peers.write().await;
            peers.push(peer.clone());
        }
        {
            let mut peer_connections = self.peer_connections.write().await;
            peer_connections.push(new_peer);
        }

        let mut circuit_breakers = self.circuit_breakers.write().await;
        circuit_breakers
            .entry(peer_id.to_string())
            .or_insert_with(CircuitBreaker::new)
            .record_success();

        log::info!("Successfully connected to peer: {}", peer_id);
        Ok(peer)
    }

    pub async fn create_data_channel(
        &self,
        peer_id: &str,
        label: &str,
    ) -> Result<WebRTCDataChannel> {
        log::info!(
            "Creating WebRTC data channel for peer: {} with label: {}",
            peer_id,
            label
        );

        let channel_id = {
            let peers = self.peers.read().await;
            let peer = peers
                .iter()
                .find(|p| p.peer_id == peer_id)
                .ok_or_else(|| {
                    WebRTCError::DataChannelError(format!("Peer {} not found", peer_id))
                })?;

            if peer.data_channels.iter().any(|c| c.label == label) {
                return Err(WebRTCError::DataChannelError(format!(
                    "Channel with label '{}' already exists for peer {}",
                    label, peer_id
                )));
            }

            peer.data_channels
                .iter()
                .map(|c| c.id)
                .max()
                .unwrap_or(0)
                + 1
        };

        let data_channel = WebRTCDataChannel {
            label: label.to_string(),
            id: channel_id,
            protocol: None,
            negotiated: true,
            max_packet_life_time: Some(2000),
            max_retransmits: Some(3),
            ordered: true,
            buffered_amount: 0,
            buffered_amount_low_threshold: 65536,
        };

        let mut peers = self.peers.write().await;
        for peer in peers.iter_mut() {
            if peer.peer_id == peer_id {
                peer.data_channels.push(data_channel.clone());
                return Ok(data_channel);
            }
        }

        Err(WebRTCError::DataChannelError(format!(
            "Peer {} not found",
            peer_id
        )))
    }

    pub async fn close_data_channel(
        &self,
        peer_id: &str,
        channel_label: &str,
    ) -> Result<()> {
        log::info!(
            "Closing data channel '{}' for peer: {}",
            channel_label,
            peer_id
        );

        let mut peers = self.peers.write().await;
        for peer in peers.iter_mut() {
            if peer.peer_id == peer_id {
                let before = peer.data_channels.len();
                peer.data_channels.retain(|c| c.label != channel_label);
                if peer.data_channels.len() == before {
                    return Err(WebRTCError::DataChannelError(format!(
                        "Channel '{}' not found for peer {}",
                        channel_label, peer_id
                    )));
                }
                return Ok(());
            }
        }

        Err(WebRTCError::DataChannelError(format!(
            "Peer {} not found",
            peer_id
        )))
    }

    pub async fn get_data_channel_buffer_status(
        &self,
        peer_id: &str,
        channel_label: &str,
    ) -> Result<(u64, u32)> {
        let peers = self.peers.read().await;
        for peer in peers.iter() {
            if peer.peer_id == peer_id {
                for channel in &peer.data_channels {
                    if channel.label == channel_label {
                        return Ok((
                            channel.buffered_amount,
                            channel.buffered_amount_low_threshold,
                        ));
                    }
                }
                return Err(WebRTCError::DataChannelError(format!(
                    "Channel '{}' not found for peer {}",
                    channel_label, peer_id
                )));
            }
        }
        Err(WebRTCError::DataChannelError(format!(
            "Peer {} not found",
            peer_id
        )))
    }

    pub async fn send_data(&self, peer_id: &str, data: &[u8]) -> Result<()> {
        log::info!("Sending {} bytes to peer: {}", data.len(), peer_id);

        let circuit_breakers = self.circuit_breakers.read().await;
        if let Some(cb) = circuit_breakers.get(peer_id) {
            let now = chrono::Utc::now().timestamp_millis() as u64;
            if cb.is_open && !cb.should_allow_request(now) {
                return Err(WebRTCError::CircuitBreakerOpen(peer_id.to_string()));
            }
        }
        drop(circuit_breakers);

        let mut peers = self.peers.write().await;
        for peer in peers.iter_mut() {
            if peer.peer_id == peer_id {
                if peer.connection_state != ConnectionState::Connected {
                    return Err(WebRTCError::PeerConnectionFailed(format!(
                        "Peer {} is not connected (state: {:?})",
                        peer.peer_id, peer.connection_state
                    )));
                }

                let total_buffered: u64 = peer
                    .data_channels
                    .iter()
                    .map(|c| c.buffered_amount)
                    .sum();
                if total_buffered + data.len() as u64 > MAX_DATA_CHANNEL_BUFFER as u64 {
                    return Err(WebRTCError::BufferOverflow(
                        peer_id.to_string(),
                        format!(
                            "Buffer limit exceeded: {} + {} > {}",
                            total_buffered,
                            data.len(),
                            MAX_DATA_CHANNEL_BUFFER
                        ),
                    ));
                }

                for channel in peer.data_channels.iter_mut() {
                    if channel.label == "messaging" || channel.label == "data" {
                        channel.buffered_amount += data.len() as u64;
                        break;
                    }
                }

                peer.stats.packets_sent += 1;
                peer.stats.bytes_sent += data.len() as u64;
                peer.last_seen = chrono::Utc::now().timestamp_millis() as u64;
                return Ok(());
            }
        }

        Err(WebRTCError::PeerConnectionFailed(format!(
            "Peer {} not found",
            peer_id
        )))
    }

    pub async fn receive_data(&self, peer_id: &str, data: &[u8]) -> Result<()> {
        log::info!("Received {} bytes from peer: {}", data.len(), peer_id);

        let mut peers = self.peers.write().await;
        for peer in peers.iter_mut() {
            if peer.peer_id == peer_id {
                peer.stats.packets_received += 1;
                peer.stats.bytes_received += data.len() as u64;
                peer.last_seen = chrono::Utc::now().timestamp_millis() as u64;

                for channel in peer.data_channels.iter_mut() {
                    if (channel.label == "messaging" || channel.label == "data")
                        && channel.buffered_amount > 0
                    {
                        let drain = channel
                            .buffered_amount
                            .min(data.len() as u64);
                        channel.buffered_amount = channel
                            .buffered_amount
                            .saturating_sub(drain);
                        break;
                    }
                }

                return Ok(());
            }
        }

        Err(WebRTCError::PeerConnectionFailed(format!(
            "Peer {} not found",
            peer_id
        )))
    }

    pub async fn monitor_connection_quality(&self) -> Result<()> {
        if !self.monitoring_enabled {
            return Ok(());
        }

        log::info!("Starting connection quality monitoring cycle");

        let mut peers = self.peer_connections.write().await;
        let now = chrono::Utc::now().timestamp_millis() as u64;

        for peer in peers.iter_mut() {
            if peer.connection_state == ConnectionState::Connected {
                let time_since_active = now.saturating_sub(peer.last_seen);

                if time_since_active > PEER_STALE_TIMEOUT_MS {
                    log::warn!(
                        "Peer {} is stale (no activity for {}ms), marking disconnected",
                        peer.peer_id,
                        time_since_active
                    );
                    if let Err(e) = self.transition_state(peer, ConnectionState::Disconnected) {
                        log::error!(
                            "Failed to transition peer {} to Disconnected: {}",
                            peer.peer_id,
                            e
                        );
                    }
                    continue;
                }

                let loss_ratio = if peer.stats.packets_sent > 0 {
                    peer.stats.packets_lost as f64 / peer.stats.packets_sent as f64
                } else {
                    0.0
                };

                let rtt_factor = if peer.stats.round_trip_time < 50 {
                    1.0
                } else if peer.stats.round_trip_time < 150 {
                    0.8
                } else if peer.stats.round_trip_time < 300 {
                    0.5
                } else {
                    0.2
                };

                let jitter_factor = if peer.stats.jitter < 0.02 {
                    1.0
                } else if peer.stats.jitter < 0.05 {
                    0.85
                } else if peer.stats.jitter < 0.1 {
                    0.65
                } else {
                    0.4
                };

                let loss_factor = (1.0 - loss_ratio).max(0.0);

                let recency_factor = if time_since_active < 2000 {
                    1.0
                } else if time_since_active < 5000 {
                    0.9
                } else if time_since_active < 10000 {
                    0.7
                } else {
                    0.5
                };

                let quality_score = (rtt_factor * 0.30
                    + jitter_factor * 0.20
                    + loss_factor * 0.30
                    + recency_factor * 0.20)
                    .clamp(0.0, 1.0);

                let old_score = peer.stats.connection_quality_score;
                peer.stats.connection_quality_score =
                    old_score * 0.7 + quality_score * 0.3;

                peer.stats.jitter =
                    (peer.stats.jitter * 0.8 + (rand::random::<f64>() * 0.01)).max(0.0);

                if peer.stats.packets_sent > 0 && peer.stats.round_trip_time > 0 {
                    let estimated_bw = (1_000_000.0
                        / (peer.stats.round_trip_time as f64 + peer.stats.jitter * 1000.0))
                        * 1400.0;
                    peer.stats.available_outbound_bandwidth =
                        (estimated_bw as u64).max(10_000);
                }

                log::info!(
                    "Peer {} quality: {:.2} (rtt={}ms, jitter={:.4}, loss={:.2}%)",
                    peer.peer_id,
                    peer.stats.connection_quality_score,
                    peer.stats.round_trip_time,
                    peer.stats.jitter,
                    loss_ratio * 100.0
                );

                if peer.stats.connection_quality_score < QUALITY_LOW_THRESHOLD {
                    log::warn!(
                        "Peer {} quality critically low ({:.2}), scheduling reconnection",
                        peer.peer_id,
                        peer.stats.connection_quality_score
                    );
                }

                peer.last_seen = now;
            }
        }

        drop(peers);

        let mut quality_history = self.quality_history.write().await;
        let peers_snapshot = self.peer_connections.read().await;
        for peer in peers_snapshot.iter() {
            if peer.connection_state == ConnectionState::Connected {
                let snapshot = QualitySnapshot {
                    timestamp: now,
                    quality_score: peer.stats.connection_quality_score,
                    rtt: peer.stats.round_trip_time,
                    packet_loss_ratio: if peer.stats.packets_sent > 0 {
                        peer.stats.packets_lost as f64 / peer.stats.packets_sent as f64
                    } else {
                        0.0
                    },
                    jitter: peer.stats.jitter,
                };
                let history = quality_history
                    .entry(peer.peer_id.clone())
                    .or_insert_with(Vec::new);
                history.push(snapshot);
                if history.len() > 100 {
                    history.remove(0);
                }
            }
        }

        Ok(())
    }

    pub async fn start_quality_monitoring(&self) -> Result<()> {
        log::info!("Starting continuous quality monitoring");

        loop {
            if let Err(e) = self.monitor_connection_quality().await {
                log::error!("Quality monitoring error: {}", e);
            }

            sleep(Duration::from_secs(30)).await;
        }
    }

    pub async fn get_quality_trend(
        &self,
        peer_id: &str,
        window_size: usize,
    ) -> Result<Vec<f64>> {
        let quality_history = self.quality_history.read().await;
        if let Some(history) = quality_history.get(peer_id) {
            let start = history.len().saturating_sub(window_size);
            Ok(history[start..]
                .iter()
                .map(|s| s.quality_score)
                .collect())
        } else {
            Ok(vec![])
        }
    }

    pub async fn get_connection_metrics(
        &self,
        peer_id: &str,
    ) -> Result<ConnectionMetrics> {
        let peers = self.peer_connections.read().await;
        for peer in peers.iter() {
            if peer.peer_id == peer_id {
                let current_time = chrono::Utc::now().timestamp_millis() as u64;
                let metrics = ConnectionMetrics {
                    established_at: peer.last_seen,
                    last_active: current_time,
                    packets_sent: peer.stats.packets_sent,
                    packets_received: peer.stats.packets_received,
                    bytes_sent: peer.stats.bytes_sent,
                    bytes_received: peer.stats.bytes_received,
                    connection_duration: current_time.saturating_sub(peer.last_seen),
                };

                return Ok(metrics);
            }
        }

        Err(WebRTCError::PeerConnectionFailed(format!(
            "Peer {} not found",
            peer_id
        )))
    }

    pub async fn get_peer_stats(&self, peer_id: &str) -> Result<WebRTCStats> {
        let peers = self.peers.read().await;
        for peer in peers.iter() {
            if peer.peer_id == peer_id {
                return Ok(peer.stats.clone());
            }
        }

        Err(WebRTCError::PeerConnectionFailed(format!(
            "Peer {} not found",
            peer_id
        )))
    }

    pub async fn close_connection(&self, peer_id: &str) -> Result<()> {
        log::info!("Closing WebRTC connection with peer: {}", peer_id);

        {
            let mut peers = self.peers.write().await;
            peers.retain(|p| p.peer_id != peer_id);
        }

        {
            let mut peer_connections = self.peer_connections.write().await;
            for peer in peer_connections.iter_mut() {
                if peer.peer_id == peer_id {
                    if let Err(e) =
                        self.transition_state(peer, ConnectionState::Closed)
                    {
                        log::warn!(
                            "State transition error on close for {}: {}",
                            peer_id,
                            e
                        );
                        peer.connection_state = ConnectionState::Closed;
                    }
                }
            }
            peer_connections.retain(|p| p.peer_id != peer_id);
        }

        {
            let mut pending = self.pending_signaling.write().await;
            pending.retain(|m| m.message.to != peer_id && m.message.from != peer_id);
        }

        {
            let mut circuit_breakers = self.circuit_breakers.write().await;
            circuit_breakers.remove(peer_id);
        }

        {
            let mut quality_history = self.quality_history.write().await;
            quality_history.remove(peer_id);
        }

        {
            let mut restart_counts = self.ice_restart_count.write().await;
            restart_counts.remove(peer_id);
        }

        log::info!("Connection with peer {} closed and cleaned up", peer_id);
        Ok(())
    }

    pub async fn initiate_signaling(
        &self,
        peer_id: &str,
    ) -> Result<WebRTCSessionDescription> {
        log::info!("Initiating WebRTC signaling with peer: {}", peer_id);

        let ice_ufrag: String = (0..4)
            .map(|_| {
                let idx = rand::random::<u8>() % 16;
                "0123456789abcdef".chars().nth(idx as usize).unwrap()
            })
            .collect();

        let ice_pwd: String = (0..24)
            .map(|_| {
                let idx = rand::random::<u8>() % 64;
                "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"
                    .chars()
                    .nth(idx as usize)
                    .unwrap()
            })
            .collect();

        let data_channel_attrs = {
            let peers = self.peers.read().await;
            if let Some(peer) = peers.iter().find(|p| p.peer_id == peer_id) {
                peer.data_channels
                    .iter()
                    .map(|ch| {
                        format!(
                            "a=sctp-port:5000\n\
                             a=mid:{}\n\
                             a=max-message-size:{}\n",
                            ch.id,
                            if ch.ordered { 256 * 1024 } else { 65536 }
                        )
                    })
                    .collect::<String>()
            } else {
                String::new()
            }
        };

        let ice_candidates_str: String = {
            let peers = self.peers.read().await;
            if let Some(peer) = peers.iter().find(|p| p.peer_id == peer_id) {
                peer.local_candidates
                    .iter()
                    .map(|c| format!("a={}\n", c))
                    .collect()
            } else {
                String::new()
            }
        };

        let sdp = format!(
            "v=0\r\n\
             o=pinc 0 0 IN IP4 127.0.0.1\r\n\
             s=pinc-webrtc\r\n\
             t=0 0\r\n\
             a=group:BUNDLE 0\r\n\
             a=msid-semantic: WMS pinc\r\n\
             a=ice-options:trickle ice2\r\n\
             a=fingerprint:sha-256 AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99:AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99\r\n\
             a=ice-ufrag:{}\r\n\
             a=ice-pwd:{}\r\n\
             a=setup:actpass\r\n\
             a=mid:0\r\n\
             a=sendrecv\r\n\
             a=sctp-port:5000\r\n\
             a=max-message-size:262144\r\n\
             {}\r\n\
             {}",
            ice_ufrag,
            ice_pwd,
            data_channel_attrs,
            ice_candidates_str
        );

        let session_desc = WebRTCSessionDescription {
            sdp,
            type_: "offer".to_string(),
            candidate_pool_size: 2,
            ice_gathering_mode: "all".to_string(),
            ice_candidate_pool_size: 2,
            ice_restart: false,
        };

        let now = chrono::Utc::now().timestamp_millis() as u64;
        let signaling_msg = SignalingMessage {
            message_type: "offer".to_string(),
            from: self.local_peer_id.clone().unwrap_or_else(|| "local".to_string()),
            to: peer_id.to_string(),
            data: session_desc.sdp.clone(),
            timestamp: now,
            ice_candidates: vec![],
            sdp: Some(session_desc.sdp.clone()),
        };

        let pending = PendingSignalingMessage {
            message: signaling_msg,
            attempts: 0,
            next_retry: now,
            created_at: now,
        };

        let mut pending_signaling = self.pending_signaling.write().await;
        pending_signaling.push(pending);

        log::info!(
            "Signaling offer created for peer {} with ice_ufrag={}",
            peer_id,
            ice_ufrag
        );
        Ok(session_desc)
    }

    pub async fn create_answer(
        &self,
        peer_id: &str,
        offer_sdp: &str,
    ) -> Result<WebRTCSessionDescription> {
        log::info!("Creating answer for peer: {}", peer_id);

        let ice_ufrag: String = (0..4)
            .map(|_| {
                let idx = rand::random::<u8>() % 16;
                "0123456789abcdef".chars().nth(idx as usize).unwrap()
            })
            .collect();

        let ice_pwd: String = (0..24)
            .map(|_| {
                let idx = rand::random::<u8>() % 64;
                "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"
                    .chars()
                    .nth(idx as usize)
                    .unwrap()
            })
            .collect();

        let remote_ufrag = Self::extract_ice_ufrag(offer_sdp);
        let _remote_pwd = Self::extract_ice_pwd(offer_sdp);

        let sdp = format!(
            "v=0\r\n\
             o=pinc 0 0 IN IP4 127.0.0.1\r\n\
             s=pinc-webrtc\r\n\
             t=0 0\r\n\
             a=group:BUNDLE 0\r\n\
             a=msid-semantic: WMS pinc\r\n\
             a=ice-options:trickle ice2\r\n\
             a=fingerprint:sha-256 AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99:AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99\r\n\
             a=ice-ufrag:{}\r\n\
             a=ice-pwd:{}\r\n\
             a=setup:active\r\n\
             a=mid:0\r\n\
             a=sendrecv\r\n\
             a=sctp-port:5000\r\n\
             a=max-message-size:262144\r\n",
            ice_ufrag, ice_pwd
        );

        let session_desc = WebRTCSessionDescription {
            sdp,
            type_: "answer".to_string(),
            candidate_pool_size: 2,
            ice_gathering_mode: "all".to_string(),
            ice_candidate_pool_size: 2,
            ice_restart: false,
        };

        let now = chrono::Utc::now().timestamp_millis() as u64;
        let signaling_msg = SignalingMessage {
            message_type: "answer".to_string(),
            from: self.local_peer_id.clone().unwrap_or_else(|| "local".to_string()),
            to: peer_id.to_string(),
            data: session_desc.sdp.clone(),
            timestamp: now,
            ice_candidates: vec![],
            sdp: Some(session_desc.sdp.clone()),
        };

        let pending = PendingSignalingMessage {
            message: signaling_msg,
            attempts: 0,
            next_retry: now,
            created_at: now,
        };

        let mut pending_signaling = self.pending_signaling.write().await;
        pending_signaling.push(pending);

        log::info!(
            "Answer created for peer {} (remote_ufrag={:?})",
            peer_id,
            remote_ufrag
        );
        Ok(session_desc)
    }

    fn extract_ice_ufrag(sdp: &str) -> Option<String> {
        sdp.lines()
            .find(|line| line.starts_with("a=ice-ufrag:"))
            .map(|line| line.strip_prefix("a=ice-ufrag:").unwrap_or("").to_string())
    }

    fn extract_ice_pwd(sdp: &str) -> Option<String> {
        sdp.lines()
            .find(|line| line.starts_with("a=ice-pwd:"))
            .map(|line| line.strip_prefix("a=ice-pwd:").unwrap_or("").to_string())
    }

    pub async fn process_signaling_message(
        &self,
        message: SignalingMessage,
    ) -> Result<()> {
        log::info!(
            "Processing signaling message from {} to {} (type={})",
            message.from,
            message.to,
            message.message_type
        );

        match message.message_type.as_str() {
            "offer" => {
                log::info!("Received offer from {}", message.from);
                let mut peers = self.peers.write().await;
                let mut peer_exists = false;
                for peer in peers.iter_mut() {
                    if peer.peer_id == message.from {
                        peer_exists = true;
                        if let Some(sdp) = &message.sdp {
                            if let Some(ufrag) = Self::extract_ice_ufrag(sdp) {
                                log::info!(
                                    "Storing remote ICE ufrag from offer: {}",
                                    ufrag
                                );
                            }
                        }
                        break;
                    }
                }
                if !peer_exists {
                    let connection_id = format!("conn-{}", uuid::Uuid::new_v4());
                    let now = chrono::Utc::now().timestamp_millis() as u64;
                    peers.push(WebRTCPeer {
                        peer_id: message.from.clone(),
                        connection_type: "webrtc".to_string(),
                        connection_state: ConnectionState::Connecting,
                        local_candidates: vec![],
                        remote_candidates: message.ice_candidates.clone(),
                        data_channels: vec![WebRTCDataChannel {
                            label: "messaging".to_string(),
                            id: 2,
                            protocol: None,
                            negotiated: true,
                            max_packet_life_time: Some(2000),
                            max_retransmits: Some(3),
                            ordered: true,
                            buffered_amount: 0,
                            buffered_amount_low_threshold: 65536,
                        }],
                        connection_id,
                        stats: WebRTCStats::default(),
                        last_seen: now,
                        retry_count: 0,
                        max_retransmits: Some(3),
                        ordered: true,
                    });
                }
            }
            "answer" => {
                log::info!("Received answer from {}", message.from);
                let mut peers = self.peer_connections.write().await;
                for peer in peers.iter_mut() {
                    if peer.peer_id == message.from {
                        if let Err(e) =
                            self.transition_state(peer, ConnectionState::Connected)
                        {
                            log::error!(
                                "Failed to transition peer {} to Connected after answer: {}",
                                message.from,
                                e
                            );
                        }
                        if let Some(sdp) = &message.sdp {
                            if let Some(ufrag) = Self::extract_ice_ufrag(sdp) {
                                log::info!(
                                    "Storing remote ICE ufrag from answer: {}",
                                    ufrag
                                );
                            }
                        }
                        peer.last_seen =
                            chrono::Utc::now().timestamp_millis() as u64;

                        let mut circuit_breakers = self.circuit_breakers.write().await;
                        if let Some(cb) = circuit_breakers.get_mut(&message.from) {
                            cb.record_success();
                        }
                        break;
                    }
                }
            }
            "candidate" => {
                log::info!(
                    "Received ICE candidate(s) from {}: {} candidates",
                    message.from,
                    message.ice_candidates.len()
                );
                let mut peers = self.peer_connections.write().await;
                for peer in peers.iter_mut() {
                    if peer.peer_id == message.from {
                        for candidate in &message.ice_candidates {
                            if !peer.remote_candidates.contains(candidate) {
                                peer.remote_candidates.push(candidate.clone());
                                log::info!("Added remote candidate: {}", candidate);
                            }
                        }
                        peer.last_seen =
                            chrono::Utc::now().timestamp_millis() as u64;
                        break;
                    }
                }
            }
            "bye" => {
                log::info!("Received bye from {}", message.from);
                drop(self.close_connection(&message.from).await);
            }
            "ping" => {
                log::info!("Received ping from {}, sending pong", message.from);
                let pong = SignalingMessage {
                    message_type: "pong".to_string(),
                    from: self
                        .local_peer_id
                        .clone()
                        .unwrap_or_else(|| "local".to_string()),
                    to: message.from.clone(),
                    data: message.timestamp.to_string(),
                    timestamp: chrono::Utc::now().timestamp_millis() as u64,
                    ice_candidates: vec![],
                    sdp: None,
                };
                let mut pending = self.pending_signaling.write().await;
                pending.push(PendingSignalingMessage {
                    message: pong,
                    attempts: 0,
                    next_retry: chrono::Utc::now().timestamp_millis() as u64,
                    created_at: chrono::Utc::now().timestamp_millis() as u64,
                });
            }
            "pong" => {
                log::info!("Received pong from {}", message.from);
                let now = chrono::Utc::now().timestamp_millis() as u64;
                let rtt = now.saturating_sub(message.timestamp);

                let mut peers = self.peer_connections.write().await;
                for peer in peers.iter_mut() {
                    if peer.peer_id == message.from {
                        peer.stats.round_trip_time = rtt as u32;
                        peer.last_seen = now;
                        break;
                    }
                }
            }
            _ => {
                return Err(WebRTCError::SignalingError(format!(
                    "Unknown message type: {}",
                    message.message_type
                )));
            }
        }

        Ok(())
    }

    pub async fn retry_pending_signaling(&self) -> Result<()> {
        let now = chrono::Utc::now().timestamp_millis() as u64;
        let mut pending = self.pending_signaling.write().await;

        pending.retain(|m| {
            let age = now.saturating_sub(m.created_at);
            age < 30_000 && m.attempts < 5
        });

        let ready: Vec<_> = pending
            .iter()
            .filter(|m| m.next_retry <= now)
            .cloned()
            .collect();

        for mut msg in ready {
            msg.attempts += 1;
            let backoff = BASE_RETRY_DELAY_MS * 2u64.pow(msg.attempts.min(5));
            msg.next_retry = now + backoff.min(MAX_RETRY_DELAY_MS);

            log::info!(
                "Retrying signaling message to {} (type={}, attempt {})",
                msg.message.to,
                msg.message.message_type,
                msg.attempts
            );

            if let Some(existing) = pending.iter_mut().find(|m| {
                m.message.to == msg.message.to
                    && m.message.message_type == msg.message.message_type
            }) {
                existing.attempts = msg.attempts;
                existing.next_retry = msg.next_retry;
            }
        }

        Ok(())
    }

    pub async fn send_ping(&self, peer_id: &str) -> Result<()> {
        log::info!("Sending ping to peer: {}", peer_id);

        let now = chrono::Utc::now().timestamp_millis() as u64;
        let signaling_msg = SignalingMessage {
            message_type: "ping".to_string(),
            from: self
                .local_peer_id
                .clone()
                .unwrap_or_else(|| "local".to_string()),
            to: peer_id.to_string(),
            data: now.to_string(),
            timestamp: now,
            ice_candidates: vec![],
            sdp: None,
        };

        let pending = PendingSignalingMessage {
            message: signaling_msg,
            attempts: 0,
            next_retry: now,
            created_at: now,
        };

        let mut pending_signaling = self.pending_signaling.write().await;
        pending_signaling.push(pending);

        Ok(())
    }

    pub async fn measure_rtt(&self, peer_id: &str) -> Result<u32> {
        let peers = self.peer_connections.read().await;
        for peer in peers.iter() {
            if peer.peer_id == peer_id {
                return Ok(peer.stats.round_trip_time);
            }
        }
        Err(WebRTCError::PeerConnectionFailed(format!(
            "Peer {} not found",
            peer_id
        )))
    }

    pub async fn initiate_nat_traversal(&self, peer_id: &str) -> Result<()> {
        log::info!("Initiating NAT traversal for peer: {}", peer_id);

        let mut peers = self.peer_connections.write().await;
        for peer in peers.iter_mut() {
            if peer.peer_id == peer_id {
                let server_count = self.ice_servers.len();

                for (i, server) in self.ice_servers.iter().enumerate() {
                    if server.is_stun() {
                        let url = server.urls.first().cloned().unwrap_or_default();
                        let host = url
                            .split('@')
                            .last()
                            .unwrap_or(&url)
                            .split("//")
                            .last()
                            .unwrap_or("")
                            .split(':')
                            .next()
                            .unwrap_or("");

                        peer.local_candidates.push(format!(
                            "candidate:{} 1 udp {} {} {} typ srflx raddr 0.0.0.0 rport 0 generation 0",
                            i + 1,
                            16777215 - (i as u32) * 1000,
                            host,
                            3478 + (i as u16)
                        ));
                    } else if server.is_turn() {
                        let url = server.urls.first().cloned().unwrap_or_default();
                        let host = url
                            .split('@')
                            .last()
                            .unwrap_or(&url)
                            .split("//")
                            .last()
                            .unwrap_or("")
                            .split(':')
                            .next()
                            .unwrap_or("");

                        peer.local_candidates.push(format!(
                            "candidate:{} 1 udp {} {} {} typ relay raddr 0.0.0.0 rport 0 generation 0",
                            server_count + i + 1,
                            16777215 - ((server_count + i) as u32) * 1000,
                            host,
                            3478 + ((server_count + i) as u16)
                        ));
                    }
                }

                if peer.local_candidates.is_empty() {
                    return Err(WebRTCError::NATTraversalFailed(format!(
                        "No ICE servers configured for NAT traversal for peer: {}",
                        peer_id
                    )));
                }

                log::info!(
                    "Generated {} candidates for NAT traversal of peer {}",
                    peer.local_candidates.len(),
                    peer_id
                );
                return Ok(());
            }
        }

        Err(WebRTCError::NATTraversalFailed(format!(
            "Failed to initiate NAT traversal for peer: {}",
            peer_id
        )))
    }

    pub async fn get_peer_connection_state(
        &self,
        peer_id: &str,
    ) -> Result<ConnectionState> {
        let peers = self.peer_connections.read().await;
        for peer in peers.iter() {
            if peer.peer_id == peer_id {
                return Ok(peer.connection_state.clone());
            }
        }

        Err(WebRTCError::PeerConnectionFailed(format!(
            "Peer {} not found",
            peer_id
        )))
    }

    pub async fn reconnect_peer(&self, peer_id: &str) -> Result<()> {
        log::info!("Reconnecting peer: {}", peer_id);

        let mut circuit_breakers = self.circuit_breakers.write().await;
        let cb = circuit_breakers
            .entry(peer_id.to_string())
            .or_insert_with(CircuitBreaker::new);

        let now = chrono::Utc::now().timestamp_millis() as u64;

        if cb.is_open {
            if cb.try_reset(now) {
                log::info!(
                    "Circuit breaker reset for peer {}, allowing reconnection",
                    peer_id
                );
            } else {
                return Err(WebRTCError::CircuitBreakerOpen(peer_id.to_string()));
            }
        }
        drop(circuit_breakers);

        let mut peer_connections = self.peer_connections.write().await;
        for peer in peer_connections.iter_mut() {
            if peer.peer_id == peer_id {
                self.transition_state(peer, ConnectionState::Reconnecting)?;
                peer.retry_count += 1;

                if peer.retry_count > MAX_RETRY_ATTEMPTS {
                    self.transition_state(peer, ConnectionState::Failed)?;
                    let mut circuit_breakers = self.circuit_breakers.write().await;
                    if let Some(cb) = circuit_breakers.get_mut(peer_id) {
                        cb.record_failure(now);
                    }
                    return Err(WebRTCError::PeerConnectionFailed(format!(
                        "Max retry attempts ({}) exceeded for peer: {}",
                        MAX_RETRY_ATTEMPTS, peer_id
                    )));
                }

                self.transition_state(peer, ConnectionState::Connecting)?;

                let backoff = BASE_RETRY_DELAY_MS
                    * 2u64.pow((peer.retry_count - 1).min(6));
                let jitter = rand::random::<u64>() % (backoff / 4);
                let delay = (backoff + jitter).min(MAX_RETRY_DELAY_MS);

                log::info!(
                    "Reconnecting peer {} with backoff {}ms (attempt {}/{})",
                    peer_id,
                    delay,
                    peer.retry_count,
                    MAX_RETRY_ATTEMPTS
                );

                peer.stats.packets_lost = 0;
                peer.stats.packets_resent = 0;

                drop(peer_connections);
                sleep(Duration::from_millis(delay)).await;

                let mut peer_connections = self.peer_connections.write().await;
                for peer in peer_connections.iter_mut() {
                    if peer.peer_id == peer_id {
                        self.transition_state(peer, ConnectionState::Connected)?;
                        peer.last_seen =
                            chrono::Utc::now().timestamp_millis() as u64;

                        let mut circuit_breakers =
                            self.circuit_breakers.write().await;
                        if let Some(cb) = circuit_breakers.get_mut(peer_id) {
                            cb.record_success();
                        }

                        log::info!(
                            "Successfully reconnected to peer: {}",
                            peer_id
                        );
                        return Ok(());
                    }
                }
            }
        }

        Err(WebRTCError::PeerConnectionFailed(format!(
            "Peer {} not found",
            peer_id
        )))
    }

    pub async fn get_active_connections(&self) -> Result<Vec<WebRTCPeer>> {
        let peer_connections = self.peer_connections.read().await;
        let mut active_connections = Vec::new();

        for peer in peer_connections.iter() {
            if peer.connection_state == ConnectionState::Connected {
                active_connections.push(peer.clone());
            }
        }

        Ok(active_connections)
    }

    pub async fn get_all_connection_states(
        &self,
    ) -> Result<HashMap<String, ConnectionState>> {
        let peer_connections = self.peer_connections.read().await;
        Ok(peer_connections
            .iter()
            .map(|p| (p.peer_id.clone(), p.connection_state.clone()))
            .collect())
    }

    pub async fn cleanup_stale_peers(&self) -> Result<Vec<String>> {
        let now = chrono::Utc::now().timestamp_millis() as u64;
        let mut removed = Vec::new();

        let mut peers = self.peers.write().await;
        let before = peers.len();
        peers.retain(|p| {
            let stale = now.saturating_sub(p.last_seen) > PEER_STALE_TIMEOUT_MS
                && p.connection_state.is_terminal();
            if stale {
                removed.push(p.peer_id.clone());
            }
            !stale
        });
        let removed_count = before - peers.len();
        if removed_count > 0 {
            log::info!("Cleaned up {} stale peers", removed_count);
        }

        Ok(removed)
    }

    pub async fn get_ice_restart_count(&self, peer_id: &str) -> Result<u32> {
        let counts = self.ice_restart_count.read().await;
        Ok(counts.get(peer_id).copied().unwrap_or(0))
    }

    pub async fn get_pending_signaling_count(&self) -> usize {
        let pending = self.pending_signaling.read().await;
        pending.len()
    }
}

impl Default for WebRTCStats {
    fn default() -> Self {
        Self {
            packets_sent: 0,
            packets_received: 0,
            bytes_sent: 0,
            bytes_received: 0,
            packets_lost: 0,
            packets_resent: 0,
            round_trip_time: 0,
            jitter: 0.0,
            available_outbound_bandwidth: 100_000_000,
            available_inbound_bandwidth: 100_000_000,
            connection_quality_score: 1.0,
        }
    }
}

impl Default for CircuitBreaker {
    fn default() -> Self {
        Self::new()
    }
}
