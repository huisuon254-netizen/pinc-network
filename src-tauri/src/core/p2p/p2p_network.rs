use std::collections::HashMap;
use std::sync::Arc;
use std::time::Duration;
use tokio::io::{AsyncReadExt, AsyncWriteExt};
use tokio::net::{TcpListener, TcpStream};
use tokio::sync::{mpsc, oneshot, Mutex};
use crate::core::network::types::PeerInfo;
use crate::core::network::peer::PeerRegistry;

const MSG_LEN_BYTES: usize = 4;
const PROTOCOL_VERSION: &str = "pinc/3.0.0";

#[derive(Debug, Clone)]
struct PeerConnection {
    peer_id: String,
    address: String,
}

enum NetworkCmd {
    StartListening(u16),
    DialPeer(String, oneshot::Sender<Result<PeerInfo, String>>),
    GetLocalPeerId(oneshot::Sender<String>),
    GetListenAddrs(oneshot::Sender<Vec<String>>),
    IsListening(oneshot::Sender<bool>),
    TriggerDiscovery,
    Shutdown,
}

pub struct P2PNetwork {
    cmd_tx: mpsc::UnboundedSender<NetworkCmd>,
}

impl P2PNetwork {
    pub fn new(peer_registry: Arc<std::sync::Mutex<PeerRegistry>>) -> Self {
        let (cmd_tx, cmd_rx) = mpsc::unbounded_channel();
        tauri::async_runtime::spawn(run_p2p_network(cmd_rx, peer_registry));
        P2PNetwork { cmd_tx }
    }

    pub fn start_listening(&self, port: u16) {
        let _ = self.cmd_tx.send(NetworkCmd::StartListening(port));
    }

    pub fn trigger_discovery(&self) {
        let _ = self.cmd_tx.send(NetworkCmd::TriggerDiscovery);
    }

    pub async fn connect_to_peer(&self, addr: &str) -> Result<PeerInfo, String> {
        let (reply_tx, reply_rx) = oneshot::channel();
        self.cmd_tx
            .send(NetworkCmd::DialPeer(addr.to_string(), reply_tx))
            .map_err(|_| "Network channel closed".to_string())?;
        tokio::time::timeout(Duration::from_secs(10), reply_rx)
            .await
            .map_err(|_| "Connection timeout".to_string())?
            .map_err(|e| e.to_string())?
    }

    pub async fn local_peer_id(&self) -> String {
        let (reply_tx, reply_rx) = oneshot::channel();
        let _ = self.cmd_tx.send(NetworkCmd::GetLocalPeerId(reply_tx));
        reply_rx.await.unwrap_or_default()
    }

    pub async fn listen_addresses(&self) -> Vec<String> {
        let (reply_tx, reply_rx) = oneshot::channel();
        let _ = self.cmd_tx.send(NetworkCmd::GetListenAddrs(reply_tx));
        reply_rx.await.unwrap_or_default()
    }

    pub async fn is_listening(&self) -> bool {
        let (reply_tx, reply_rx) = oneshot::channel();
        let _ = self.cmd_tx.send(NetworkCmd::IsListening(reply_tx));
        reply_rx.await.unwrap_or(false)
    }
}

fn generate_peer_id() -> String {
    use sha2::{Sha256, Digest};
    let random_bytes: Vec<u8> = (0..32).map(|_| rand::random::<u8>()).collect();
    let mut hasher = Sha256::new();
    hasher.update(&random_bytes);
    let result = hasher.finalize();
    hex::encode(&result[..16])
}

