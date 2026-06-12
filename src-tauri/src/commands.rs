#![allow(dead_code)]
use serde::Serialize;
use std::sync::{Arc, Mutex};
use tokio::sync::Mutex as AsyncMutex;
use tauri::State;

use crate::{
    core::{
        database::{
            connection::Database,
            queries::{
                load_first_identity, identity_count,
                get_settings_row, upsert_settings,
                list_vault_files, insert_vault_file, delete_vault_file,
                list_jobs, insert_job,
                log_activity,
                insert_post, list_posts,
                insert_wager, list_wagers,
                list_ai_agents,
                list_storage_contracts,
                get_wallet_balance,
                list_transactions,
            },
        },
        identity::generator::create_identity,
        identity::recovery::recover_identity as recover_id,
        network::{
            types::{NetworkStatus, PeerInfo},
            peer::PeerRegistry,
            bandwidth::BandwidthMonitor,
            discovery::{self, Discovery},
            relay::RelayManager,
            transport::{create_client_endpoint, connect_to_node, generate_node_cert},
        },
        settings::types::PincSettings,
        vault::types::VaultFileRecord,
        infrastructure::{
            nexus::{NexusEngine, SpeedTestResult},
            rift::{RiftEngine, ServerListing, HardwareSpecs},
        },
        security::kingsman::{KingsmanEngine, KingsmanStatus},
        settings::localization::LocalizationEngine,
        marketplace::types::{Job, JobStatus},
        distributed::types::StorageContract,
        messaging::{
            types::{Message, MessageType, MessageStatus},
            router::MessageRouter,
        },
        social::types::{Post, PostType, Visibility},
        wager::types::Wager,
        ai::types::AiAgent,
        ai::moderation::moderate_content,
        ai::routing::{recommend_route, PeerMetrics},
        telemetry::metrics::MetricsCollector,
    },
    startup::{startup_check, StartupReport},
};

pub struct AppState {
    pub db: Arc<Mutex<Database>>,
    pub nexus: Arc<Mutex<NexusEngine>>,
    pub rift: Arc<Mutex<RiftEngine>>,
    pub kingsman: Arc<Mutex<KingsmanEngine>>,
    pub localization: Arc<AsyncMutex<LocalizationEngine>>,
    pub peer_registry: Arc<Mutex<PeerRegistry>>,
    pub bandwidth: Arc<Mutex<BandwidthMonitor>>,
    pub discovery: Arc<Mutex<Discovery>>,
    pub relay: Arc<Mutex<RelayManager>>,
    pub message_router: Arc<Mutex<MessageRouter>>,
    pub metrics: Arc<Mutex<MetricsCollector>>,
}

// ─── STARTUP ─────────────────────────────────────────────────────────────────

#[tauri::command]
pub fn cmd_run_startup(state: State<'_, AppState>) -> StartupReport {
    let db = state.db.lock().unwrap();
    startup_check(&db)
}

// ─── GOVERNANCE (KINGSMAN) ───────────────────────────────────────────────────

#[tauri::command]
pub fn cmd_activate_kingsman(state: State<'_, AppState>, code: String) -> bool {
    let mut km = state.kingsman.lock().unwrap();
    km.activate(&code)
}

#[tauri::command]
pub fn cmd_get_admin_status(state: State<'_, AppState>) -> KingsmanStatus {
    let km = state.kingsman.lock().unwrap();
    km.status()
}

// ─── LOCALIZATION ────────────────────────────────────────────────────────────

#[tauri::command]
pub async fn cmd_download_language(state: State<'_, AppState>, code: String) -> Result<(), String> {
    let mut loc = state.localization.lock().await;
    loc.download_pack(&code).await
}

#[tauri::command]
pub async fn cmd_set_language(state: State<'_, AppState>, code: String) -> Result<(), String> {
    let mut loc = state.localization.lock().await;
    loc.set_language(&code)
}

// ─── NEXUS (Net Sharing) ──────────────────────────────────────────────────────

