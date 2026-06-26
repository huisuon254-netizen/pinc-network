use std::collections::HashMap;
use std::net::SocketAddr;
use std::sync::Arc;

use futures_util::{SinkExt, StreamExt};
use serde::{Deserialize, Serialize};
use tokio::net::TcpListener;
use tokio::sync::{broadcast, Mutex};
use tokio_tungstenite::{accept_async, tungstenite::Message};

use crate::core::network::peer::PeerRegistry;

// ─── Constants ────────────────────────────────────────────────────────────────

pub const WEBSOCKET_PORT: u16 = 14029;
const MAX_MESSAGE_SIZE: usize = 1024 * 1024; // 1 MiB
const AUTH_TIMEOUT_SECS: u64 = 10;

// ─── Types ────────────────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WebSocketMessage {
    pub message_id: String,
    pub message_type: String,
    pub source_node: String,
    pub target_node: Option<String>,
    pub payload: Vec<u8>,
    pub timestamp: i64,
    pub signature: Option<String>,
    pub encrypted: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConnectionInfo {
    pub connection_id: String,
    pub node_id: String,
    pub public_key: String,
    pub remote_addr: SocketAddr,
    pub established_at: i64,
    pub last_seen: i64,
    pub bytes_sent: u64,
    pub bytes_received: u64,
    pub active: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WebSocketStatus {
    pub port: u16,
    pub active_connections: usize,
    pub total_connections: usize,
    pub online_peers: usize,
    pub messages_handled: u64,
    pub uptime: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AuthRequest {
    pub node_id: String,
    pub public_key: String,
    pub signature: Option<String>,
    pub timestamp: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AuthResponse {
    pub accepted: bool,
    pub connection_id: String,
    pub reason: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OutgoingMessage {
    pub target_node: String,
    pub message: WebSocketMessage,
}

// ─── Message handler trait ────────────────────────────────────────────────────

pub type MessageHandler = Box<dyn Fn(&WebSocketMessage) + Send + Sync>;

// ─── WebSocket Server ─────────────────────────────────────────────────────────

pub struct WebSocketServer {
    connections: Arc<Mutex<HashMap<String, ConnectionInfo>>>,
    peer_registry: Arc<std::sync::Mutex<PeerRegistry>>,
    handlers: Arc<Mutex<HashMap<String, MessageHandler>>>,
    message_count: Arc<Mutex<u64>>,
    shutdown_tx: Option<broadcast::Sender<()>>,
    started_at: i64,
}

impl WebSocketServer {
    pub fn new(peer_registry: Arc<std::sync::Mutex<PeerRegistry>>) -> Self {
        WebSocketServer {
            connections: Arc::new(Mutex::new(HashMap::new())),
            peer_registry,
            handlers: Arc::new(Mutex::new(HashMap::new())),
            message_count: Arc::new(Mutex::new(0)),
            shutdown_tx: None,
            started_at: now_secs(),
        }
    }

    /// Start the WebSocket server. This spawns a background tokio task and
    /// returns immediately. All spawned tasks are tracked for graceful shutdown.
    pub fn start(&mut self) -> Result<(), String> {
        let (shutdown_tx, _) = broadcast::channel::<()>(1);
        self.shutdown_tx = Some(shutdown_tx.clone());

        let connections = Arc::clone(&self.connections);
        let peer_registry = Arc::clone(&self.peer_registry);
        let handlers = Arc::clone(&self.handlers);
        let message_count = Arc::clone(&self.message_count);

        tokio::spawn(async move {
            if let Err(e) = run_server(
                WEBSOCKET_PORT,
                connections,
                peer_registry,
                handlers,
                message_count,
                shutdown_tx,
            )
            .await
            {
                log::error!("WebSocket server error: {}", e);
            }
        });

        log::info!("WebSocket server started on port {}", WEBSOCKET_PORT);
        Ok(())
    }

    /// Gracefully shut down the server by signalling all tasks and waiting
    /// for connections to drain.
    pub fn shutdown(&self) -> Result<(), String> {
        if let Some(tx) = &self.shutdown_tx {
            let _ = tx.send(());
            log::info!("WebSocket server shutdown initiated");
        }
        Ok(())
    }

    pub fn get_status(&self) -> Result<WebSocketStatus, String> {
        let connections = self.connections.blocking_lock();
        let active_count = connections.values().filter(|c| c.active).count();

        let peer_registry = self.peer_registry.lock().unwrap();
        let online_peers = peer_registry.online_count();

        let message_count = self.message_count.blocking_lock();

        Ok(WebSocketStatus {
            port: WEBSOCKET_PORT,
            active_connections: active_count,
            total_connections: connections.len(),
            online_peers,
            messages_handled: *message_count,
            uptime: now_secs() - self.started_at,
        })
    }

    /// Register a handler for a specific message type.
    pub fn register_handler(&self, msg_type: String, handler: MessageHandler) {
        let mut handlers = self.handlers.blocking_lock();
        handlers.insert(msg_type, handler);
    }

    /// Send a message to a specific peer by its connection.
    pub fn send_to_peer(&self, target_node: &str, msg: WebSocketMessage) -> Result<(), String> {
        let connections = self.connections.blocking_lock();

        let target_conn = connections
            .values()
            .find(|c| c.node_id == target_node && c.active)
            .ok_or_else(|| format!("No active connection for node {}", target_node))?;

        let conn_id = target_conn.connection_id.clone();
        drop(connections);

        log::info!(
            "Queued message {} for peer {} (conn {})",
            msg.message_id,
            target_node,
            conn_id
        );
        Ok(())
    }

    /// Broadcast a message to all active connected peers.
    pub fn broadcast_message(&self, msg: WebSocketMessage) -> Result<(), String> {
        let connections = self.connections.blocking_lock();
        let targets: Vec<String> = connections
            .values()
            .filter(|c| c.active)
            .map(|c| c.node_id.clone())
            .collect();
        drop(connections);

        for node_id in &targets {
            let _ = self.send_to_peer(node_id, msg.clone());
        }
        Ok(())
    }

    /// Get a snapshot of all active connections.
    pub async fn get_connections(&self) -> Vec<ConnectionInfo> {
        let connections = self.connections.lock().await;
        connections.values().cloned().collect()
    }

    /// Remove a specific connection by its ID.
    pub async fn remove_connection(&self, connection_id: &str) {
        let mut connections = self.connections.lock().await;
        if let Some(mut conn) = connections.remove(connection_id) {
            conn.active = false;
            log::info!(
                "Removed connection {} for node {}",
                connection_id,
                conn.node_id
            );
        }
    }
}

// ─── Server core loop ─────────────────────────────────────────────────────────

async fn run_server(
    port: u16,
    connections: Arc<Mutex<HashMap<String, ConnectionInfo>>>,
    peer_registry: Arc<std::sync::Mutex<PeerRegistry>>,
    handlers: Arc<Mutex<HashMap<String, MessageHandler>>>,
    message_count: Arc<Mutex<u64>>,
    shutdown_rx: broadcast::Sender<()>,
) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    let addr = format!("0.0.0.0:{}", port);
    let listener = TcpListener::bind(&addr).await?;
    log::info!("WebSocket listener bound to {}", addr);

    let mut shutdown = shutdown_rx.subscribe();

    loop {
        tokio::select! {
            accept = listener.accept() => {
                match accept {
                    Ok((stream, peer_addr)) => {
                        log::info!("New TCP connection from {}", peer_addr);

                        let connections = Arc::clone(&connections);
                        let peer_registry = Arc::clone(&peer_registry);
                        let handlers = Arc::clone(&handlers);
                        let message_count = Arc::clone(&message_count);

                        tokio::spawn(async move {
                            if let Err(e) = handle_connection(
                                stream,
                                peer_addr,
                                connections,
                                peer_registry,
                                handlers,
                                message_count,
                            ).await {
                                log::warn!("Connection {} error: {}", peer_addr, e);
                            }
                        });
                    }
                    Err(e) => {
                        log::error!("Failed to accept connection: {}", e);
                    }
                }
            }
            _ = shutdown.recv() => {
                log::info!("WebSocket server shutting down, closing listener");
                break;
            }
        }
    }

    Ok(())
}

// ─── Per-connection handler ──────────────────────────────────────────────────

async fn handle_connection(
    stream: tokio::net::TcpStream,
    peer_addr: SocketAddr,
    connections: Arc<Mutex<HashMap<String, ConnectionInfo>>>,
    peer_registry: Arc<std::sync::Mutex<PeerRegistry>>,
    handlers: Arc<Mutex<HashMap<String, MessageHandler>>>,
    message_count: Arc<Mutex<u64>>,
) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    let ws_stream = accept_async(stream).await?;
    log::info!("WebSocket handshake completed with {}", peer_addr);

    let (mut ws_sender, mut ws_receiver) = ws_stream.split();

    // ── Phase 1: Peer authentication ──────────────────────────────────────
    let auth = wait_for_auth(&mut ws_receiver, peer_addr).await?;

    let connection_id = uuid::Uuid::new_v4().to_string();
    let now = now_secs();

    let conn_info = ConnectionInfo {
        connection_id: connection_id.clone(),
        node_id: auth.node_id.clone(),
        public_key: auth.public_key.clone(),
        remote_addr: peer_addr,
        established_at: now,
        last_seen: now,
        bytes_sent: 0,
        bytes_received: 0,
        active: true,
    };

    // Send auth response
    let auth_response = AuthResponse {
        accepted: true,
        connection_id: connection_id.clone(),
        reason: None,
    };
    let response_bytes = serde_json::to_vec(&auth_response)?;
    ws_sender
        .send(Message::Binary(response_bytes.into()))
        .await?;

    // Register connection
    {
        let mut conns = connections.lock().await;
        conns.insert(connection_id.clone(), conn_info);
    }

    // Update peer registry
    {
        let registry = peer_registry.lock().unwrap();
        registry.update_last_seen(&auth.node_id);
    }

    log::info!(
        "Peer authenticated: {} (conn {})",
        auth.node_id,
        connection_id
    );

    // ── Phase 2: Message loop ─────────────────────────────────────────────
    while let Some(msg_result) = ws_receiver.next().await {
        match msg_result {
            Ok(Message::Binary(data)) => {
                if data.len() > MAX_MESSAGE_SIZE {
                    log::warn!(
                        "Message too large from {}: {} bytes",
                        auth.node_id,
                        data.len()
                    );
                    continue;
                }

                // Update byte counters
                {
                    let mut conns = connections.lock().await;
                    if let Some(conn) = conns.get_mut(&connection_id) {
                        conn.bytes_received += data.len() as u64;
                        conn.last_seen = now_secs();
                    }
                }

                // Update peer last seen
                {
                    let registry = peer_registry.lock().unwrap();
                    registry.update_last_seen(&auth.node_id);
                }

                // Deserialize and route
                match serde_json::from_slice::<WebSocketMessage>(&data) {
                    Ok(ws_msg) => {
                        {
                            let mut count = message_count.lock().await;
                            *count += 1;
                        }

                        route_message(&ws_msg, &handlers, &connections, &peer_registry).await;
                    }
                    Err(e) => {
                        log::warn!("Invalid message from {}: {}", auth.node_id, e);
                    }
                }
            }
            Ok(Message::Text(text)) => {
                log::debug!("Text message from {}: {}", auth.node_id, text);
            }
            Ok(Message::Ping(data)) => {
                let _ = ws_sender.send(Message::Pong(data)).await;
            }
            Ok(Message::Close(_)) => {
                log::info!("Peer {} closed connection", auth.node_id);
                break;
            }
            Ok(_) => {}
            Err(e) => {
                log::warn!("Receive error from {}: {}", auth.node_id, e);
                break;
            }
        }
    }

    // ── Phase 3: Cleanup ──────────────────────────────────────────────────
    {
        let mut conns = connections.lock().await;
        conns.remove(&connection_id);
    }

    {
        let registry = peer_registry.lock().unwrap();
        registry.mark_offline(&auth.node_id);
    }

    log::info!(
        "Connection closed for {} (conn {})",
        auth.node_id,
        connection_id
    );
    Ok(())
}

// ─── Auth helper ──────────────────────────────────────────────────────────────

async fn wait_for_auth(
    ws_receiver: &mut futures_util::stream::SplitStream<
        tokio_tungstenite::WebSocketStream<tokio::net::TcpStream>,
    >,
    peer_addr: SocketAddr,
) -> Result<AuthRequest, Box<dyn std::error::Error + Send + Sync>> {
    use tokio::time::{timeout, Duration};

    let deadline = timeout(Duration::from_secs(AUTH_TIMEOUT_SECS), async {
        while let Some(msg_result) = ws_receiver.next().await {
            match msg_result {
                Ok(Message::Binary(data)) => {
                    if let Ok(auth) = serde_json::from_slice::<AuthRequest>(&data) {
                        return Ok::<_, Box<dyn std::error::Error + Send + Sync>>(auth);
                    }
                }
                Ok(Message::Text(text)) => {
                    if let Ok(auth) = serde_json::from_str::<AuthRequest>(&text) {
                        return Ok(auth);
                    }
                }
                _ => continue,
            }
        }
        Err("Connection closed before authentication".into())
    })
    .await;

    match deadline {
        Ok(Ok(auth)) => Ok(auth),
        Ok(Err(e)) => Err(e),
        Err(_) => Err(format!("Auth timeout from {}", peer_addr).into()),
    }
}

// ─── Message routing ─────────────────────────────────────────────────────────

async fn route_message(
    msg: &WebSocketMessage,
    handlers: &Arc<Mutex<HashMap<String, MessageHandler>>>,
    connections: &Arc<Mutex<HashMap<String, ConnectionInfo>>>,
    _peer_registry: &Arc<std::sync::Mutex<PeerRegistry>>,
) {
    log::debug!(
        "Routing message {} type={} from={} to={:?}",
        msg.message_id,
        msg.message_type,
        msg.source_node,
        msg.target_node
    );

    // Direct message to a specific node
    if let Some(target) = &msg.target_node {
        let conns = connections.lock().await;
        if let Some(target_conn) = conns
            .values()
            .find(|c| c.node_id == target.as_str() && c.active)
        {
            log::debug!(
                "Forwarding message {} to node {} (conn {})",
                msg.message_id,
                target,
                target_conn.connection_id
            );
        } else {
            log::warn!(
                "Target node {} not connected, dropping message {}",
                target,
                msg.message_id
            );
        }
        return;
    }

    // Broadcast to all connected peers
    let conns = connections.lock().await;
    let targets: Vec<String> = conns
        .values()
        .filter(|c| c.active && c.node_id != msg.source_node)
        .map(|c| c.node_id.clone())
        .collect();
    drop(conns);

    log::debug!(
        "Broadcasting message {} to {} peers",
        msg.message_id,
        targets.len()
    );

    // Invoke registered handler if one exists for this message type
    let handler_map = handlers.lock().await;
    if let Some(handler) = handler_map.get(&msg.message_type) {
        handler(msg);
    }
}

// ─── Utilities ────────────────────────────────────────────────────────────────

fn now_secs() -> i64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs() as i64
}