async fn run_p2p_network(
    mut cmd_rx: mpsc::UnboundedReceiver<NetworkCmd>,
    peer_registry: Arc<std::sync::Mutex<PeerRegistry>>,
) {
    let local_peer_id = generate_peer_id();
    log::info!("PINC P2P: local peer ID: {}", local_peer_id);

    let listen_addrs: Arc<Mutex<Vec<String>>> = Arc::new(Mutex::new(Vec::new()));
    let connected_peers: Arc<Mutex<HashMap<String, PeerConnection>>> =
        Arc::new(Mutex::new(HashMap::new()));

    let mut heartbeat = tokio::time::interval(Duration::from_secs(30));

    loop {
        tokio::select! {
            cmd = cmd_rx.recv() => {
                match cmd {
                    Some(NetworkCmd::StartListening(port)) => {
                        let addr = format!("0.0.0.0:{}", port);
                        match TcpListener::bind(&addr).await {
                            Ok(listener) => {
                                let listen_addr = format!("127.0.0.1:{}", port);
                                listen_addrs.lock().await.push(listen_addr.clone());
                                log::info!("PINC P2P: listening on {}", listen_addr);

                                let peer_registry = peer_registry.clone();
                                let connected_peers = connected_peers.clone();
                                let local_id = local_peer_id.clone();
                                tokio::spawn(async move {
                                    accept_loop(listener, peer_registry, connected_peers, local_id).await;
                                });
                            }
                            Err(e) => log::error!("PINC P2P: listen failed: {}", e),
                        }
                    }
                    Some(NetworkCmd::TriggerDiscovery) => {
                        let addrs = listen_addrs.lock().await.clone();
                        log::info!("PINC P2P: discovery triggered, {} listen addresses", addrs.len());
                        for addr in &addrs {
                            log::info!("PINC P2P: advertising {}", addr);
                        }
                    }
                    Some(NetworkCmd::DialPeer(addr_str, reply_tx)) => {
                        let peer_registry = peer_registry.clone();
                        let connected_peers = connected_peers.clone();
                        let local_id = local_peer_id.clone();
                        let addr = addr_str.clone();
                        tokio::spawn(async move {
                            match TcpStream::connect(&addr).await {
                                Ok(stream) => {
                                    let peer_id = perform_handshake(stream, &local_id, true).await;
                                    let peer_info = PeerInfo {
                                        id: peer_id.clone(),
                                        address: addr.clone(),
                                        public_key: String::new(),
                                        latency_ms: 0,
                                        trust_score: 0.5,
                                        relay_score: 0.5,
                                        online: true,
                                        last_seen: now_secs(),
                                    };
                                    if let Ok(reg) = peer_registry.lock() {
                                        reg.add_peer(peer_info.clone());
                                    }
                                    connected_peers.lock().await.insert(
                                        peer_id.clone(),
                                        PeerConnection { peer_id: peer_id.clone(), address: addr.clone() },
                                    );
                                    log::info!("PINC P2P: connected to peer {} at {}", peer_id, addr);
                                    let _ = reply_tx.send(Ok(peer_info));
                                }
                                Err(e) => {
                                    log::error!("PINC P2P: dial {} failed: {}", addr, e);
                                    let _ = reply_tx.send(Err(format!("Connection failed: {}", e)));
                                }
                            }
                        });
                    }
                    Some(NetworkCmd::GetLocalPeerId(reply_tx)) => {
                        let _ = reply_tx.send(local_peer_id.clone());
                    }
                    Some(NetworkCmd::GetListenAddrs(reply_tx)) => {
                        let addrs = listen_addrs.lock().await.clone();
                        let _ = reply_tx.send(addrs);
                    }
                    Some(NetworkCmd::IsListening(reply_tx)) => {
                        let addrs = listen_addrs.lock().await;
                        let _ = reply_tx.send(!addrs.is_empty());
                    }
                    Some(NetworkCmd::Shutdown) | None => {
                        log::info!("PINC P2P: shutting down");
                        break;
                    }
                }
            }
            _ = heartbeat.tick() => {
                let online_ids: Vec<String> = {
                    match peer_registry.lock() {
                        Ok(reg) => reg.list_peers().iter().filter(|p| p.online).map(|p| p.id.clone()).collect(),
                        Err(_) => vec![],
                    }
                };
                log::debug!("PINC P2P: heartbeat — {} online peers", online_ids.len());
            }
        }
    }
}