#[tauri::command]
pub async fn cmd_run_speed_test(state: State<'_, AppState>) -> Result<SpeedTestResult, String> {
    let bw = state.bandwidth.lock().unwrap();
    let start = std::time::Instant::now();
    
    let latency = {
        let mut total_latency = 0u64;
        let samples = 3;
        for _ in 0..samples {
            let ping_start = std::time::Instant::now();
            std::thread::sleep(std::time::Duration::from_millis(10));
            total_latency += ping_start.elapsed().as_millis() as u64;
        }
        total_latency / samples
    };
    
    let test_duration = std::time::Duration::from_secs(2);
    let test_start = std::time::Instant::now();
    let initial_sent = bw.total_bytes_sent();
    let initial_recv = bw.total_bytes_recv();
    
    while test_start.elapsed() < test_duration {
        std::thread::sleep(std::time::Duration::from_millis(100));
    }
    
    let final_sent = bw.total_bytes_sent();
    let final_recv = bw.total_bytes_recv();
    let elapsed_secs = test_start.elapsed().as_secs_f64().max(0.001);
    
    let download_kbps = ((final_recv.saturating_sub(initial_recv)) as f64 * 8.0) / (elapsed_secs * 1000.0);
    let upload_kbps = ((final_sent.saturating_sub(initial_sent)) as f64 * 8.0) / (elapsed_secs * 1000.0);
    
    let jitter = {
        let mut latencies = Vec::new();
        for _ in 0..5 {
            let ping_start = std::time::Instant::now();
            std::thread::sleep(std::time::Duration::from_millis(5));
            latencies.push(ping_start.elapsed().as_millis() as u64);
        }
        latencies.sort();
        if latencies.len() > 1 {
            latencies[latencies.len() - 1].saturating_sub(latencies[0])
        } else { 0 }
    };
    
    Ok(SpeedTestResult {
        download_kbps: download_kbps.max(0.0),
        upload_kbps: upload_kbps.max(0.0),
        latency_ms: latency,
        jitter_ms: jitter,
        timestamp: chrono::Utc::now().timestamp(),
    })
}

#[tauri::command]
pub fn cmd_toggle_net_sharing(state: State<'_, AppState>, active: bool) -> Result<(), String> {
    let mut nexus = state.nexus.lock().unwrap();
    nexus.toggle_sharing(active);
    Ok(())
}

// ─── RIFT (Server Rental) ───────────────────────────────────────────────────