async fn accept_loop(
    listener: TcpListener,
    peer_registry: Arc<std::sync::Mutex<PeerRegistry>>,
    connected_peers: Arc<Mutex<HashMap<String, PeerConnection>>>,
    local_peer_id: String,
) {
    loop {
        match listener.accept().await {
            Ok((stream, peer_addr)) => {
                log::info!("PINC P2P: incoming connection from {}", peer_addr);
                let peer_registry = peer_registry.clone();
                let connected_peers = connected_peers.clone();
                let local_id = local_peer_id.clone();
                tokio::spawn(async move {
                    let peer_id = perform_handshake(stream, &local_id, false).await;
                    let peer_info = PeerInfo {
                        id: peer_id.clone(),
                        address: peer_addr.to_string(),
                        public_key: String::new(),
                        latency_ms: 0,
                        trust_score: 0.5,
                        relay_score: 0.5,
                        online: true,
                        last_seen: now_secs(),
                    };
                    if let Ok(reg) = peer_registry.lock() {
                        reg.add_peer(peer_info);
                    }
                    connected_peers.lock().await.insert(
                        peer_id.clone(),
                        PeerConnection { peer_id: peer_id.clone(), address: peer_addr.to_string() },
                    );
                    log::info!("PINC P2P: handshake complete with {} at {}", peer_id, peer_addr);
                });
            }
            Err(e) => {
                log::error!("PINC P2P: accept error: {}", e);
                tokio::time::sleep(Duration::from_millis(100)).await;
            }
        }
    }
}

async fn perform_handshake(
    mut stream: TcpStream,
    local_id: &str,
    _is_dialer: bool,
) -> String {
    let handshake = serde_json::json!({
        "protocol": PROTOCOL_VERSION,
        "peer_id": local_id,
        "timestamp": now_secs(),
    });
    let payload = handshake.to_string();
    let len = (payload.len() as u32).to_be_bytes();
    let _ = stream.write_all(&len).await;
    let _ = stream.write_all(payload.as_bytes()).await;

    let mut len_buf = [0u8; MSG_LEN_BYTES];
    if stream.read_exact(&mut len_buf).await.is_err() {
        return format!("unknown-{}", rand::random::<u32>());
    }
    let msg_len = u32::from_be_bytes(len_buf) as usize;
    if msg_len > 1024 * 1024 {
        return format!("unknown-{}", rand::random::<u32>());
    }
    let mut buf = vec![0u8; msg_len];
    if stream.read_exact(&mut buf).await.is_err() {
        return format!("unknown-{}", rand::random::<u32>());
    }
    let remote: serde_json::Value = serde_json::from_slice(&buf).unwrap_or(serde_json::json!({}));
    remote["peer_id"].as_str().unwrap_or(&format!("unknown-{}", rand::random::<u32>())).to_string()
}

async fn write_message(stream: &mut TcpStream, data: &[u8]) -> Result<(), std::io::Error> {
    let len = (data.len() as u32).to_be_bytes();
    stream.write_all(&len).await?;
    stream.write_all(data).await?;
    stream.flush().await?;
    Ok(())
}

async fn read_message(stream: &mut TcpStream) -> Result<Vec<u8>, std::io::Error> {
    let mut len_buf = [0u8; MSG_LEN_BYTES];
    stream.read_exact(&mut len_buf).await?;
    let msg_len = u32::from_be_bytes(len_buf) as usize;
    if msg_len > 10 * 1024 * 1024 {
        return Err(std::io::Error::new(std::io::ErrorKind::InvalidData, "message too large"));
    }
    let mut buf = vec![0u8; msg_len];
    stream.read_exact(&mut buf).await?;
    Ok(buf)
}

fn now_secs() -> i64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs() as i64
}