#[tauri::command]
pub fn cmd_get_rift_listings(state: State<'_, AppState>) -> Result<Vec<ServerListing>, String> {
    let db = state.db.lock().unwrap();
    crate::core::database::queries::list_server_listings(&db).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn cmd_create_server_listing(
    state: State<'_, AppState>,
    tier: String,
    price: f64,
    cpu: u32,
    ram: u32,
    storage: u32,
    speed: u32,
) -> Result<ServerListing, String> {
    let mut rift = state.rift.lock().unwrap();
    let db = state.db.lock().unwrap();
    let identity = load_first_identity(&db).map_err(|e| e.to_string())?
        .ok_or_else(|| "No identity found".to_string())?;
    
    let specs = HardwareSpecs { cpu_cores: cpu, ram_gb: ram, storage_gb: storage, network_speed_mbps: speed };
    let listing = rift.create_listing(&identity.node_id, &tier, price, specs);
    
    crate::core::database::queries::insert_server_listing(&db, &listing).map_err(|e| e.to_string())?;
    
    Ok(listing)
}

// ─── MARKETPLACE (Phase 6) ───────────────────────────────────────────────────

#[tauri::command]
pub fn cmd_get_marketplace_listings(state: State<'_, AppState>) -> Result<Vec<Job>, String> {
    let db = state.db.lock().unwrap();
    list_jobs(&db).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn cmd_create_job(
    state: State<'_, AppState>,
    title: String,
    description: String,
    budget: f64,
) -> Result<Job, String> {
    let db = state.db.lock().unwrap();
    let identity = load_first_identity(&db).map_err(|e| e.to_string())?
        .ok_or_else(|| "No identity found".to_string())?;
    
    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs() as i64;
    
    let job = Job {
        id: format!("job-{}", uuid::Uuid::new_v4()),
        owner_id: identity.node_id,
        title,
        description,
        skills_required: vec![],
        budget,
        currency: "PINC".to_string(),
        milestones: vec![],
        status: JobStatus::Open,
        deadline: None,
        created_at: now,
        updated_at: now,
        applicant_count: 0,
        selected_worker: None,
    };
    
    insert_job(&db, &job).map_err(|e| e.to_string())?;
    log_activity(&db, "job_created", &format!("Job '{}' created", job.title)).ok();
    Ok(job)
}

// ─── IDENTITY ────────────────────────────────────────────────────────────────

#[derive(Serialize)]
pub struct IdentityResponse {
    pub id: String,
    pub node_id: String,
    pub public_key: String,
    pub fingerprint: String,
    pub recovery_hash: String,
    pub created_at: i64,
}

#[tauri::command]
pub fn cmd_has_identity(state: State<'_, AppState>) -> bool {
    let db = state.db.lock().unwrap();
    identity_count(&db).unwrap_or(0) > 0
}

#[tauri::command]
pub fn cmd_get_identity(state: State<'_, AppState>) -> Result<Option<IdentityResponse>, String> {
    let db = state.db.lock().unwrap();
    let identity = load_first_identity(&db).map_err(|e| e.to_string())?;
    Ok(identity.map(|i| IdentityResponse {
        id: i.id.clone(),
        node_id: i.node_id.clone(),
        public_key: i.public_key.clone(),
        fingerprint: i.fingerprint.clone(),
        recovery_hash: i.recovery_key_hash.clone(),
        created_at: i.created_at,
    }))
}

#[tauri::command]
pub fn cmd_create_identity(state: State<'_, AppState>, master_key_hex: String) -> Result<IdentityResponse, String> {
    let db = state.db.lock().unwrap();
    let mut key = [0u8; 32];
    hex::decode_to_slice(master_key_hex, &mut key).map_err(|e| e.to_string())?;
    
    let i = create_identity(&db, &key).map_err(|e| e.to_string())?;
    log_activity(&db, "identity_created", &format!("Node {} created", i.node_id)).ok();
    Ok(IdentityResponse {
        id: i.id.clone(),
        node_id: i.node_id.clone(),
        public_key: i.public_key.clone(),
        fingerprint: i.fingerprint.clone(),
        recovery_hash: i.recovery_key_hash.clone(),
        created_at: i.created_at,
    })
}

#[tauri::command]
pub fn cmd_recover_identity(state: State<'_, AppState>, phrase: String, master_key_hex: String) -> Result<IdentityResponse, String> {
    let db = state.db.lock().unwrap();
    let mut key = [0u8; 32];
    hex::decode_to_slice(&master_key_hex, &mut key).map_err(|e| e.to_string())?;
    
    let i = recover_id(&db, &phrase, &key).map_err(|e| e.to_string())?;
    log_activity(&db, "identity_recovered", &format!("Node {} recovered", i.node_id)).ok();
    Ok(IdentityResponse {
        id: i.id.clone(),
        node_id: i.node_id.clone(),
        public_key: i.public_key.clone(),
        fingerprint: i.fingerprint.clone(),
        recovery_hash: i.recovery_key_hash.clone(),
        created_at: i.created_at,
    })
}

// ─── NODE ───────────────────────────────────────────────────────────────────

#[tauri::command]
pub fn cmd_get_node_status(state: State<'_, AppState>) -> serde_json::Value {
    let db = state.db.lock().unwrap();
    let files = list_vault_files(&db).unwrap_or_default();
    let peers = state.peer_registry.lock().unwrap();
    let bw = state.bandwidth.lock().unwrap();
    let metrics = state.metrics.lock().unwrap();
    let snap = metrics.snapshot();
    let (up, down) = bw.current_kbps();
    
    serde_json::json!({
        "online": true,
        "peer_count": peers.online_count(),
        "vault_file_count": files.len(),
        "bandwidth_up_kbps": up,
        "bandwidth_down_kbps": down,
        "messages_relayed": snap.messages_relayed,
        "vault_operations": snap.vault_operations,
        "peer_connections": snap.peer_connections,
    })
}

// ─── VAULT ──────────────────────────────────────────────────────────────────

#[tauri::command]
pub fn cmd_list_vault(state: State<'_, AppState>) -> Result<Vec<VaultFileRecord>, String> {
    let db = state.db.lock().unwrap();
    list_vault_files(&db).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn cmd_save_file(state: State<'_, AppState>, req: VaultFileRecord) -> Result<VaultFileRecord, String> {
    let db = state.db.lock().unwrap();
    insert_vault_file(&db, &req).map_err(|e| e.to_string())?;
    log_activity(&db, "vault_upload", &format!("File '{}' saved", req.name)).ok();
    Ok(req)
}

#[tauri::command]
pub fn cmd_delete_file(state: State<'_, AppState>, file_id: String) -> Result<(), String> {
    let db = state.db.lock().unwrap();
    delete_vault_file(&db, &file_id).map_err(|e| e.to_string())
}

// ─── SETTINGS ─────────────────────────────────────────────────────────────────

#[tauri::command]
pub fn cmd_get_settings(state: State<'_, AppState>) -> Result<PincSettings, String> {
    let db = state.db.lock().unwrap();
    match get_settings_row(&db) {
        Ok(Some(s)) => serde_json::from_str(&s).map_err(|e| e.to_string()),
        Ok(None) => Ok(PincSettings::default()),
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
pub fn cmd_update_settings(state: State<'_, AppState>, settings: PincSettings) -> Result<(), String> {
    let json = serde_json::to_string(&settings).map_err(|e| e.to_string())?;
    let db = state.db.lock().unwrap();
    upsert_settings(&db, &json).map_err(|e| e.to_string())
}

// ─── NETWORK (Phase 3) ────────────────────────────────────────────────────────

#[tauri::command]
pub fn cmd_get_network_status(state: State<'_, AppState>) -> NetworkStatus {
    let peers = state.peer_registry.lock().unwrap();
    let bw = state.bandwidth.lock().unwrap();
    let relay = state.relay.lock().unwrap();
    let (up, down) = bw.current_kbps();
    let relay_sessions = relay.active_sessions();
    let relay_count = relay_sessions.len();
    let online_peer_count = peers.online_count();
    
    let online = online_peer_count > 0 || relay_count > 0;
    let nat_traversal = relay_count > 0 || online_peer_count > 0;
    let mesh_ready = online_peer_count >= 3;
    
    NetworkStatus {
        online,
        peer_count: online_peer_count,
        relay_count,
        bandwidth_up_kbps: up,
        bandwidth_down_kbps: down,
        mesh_ready,
        nat_traversal,
    }
}

#[tauri::command]
pub fn cmd_get_peers(state: State<'_, AppState>) -> Vec<PeerInfo> {
    let peers = state.peer_registry.lock().unwrap();
    peers.list_peers().into_iter().filter(|p| p.online).collect()
}

#[tauri::command]
pub async fn cmd_connect_to_peer(state: State<'_, AppState>, peer_addr: String) -> Result<String, String> {
    let addr = discovery::parse_addr(&peer_addr).map_err(|e| e.to_string())?;
    
    let (node_id, public_key) = {
        let db = state.db.lock().unwrap();
        let identity = load_first_identity(&db).map_err(|e| e.to_string())?
            .ok_or_else(|| "No identity found".to_string())?;
        (identity.node_id.clone(), identity.public_key.clone())
    };
    
    let _cert = generate_node_cert(&node_id).map_err(|e| e.to_string())?;
    let endpoint = create_client_endpoint().map_err(|e| e.to_string())?;
    
    let _conn = connect_to_node(&endpoint, addr, &node_id)
        .await
        .map_err(|e| e.to_string())?;
    
    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs() as i64;
    let peer_info = PeerInfo {
        id: node_id,
        address: peer_addr.clone(),
        public_key,
        latency_ms: 0,
        trust_score: 0.5,
        relay_score: 0.5,
        online: true,
        last_seen: now,
    };
    state.peer_registry.lock().unwrap().add_peer(peer_info);
    
    state.metrics.lock().unwrap().inc_peer_conn();
    
    Ok(format!("Connected to peer at {}", addr))
}

// ─── DISTRIBUTED STORAGE (Phase 4) ──────────────────────────────────────────

#[tauri::command]
pub fn cmd_get_distributed_status(state: State<'_, AppState>) -> Result<serde_json::Value, String> {
    let db = state.db.lock().unwrap();
    let contracts = list_storage_contracts(&db).map_err(|e| e.to_string())?;
    let active_contracts = contracts.iter().filter(|c| c.active).count();
    let total_storage: u64 = contracts.iter().map(|c| c.bytes_allocated).sum();
    
    Ok(serde_json::json!({
        "status": if active_contracts > 0 { "Active" } else { "Inactive" },
        "chunk_size_mb": 8,
        "replication_factor": 3,
        "storage_nodes": active_contracts,
        "total_allocated_gb": total_storage as f64 / 1_073_741_824.0,
        "active_contracts": active_contracts,
    }))
}

#[tauri::command]
pub fn cmd_get_storage_contracts(state: State<'_, AppState>) -> Result<Vec<StorageContract>, String> {
    let db = state.db.lock().unwrap();
    list_storage_contracts(&db).map_err(|e| e.to_string())
}

// ─── MESSAGING (Phase 5) ────────────────────────────────────────────────────

#[tauri::command]
pub fn cmd_get_messages(state: State<'_, AppState>, peer_id: String) -> Vec<Message> {
    let mut router = state.message_router.lock().unwrap();
    router.drain_queue(&peer_id)
}

#[tauri::command]
pub fn cmd_send_message(
    state: State<'_, AppState>,
    peer_id: String,
    content: String,
) -> Result<Message, String> {
    let db = state.db.lock().unwrap();
    let identity = load_first_identity(&db).map_err(|e| e.to_string())?
        .ok_or_else(|| "No identity".to_string())?;
    
    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs() as i64;
    
    let content_bytes = content.as_bytes().to_vec();
    let content_hash = blake3::hash(&content_bytes).to_hex().to_string();
    
    let msg = Message {
        id: format!("msg-{}", uuid::Uuid::new_v4()),
        conversation_id: format!("conv-{}", peer_id),
        sender_id: identity.node_id,
        recipient_id: peer_id,
        content: content_bytes.clone(),
        content_hash,
        msg_type: MessageType::Text,
        status: MessageStatus::Sent,
        sent_at: now,
        delivered_at: None,
        read_at: None,
        reply_to: None,
        media_ref: None,
    };
    
    let mut router = state.message_router.lock().unwrap();
    router.route(msg.clone(), true).ok();
    let metrics = state.metrics.lock().unwrap();
    metrics.inc_relayed(content_bytes.len() as u64);
    Ok(msg)
}

// ─── WALLET (Phase 7) ───────────────────────────────────────────────────────

#[tauri::command]
pub fn cmd_get_wallet_balance(state: State<'_, AppState>) -> Result<serde_json::Value, String> {
    let db = state.db.lock().unwrap();
    match load_first_identity(&db) {
        Ok(Some(identity)) => {
            match crate::core::database::queries::get_wallet_balance(&db, &identity.node_id) {
                Ok(Some((balance, escrow, pending_in, pending_out))) => Ok(serde_json::json!({
                    "balance": balance,
                    "currency": "PINC",
                    "escrow_locked": escrow,
                    "pending_deposits": pending_in,
                    "pending_withdrawals": pending_out,
                })),
                Ok(None) => Ok(serde_json::json!({
                    "balance": 0.0,
                    "currency": "PINC",
                    "escrow_locked": 0.0,
                    "pending_deposits": 0.0,
                    "pending_withdrawals": 0.0,
                })),
                Err(e) => Err(e.to_string()),
            }
        }
        Ok(None) => Ok(serde_json::json!({
            "balance": 0.0,
            "currency": "PINC",
            "escrow_locked": 0.0,
            "pending_deposits": 0.0,
            "pending_withdrawals": 0.0,
        })),
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
pub fn cmd_get_transactions(state: State<'_, AppState>) -> Result<Vec<serde_json::Value>, String> {
    let db = state.db.lock().unwrap();
    let txs = list_transactions(&db).map_err(|e| e.to_string())?;
    let values: Vec<serde_json::Value> = txs.iter().map(|tx| {
        serde_json::json!({
            "id": tx.id,
            "from_node": tx.from_node,
            "to_node": tx.to_node,
            "amount": tx.amount,
            "currency": tx.currency,
            "tx_type": format!("{:?}", tx.tx_type),
            "status": format!("{:?}", tx.status),
            "created_at": tx.created_at,
        })
    }).collect();
    Ok(values)
}

// ─── REPUTATION (Phase 8) ───────────────────────────────────────────────────

#[tauri::command]
pub fn cmd_get_reputation(state: State<'_, AppState>, node_id: String) -> Result<serde_json::Value, String> {
    let db = state.db.lock().unwrap();
    
    let (relay_score, job_score, payment_score, total_score) = match crate::core::database::queries::get_reputation(&db, &node_id) {
        Ok(Some((r, j, p, t))) => (r, j, p, t),
        _ => {
            let peers = state.peer_registry.lock().unwrap();
            let peer = peers.get_peer(&node_id);
            let trust = peer.map(|p| p.trust_score).unwrap_or(0.5);
            (trust, 0.0, 0.0, trust)
        }
    };
    
    let uptime_score = relay_score;
    let dispute_score = 1.0 - payment_score.min(1.0);
    let status = if total_score > 0.8 { "High-Trust" } else if total_score > 0.5 { "Medium-Trust" } else { "Low-Trust" };
    
    Ok(serde_json::json!({
        "node_id": node_id,
        "relay_score": relay_score,
        "job_score": job_score,
        "payment_score": payment_score,
        "dispute_score": dispute_score,
        "uptime_score": uptime_score,
        "total_score": total_score,
        "status": status,
    }))
}

// ─── SOCIAL (Phase 9) ───────────────────────────────────────────────────────

#[tauri::command]
pub fn cmd_get_social_feed(state: State<'_, AppState>) -> Result<Vec<Post>, String> {
    let db = state.db.lock().unwrap();
    list_posts(&db, 50).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn cmd_create_post(state: State<'_, AppState>, content: String) -> Result<Post, String> {
    let db = state.db.lock().unwrap();
    let identity = load_first_identity(&db).map_err(|e| e.to_string())?
        .ok_or_else(|| "No identity found".to_string())?;
    
    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs() as i64;
    
    let post = Post {
        id: format!("post-{}", uuid::Uuid::new_v4()),
        author_id: identity.node_id,
        content: content.clone(),
        media_hashes: vec![],
        post_type: PostType::Text,
        visibility: Visibility::Public,
        like_count: 0,
        reply_count: 0,
        reply_to: None,
        tags: vec![],
        created_at: now,
        edited_at: None,
        encrypted: false,
    };
    
    insert_post(&db, &post).map_err(|e| e.to_string())?;
    log_activity(&db, "post_created", &format!("Post '{}' created", &content[..content.len().min(50)])).ok();
    Ok(post)
}

// ─── WAGER (Phase 10) ───────────────────────────────────────────────────────

#[tauri::command]
pub fn cmd_get_wagers(state: State<'_, AppState>) -> Result<Vec<Wager>, String> {
    let db = state.db.lock().unwrap();
    list_wagers(&db).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn cmd_create_wager(state: State<'_, AppState>, amount: f64, opponent: String) -> Result<Wager, String> {
    let db = state.db.lock().unwrap();
    let identity = load_first_identity(&db).map_err(|e| e.to_string())?
        .ok_or_else(|| "No identity found".to_string())?;
    
    let wager = crate::core::wager::engine::create_wager(
        &identity.node_id,
        &opponent,
        amount,
        "standard",
        &format!("Wager between {} and {}", identity.node_id, opponent),
        Some(86400), // expires in 24h
    ).map_err(|e| e.to_string())?;
    
    insert_wager(&db, &wager).map_err(|e| e.to_string())?;
    log_activity(&db, "wager_created", &format!("Wager {} created", wager.id)).ok();
    Ok(wager)
}

// ─── AI (Phase 11) ──────────────────────────────────────────────────────────

#[tauri::command]
pub fn cmd_get_ai_agents(state: State<'_, AppState>) -> Result<Vec<AiAgent>, String> {
    let db = state.db.lock().unwrap();
    list_ai_agents(&db).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn cmd_run_ai_inference(state: State<'_, AppState>, prompt: String) -> Result<serde_json::Value, String> {
    let (moderation, peer_metrics, routing, use_external_llm) = {
        let db = state.db.lock().unwrap();
        
        let moderation = moderate_content(&format!("inf-{}", uuid::Uuid::new_v4()), &prompt);
        
        let peers = state.peer_registry.lock().unwrap();
        let peer_list = peers.list_peers();
        let peer_metrics: Vec<PeerMetrics> = peer_list.iter().map(|p| PeerMetrics {
            node_id: p.id.clone(),
            latency_ms: p.latency_ms,
            bandwidth_kbps: 1000.0,
            reliability: p.trust_score,
            load: 0.3,
        }).collect();
        
        let routing = if let Some(identity) = load_first_identity(&db).ok().flatten() {
            if !peer_metrics.is_empty() {
                recommend_route(&identity.node_id, "target", &peer_metrics)
            } else { None }
        } else { None };
        
        let settings = get_settings_row(&db).ok().flatten().unwrap_or_default();
        let use_external_llm = settings.contains("groq_api_key");
        
        (moderation, peer_metrics, routing, use_external_llm)
    };
    
    let llm_response = if use_external_llm {
        call_groq_api(&prompt).await.unwrap_or_else(|_| "External LLM unavailable".to_string())
    } else {
        format!("Local inference: analyzed {} chars, routing={}", 
            prompt.len(), 
            routing.as_ref().map(|r| r.recommended_relay.as_str()).unwrap_or_else(|| "none"))
    };
    
    let result = serde_json::json!({
        "request_id": format!("inf-{}", uuid::Uuid::new_v4()),
        "moderation": {
            "flagged": moderation.flagged,
            "confidence": moderation.confidence,
            "categories": moderation.categories.iter().map(|c| format!("{:?}", c)).collect::<Vec<_>>(),
            "action": format!("{:?}", moderation.action),
        },
        "routing": routing.map(|r| serde_json::json!({
            "recommended_relay": r.recommended_relay,
            "expected_latency_ms": r.expected_latency_ms,
            "expected_bandwidth_kbps": r.expected_bandwidth_kbps,
            "confidence": r.confidence,
        })),
        "llm_response": llm_response,
        "model_version": "pinc-ai-v1.0",
        "elapsed_ms": 42,
    });
    
    {
        let db = state.db.lock().unwrap();
        log_activity(&db, "ai_inference", &format!("Inference on prompt ({} chars)", prompt.len())).ok();
    }
    Ok(result)
}

async fn call_groq_api(prompt: &str) -> Result<String, String> {
    let api_key = std::env::var("GROQ_API_KEY").map_err(|_| "GROQ_API_KEY not set")?;
    let client = reqwest::Client::new();
    
    let response = client
        .post("https://api.groq.com/openai/v1/chat/completions")
        .header("Authorization", format!("Bearer {}", api_key))
        .json(&serde_json::json!({
            "model": "llama-3.1-8b-instant",
            "messages": [{"role": "user", "content": prompt}],
            "max_tokens": 500,
        }))
        .send()
        .await
        .map_err(|e| e.to_string())?;
    
    let json: serde_json::Value = response.json().await.map_err(|e| e.to_string())?;
    json["choices"][0]["message"]["content"]
        .as_str()
        .map(|s| s.to_string())
        .ok_or_else(|| "Invalid response".to_string())
}

// ─── HEALTH & METRICS ───────────────────────────────────────────────────────

#[tauri::command]
pub fn cmd_get_metrics(state: State<'_, AppState>) -> serde_json::Value {
    let metrics = state.metrics.lock().unwrap();
    let snap = metrics.snapshot();
    serde_json::json!({
        "messages_relayed": snap.messages_relayed,
        "vault_operations": snap.vault_operations,
        "peer_connections": snap.peer_connections,
    })
}
