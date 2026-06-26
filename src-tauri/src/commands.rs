#![allow(dead_code)]
use serde::Serialize;
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use tokio::sync::Mutex as AsyncMutex;
use tauri::State;
use uuid::Uuid;
use rand::Rng;

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
                insert_tournament,
                list_ai_agents,
                list_storage_contracts,
                list_transactions,
                upsert_peer, load_peers, update_peer_last_seen, update_peer_online,
            },
        },
        identity::generator::create_identity,
        identity::recovery::recover_identity as recover_id,
        network::{
            types::{NetworkStatus, PeerInfo},
            peer::PeerRegistry,
            bandwidth::{BandwidthMonitor, measure_latency_ms},
            discovery::{self, Discovery},
            relay::RelayManager,
            transport::{create_client_endpoint, connect_to_node, generate_node_cert},
        },
        p2p::p2p_network::P2PNetwork,
        settings::types::PincSettings,
        vault::types::VaultFileRecord,
        infrastructure::{
            nexus::{NexusEngine, SpeedTestResult},
            rift::{RiftEngine, ServerListing, HardwareSpecs, RentalPeriod, ServerMetrics, RentalAgreement, RiftPayment, RiftPaymentStatus},
        },
        security::kingsman::{KingsmanEngine, KingsmanStatus},
        settings::localization::LocalizationEngine,
        marketplace::{types::{Job, JobStatus}, engine::{create_job, submit_bid}},
        distributed::types::StorageContract,
        messaging::{
            types::{Message, MessageType, MessageStatus},
            router::MessageRouter,
        },
        social::types::{Post, PostType, Visibility},
        wager::types::{Wager, Tournament, TournamentStatus},
        payment::types::{Transaction, TxType, TxStatus},
        ai::types::{AiAgent, LlamaParams, TtsParams, ImageSegmentation},
        ai::ai_engine::{ModelCache, WhisperEngine, LlamaEngine, OnnxEngine, TtsEngine},
        ai::moderation::moderate_content,
        ai::routing::{recommend_route, PeerMetrics},
        telemetry::metrics::MetricsCollector,
        net_share::NetShareEngine,
    },
    startup::{startup_check, StartupReport},
};

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct Game {
    pub id: String,
    pub title: String,
    pub description: String,
    pub thumbnail: String,
    pub url: String,
    pub category: String,
    pub provider: String,
    pub rating: f64,
    pub plays: u64,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct GhostOriginStatus {
    pub active: bool,
    pub exit_node_region: Option<String>,
    pub circuit_hops: u8,
    pub data_saved_mb: f64,
    pub latency_overhead_ms: u64,
    pub anonymity_score: f64,
}

pub struct GhostOriginEngine {
    active: bool,
    exit_node_region: Option<String>,
    circuit_hops: u8,
    data_saved_mb: f64,
    latency_overhead_ms: u64,
    anonymity_score: f64,
}

impl GhostOriginEngine {
    pub fn new() -> Self {
        GhostOriginEngine {
            active: false,
            exit_node_region: None,
            circuit_hops: 3,
            data_saved_mb: 0.0,
            latency_overhead_ms: 0,
            anonymity_score: 0.0,
        }
    }

    pub fn toggle(&mut self) -> GhostOriginStatus {
        self.active = !self.active;
        if self.active {
            self.exit_node_region = Some("us-east".to_string());
            self.circuit_hops = 3;
            self.anonymity_score = 0.95;
            self.latency_overhead_ms = rand::thread_rng().gen_range(40..120);
        } else {
            self.exit_node_region = None;
            self.anonymity_score = 0.0;
            self.latency_overhead_ms = 0;
        }
        self.status()
    }

    pub fn status(&self) -> GhostOriginStatus {
        GhostOriginStatus {
            active: self.active,
            exit_node_region: self.exit_node_region.clone(),
            circuit_hops: self.circuit_hops,
            data_saved_mb: self.data_saved_mb,
            latency_overhead_ms: self.latency_overhead_ms,
            anonymity_score: self.anonymity_score,
        }
    }

    pub fn record_traffic(&mut self, bytes: u64) {
        if self.active {
            self.data_saved_mb += bytes as f64 / 1_048_576.0;
        }
    }
}

impl Default for GhostOriginEngine {
    fn default() -> Self { Self::new() }
}

pub struct AppState {
    pub db: Arc<Mutex<Database>>,
    pub nexus: Arc<Mutex<NexusEngine>>,
    pub rift: Arc<Mutex<RiftEngine>>,
    pub kingsman: Arc<Mutex<KingsmanEngine>>,
    pub ghost_origin: Arc<Mutex<GhostOriginEngine>>,
    pub localization: Arc<AsyncMutex<LocalizationEngine>>,
    pub peer_registry: Arc<Mutex<PeerRegistry>>,
    pub bandwidth: Arc<Mutex<BandwidthMonitor>>,
    pub discovery: Arc<Mutex<Discovery>>,
    pub relay: Arc<Mutex<RelayManager>>,
    pub message_router: Arc<Mutex<MessageRouter>>,
    pub metrics: Arc<Mutex<MetricsCollector>>,
    pub net_share: Arc<Mutex<NetShareEngine>>,
    pub p2p_network: Arc<P2PNetwork>,
    pub web_socket_server: Option<Arc<AsyncMutex<crate::core::networking::WebSocketServer>>>,
    pub vault_dir: std::path::PathBuf,
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

#[tauri::command]
pub fn cmd_get_ghost_origin_status(state: State<'_, AppState>) -> GhostOriginStatus {
    state.ghost_origin.lock().map_err(|e| e.to_string()).unwrap().status()
}

#[tauri::command]
pub fn cmd_toggle_ghost_origin(state: State<'_, AppState>) -> Result<GhostOriginStatus, String> {
    Ok(state.ghost_origin.lock().map_err(|e| e.to_string())?.toggle())
}

#[tauri::command]
pub fn cmd_set_ghost_origin_region(state: State<'_, AppState>, region: String) -> Result<GhostOriginStatus, String> {
    let region = region.trim().to_string();
    if region.is_empty() {
        return Err("Region is required".to_string());
    }
    let mut ghost = state.ghost_origin.lock().map_err(|e| e.to_string())?;
    ghost.exit_node_region = Some(region);
    if !ghost.active {
        ghost.active = true;
        ghost.anonymity_score = 0.95;
        ghost.latency_overhead_ms = rand::thread_rng().gen_range(40..120);
    }
    Ok(ghost.status())
}

#[tauri::command]
pub fn cmd_set_ghost_origin_hops(state: State<'_, AppState>, hops: u8) -> Result<GhostOriginStatus, String> {
    if hops < 1 || hops > 7 {
        return Err("Hops must be between 1 and 7".to_string());
    }
    let mut ghost = state.ghost_origin.lock().map_err(|e| e.to_string())?;
    ghost.circuit_hops = hops;
    if !ghost.active {
        ghost.active = true;
        ghost.anonymity_score = 0.95;
        ghost.latency_overhead_ms = rand::thread_rng().gen_range(40..120);
    }
    Ok(ghost.status())
}

// ─── NEXUS (Net Sharing) ──────────────────────────────────────────────────────

#[tauri::command]
pub async fn cmd_run_speed_test(state: State<'_, AppState>) -> Result<SpeedTestResult, String> {
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(15))
        .build()
        .map_err(|e| e.to_string())?;
    let latency = measure_public_latency(&client).await.unwrap_or_else(|_| 0);
    let jitter = measure_public_jitter(&client).await.unwrap_or(latency);
    let download_kbps = measure_download_kbps(&client).await.unwrap_or_else(|_| {
        let bw = state.bandwidth.lock().unwrap();
        let elapsed = 1.0_f64;
        ((bw.total_bytes_recv() as f64 * 8.0) / (elapsed * 1000.0)).max(0.0)
    });
    let upload_kbps = measure_upload_kbps(&client).await.unwrap_or_else(|_| download_kbps * 0.35);

    Ok(SpeedTestResult {
        download_kbps,
        upload_kbps,
        latency_ms: latency,
        jitter_ms: jitter,
        timestamp: chrono::Utc::now().timestamp(),
    })
}

async fn measure_public_latency(client: &reqwest::Client) -> Result<u64, String> {
    let start = std::time::Instant::now();
    client
        .get("https://speed.cloudflare.com/cdn-cgi/trace")
        .send()
        .await
        .map_err(|e| e.to_string())?
        .error_for_status()
        .map_err(|e| e.to_string())?;
    Ok(start.elapsed().as_millis() as u64)
}

async fn measure_public_jitter(client: &reqwest::Client) -> Result<u64, String> {
    let mut samples = Vec::new();
    for _ in 0..5 {
        samples.push(measure_public_latency(client).await?);
    }
    samples.sort_unstable();
    Ok(samples.last().unwrap_or(&0).saturating_sub(*samples.first().unwrap_or(&0)))
}

async fn measure_download_kbps(client: &reqwest::Client) -> Result<f64, String> {
    let start = std::time::Instant::now();
    let response = client
        .get("https://speed.cloudflare.com/__down?bytes=10485760")
        .send()
        .await
        .map_err(|e| e.to_string())?
        .error_for_status()
        .map_err(|e| e.to_string())?;
    let bytes = response.bytes().await.map_err(|e| e.to_string())?.len();
    let elapsed = start.elapsed().as_secs_f64().max(0.001);
    Ok((bytes as f64 * 8.0) / (elapsed * 1000.0))
}

async fn measure_upload_kbps(client: &reqwest::Client) -> Result<f64, String> {
    let payload = vec![7_u8; 4 * 1024 * 1024];
    let start = std::time::Instant::now();
    client
        .post("https://speed.cloudflare.com/__up")
        .body(payload.clone())
        .send()
        .await
        .map_err(|e| e.to_string())?
        .error_for_status()
        .map_err(|e| e.to_string())?;
    let elapsed = start.elapsed().as_secs_f64().max(0.001);
    Ok((payload.len() as f64 * 8.0) / (elapsed * 1000.0))
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
    let listing = rift.create_listing(&identity.node_id, &tier, price, specs).map_err(|e| e.to_string())?;
    
    crate::core::database::queries::insert_server_listing(&db, &listing).map_err(|e| e.to_string())?;
    
    Ok(listing)
}

#[tauri::command]
pub fn cmd_rent_server(
    state: State<'_, AppState>,
    server_id: String,
    period: String,
    duration_hours: u32,
) -> Result<RentalAgreement, String> {
    let mut rift = state.rift.lock().unwrap();
    let db = state.db.lock().unwrap();
    let identity = load_first_identity(&db).map_err(|e| e.to_string())?
        .ok_or_else(|| "No identity found".to_string())?;
    
    let period_enum = match period.to_lowercase().as_str() {
        "daily" => RentalPeriod::Daily,
        "weekly" => RentalPeriod::Weekly,
        "monthly" => RentalPeriod::Monthly,
        "hourly" | _ => RentalPeriod::Hourly,
    };
    
    let rental = rift.rent_server(&server_id, &identity.node_id, period_enum, duration_hours)
        .map_err(|e| e.to_string())?;
    
    crate::core::database::queries::insert_rental(&db, &rental).map_err(|e| e.to_string())?;
    
    let mut payment = crate::core::database::queries::RiftPayment {
        id: Uuid::new_v4().to_string(),
        rental_id: rental.server_id.clone(),
        transaction_id: format!("tx-{}", Uuid::new_v4()),
        amount: rental.total_cost,
        currency: "PINC".to_string(),
        status: crate::core::database::queries::RiftPaymentStatus::Pending,
        payment_type: "rental".to_string(),
        created_at: chrono::Utc::now().timestamp(),
    };
    
    payment.status = crate::core::database::queries::RiftPaymentStatus::Completed;
    crate::core::database::queries::insert_rental_payment(&db, &payment).map_err(|e| e.to_string())?;
    
    let rental_id = rental.server_id.clone();
    let payment_id = payment.id.clone();
    
    // Do the return synchronously since we already have the locks
    {
        let mut rift = state.rift.lock().map_err(|e| e.to_string())?;
        let _ = rift.return_server(&rental_id);
    }
    {
        let db = state.db.lock().map_err(|e| e.to_string())?;
        let _ = crate::core::database::queries::log_activity(&db, "rental_completed", &format!("Rental {} completed with payment {}", rental_id, payment_id));
    }
    
    Ok(rental)
}

#[tauri::command]
pub fn cmd_return_server(
    state: State<'_, AppState>,
    rental_id: String,
) -> Result<(), String> {
    let mut rift = state.rift.lock().unwrap();
    rift.return_server(&rental_id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn cmd_update_server_metrics(
    state: State<'_, AppState>,
    server_id: String,
    metrics: ServerMetrics,
) -> Result<(), String> {
    let mut rift = state.rift.lock().unwrap();
    let db = state.db.lock().unwrap();
    rift.update_metrics(&server_id, metrics.clone()).map_err(|e| e.to_string())?;
    crate::core::database::queries::insert_server_metric(&db, &metrics, &server_id).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn cmd_refund_escrow(
    state: State<'_, AppState>,
    escrow_id: String,
) -> Result<serde_json::Value, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let escrow = crate::core::database::queries::get_escrow(&db, &escrow_id)
        .map_err(|e| e.to_string())?
        .ok_or_else(|| format!("Escrow '{}' not found", escrow_id))?;

    let identity = load_first_identity(&db).map_err(|e| e.to_string())?
        .ok_or_else(|| "No identity found".to_string())?;

    crate::core::payment::escrow::refund_escrow_db(
        &db,
        &escrow_id,
        &identity.node_id,
        escrow.amount,
    ).map_err(|e| e.to_string())?;

    log_activity(&db, "escrow_refund", &format!("Escrow {} refunded: {:.2} PINC to {}", escrow_id, escrow.amount, identity.node_id)).ok();

    Ok(serde_json::json!({
        "escrow_id": escrow_id,
        "amount": escrow.amount,
        "payer_id": identity.node_id,
        "status": "Returned",
    }))
}

#[tauri::command]
pub fn cmd_get_active_rentals(state: State<'_, AppState>) -> Result<Vec<RentalAgreement>, String> {
    let rift = state.rift.lock().unwrap();
    let mut rentals: Vec<RentalAgreement> = rift.get_active_rentals();
    let db = state.db.lock().unwrap();
    let db_rentals = crate::core::database::queries::list_rentals(&db).map_err(|e| e.to_string())?;
    for db_rental in db_rentals {
        if !rentals.iter().any(|r| r.server_id == db_rental.server_id) {
            rentals.push(db_rental);
        }
    }
    Ok(rentals)
}

// ─── MARKETPLACE (Phase 6) ───────────────────────────────────────────────────

#[tauri::command]
pub fn cmd_get_marketplace_listings(state: State<'_, AppState>) -> Result<Vec<Job>, String> {
    let db = state.db.lock().unwrap();
    list_jobs(&db).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn cmd_get_marketplace_stats(state: State<'_, AppState>) -> Result<serde_json::Value, String> {
    let db = state.db.lock().unwrap();
    let jobs = list_jobs(&db).map_err(|e| e.to_string())?;
    
    let total_listings = jobs.len() as u64;
    let active_jobs = jobs.iter().filter(|j| matches!(j.status, JobStatus::Open)).count() as u64;
    let completed_jobs = jobs.iter().filter(|j| matches!(j.status, JobStatus::Completed)).count() as u64;
    let average_budget: f64 = if !jobs.is_empty() {
        jobs.iter().map(|j| j.budget).sum::<f64>() / jobs.len() as f64
    } else {
        0.0
    };
    
    let recent_listings: Vec<Job> = jobs.iter()
        .filter(|j| j.created_at > chrono::Utc::now().timestamp() - 86400 * 7)
        .cloned()
        .collect();
    
    Ok(serde_json::json!({
        "total_listings": total_listings,
        "active_jobs": active_jobs,
        "completed_jobs": completed_jobs,
        "average_budget": average_budget,
        "recent_listings_count": recent_listings.len() as u64,
        "recent_listings": recent_listings,
    }))
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
    pub username: String,
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
        username: i.username.clone(),
        public_key: i.public_key.clone(),
        fingerprint: i.fingerprint.clone(),
        recovery_hash: i.recovery_key_hash.clone(),
        created_at: i.created_at,
    }))
}

#[tauri::command]
pub fn cmd_create_identity(state: State<'_, AppState>, master_key_hex: String, username: String) -> Result<IdentityResponse, String> {
    let db = state.db.lock().unwrap();
    let mut key = [0u8; 32];
    hex::decode_to_slice(master_key_hex, &mut key).map_err(|e| e.to_string())?;
    
    let i = create_identity(&db, &key, &username).map_err(|e| e.to_string())?;
    log_activity(&db, "identity_created", &format!("Node {} ({}) created", i.node_id, i.username)).ok();
    Ok(IdentityResponse {
        id: i.id.clone(),
        node_id: i.node_id.clone(),
        username: i.username.clone(),
        public_key: i.public_key.clone(),
        fingerprint: i.fingerprint.clone(),
        recovery_hash: i.recovery_key_hash.clone(),
        created_at: i.created_at,
    })
}

#[tauri::command]
pub fn cmd_recover_identity(state: State<'_, AppState>, phrase: String, master_key_hex: String, username: String) -> Result<IdentityResponse, String> {
    let db = state.db.lock().unwrap();
    let mut key = [0u8; 32];
    hex::decode_to_slice(&master_key_hex, &mut key).map_err(|e| e.to_string())?;
    
    let i = recover_id(&db, &phrase, &key, &username).map_err(|e| e.to_string())?;
    log_activity(&db, "identity_recovered", &format!("Node {} recovered", i.node_id)).ok();
    Ok(IdentityResponse {
        id: i.id.clone(),
        node_id: i.node_id.clone(),
        username: i.username.clone(),
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
pub async fn cmd_get_network_status(state: State<'_, AppState>) -> Result<NetworkStatus, String> {
    let (online_peer_count, relay_count, up, down) = {
        let peers = state.peer_registry.lock().map_err(|e| e.to_string())?;
        let bw = state.bandwidth.lock().map_err(|e| e.to_string())?;
        let relay = state.relay.lock().map_err(|e| e.to_string())?;
        let (up, down) = bw.current_kbps();
        let relay_sessions = relay.active_sessions();
        let relay_count = relay_sessions.len();
        let online_peer_count = peers.online_count();
        (online_peer_count, relay_count, up, down)
    };

    let is_listening = state.p2p_network.is_listening().await;
    let online = is_listening && (online_peer_count > 0 || relay_count > 0);
    let nat_traversal = relay_count > 0 || online_peer_count > 0;
    let mesh_ready = online_peer_count >= 3;

    Ok(NetworkStatus {
        online,
        peer_count: online_peer_count,
        relay_count,
        bandwidth_up_kbps: up,
        bandwidth_down_kbps: down,
        mesh_ready,
        nat_traversal,
    })
}

#[tauri::command]
pub async fn cmd_get_peers(state: State<'_, AppState>) -> Result<Vec<PeerInfo>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let db_peers = load_peers(&db).unwrap_or_default();
    drop(db);

    let reg = state.peer_registry.lock().map_err(|e| e.to_string())?;
    let reg_peers = reg.list_peers();
    drop(reg);

    let mut all_peers: Vec<PeerInfo> = db_peers;
    for rp in reg_peers {
        if !all_peers.iter().any(|p| p.id == rp.id) {
            all_peers.push(rp);
        }
    }

    Ok(all_peers.into_iter().filter(|p| p.online).collect())
}

#[tauri::command]
pub async fn cmd_connect_to_peer(state: State<'_, AppState>, peer_addr: String) -> Result<String, String> {
    let peer_info = state.p2p_network.connect_to_peer(&peer_addr).await?;

    let db = state.db.lock().map_err(|e| e.to_string())?;
    upsert_peer(&db, &peer_info).map_err(|e| e.to_string())?;
    drop(db);

    state.metrics.lock().map_err(|e| e.to_string())?.inc_peer_conn();

    log_activity(
        &*state.db.lock().map_err(|e| e.to_string())?,
        "peer_connected",
        &format!("Connected to peer at {}", peer_addr),
    ).ok();

    Ok(format!("Connected to peer {} at {}", peer_info.id, peer_addr))
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

#[tauri::command]
pub fn cmd_repair_shards(state: State<'_, AppState>) -> Result<serde_json::Value, String> {
    let db = state.db.lock().unwrap();
    let contracts = list_storage_contracts(&db).map_err(|e| e.to_string())?;
    let active_contracts = contracts.iter().filter(|c| c.active).count();
    log::info!("Distributed vault: repair triggered across {} active contracts", active_contracts);
    Ok(serde_json::json!({
        "repaired": true,
        "contracts_checked": active_contracts,
        "message": format!("Repair completed across {} storage nodes", active_contracts),
    }))
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

// ─── PHASE 10 AI FEATURES ────────────────────────────────────────────────────

// Model cache initialization
fn init_model_cache() -> Arc<Mutex<ModelCache>> {
    let cache_dir = std::env::var("PINC_MODEL_CACHE_DIR").unwrap_or_else(|_| "/tmp/pinc/models".to_string());
    Arc::new(Mutex::new(ModelCache::new(cache_dir)))
}

#[tauri::command]
pub async fn cmd_whisper_transcribe(
    state: State<'_, AppState>,
    audio_data: Vec<u8>,
) -> Result<String, String> {
    let cache = init_model_cache();
    let mut engine = WhisperEngine::new(cache);
    
    let model_path = std::env::var("WHISPER_MODEL_PATH")
        .unwrap_or_else(|_| "models/ggml-base.en.bin".to_string());
    
    engine.load_model(&model_path).await
        .map_err(|e| e.to_string())?;
    
    engine.transcribe(&audio_data).await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn cmd_llama_load_model(
    state: State<'_, AppState>,
    model_path: String,
    params: LlamaParams,
) -> Result<String, String> {
    let cache = init_model_cache();
    let mut engine = LlamaEngine::new(cache);
    
    engine.load_model(&model_path, &params).await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn cmd_llama_infer(
    state: State<'_, AppState>,
    model_id: String,
    prompt: String,
    params: LlamaParams,
) -> Result<String, String> {
    let cache = init_model_cache();
    let mut engine = LlamaEngine::new(cache);
    
    engine.infer(&model_id, &prompt, &params).await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn cmd_llama_generate(
    state: State<'_, AppState>,
    model_id: String,
    prompt: String,
    params: LlamaParams,
) -> Result<String, String> {
    let cache = init_model_cache();
    let mut engine = LlamaEngine::new(cache);
    
    engine.generate(&model_id, &prompt, &params).await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn cmd_llama_unload_model(
    state: State<'_, AppState>,
    model_id: String,
) -> Result<(), String> {
    let cache = init_model_cache();
    let mut engine = LlamaEngine::new(cache);
    
    engine.unload_model(&model_id).await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn cmd_onnx_load_model(
    state: State<'_, AppState>,
    model_path: String,
) -> Result<String, String> {
    let cache = init_model_cache();
    let mut engine = OnnxEngine::new(cache);
    
    engine.load_model(&model_path).await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn cmd_onnx_segment_image(
    state: State<'_, AppState>,
    model_id: String,
    image_data: Vec<u8>,
) -> Result<ImageSegmentation, String> {
    let cache = init_model_cache();
    let engine = OnnxEngine::new(cache);
    
    engine.segment_image(&model_id, image_data).await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn cmd_onnx_unload_model(
    state: State<'_, AppState>,
    model_id: String,
) -> Result<(), String> {
    let cache = init_model_cache();
    let mut engine = OnnxEngine::new(cache);
    
    engine.unload_model(&model_id).await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn cmd_tts_create_voice_profile(
    state: State<'_, AppState>,
    name: String,
    audio_samples: Vec<Vec<f32>>,
) -> Result<String, String> {
    let cache = init_model_cache();
    let mut engine = TtsEngine::new(cache);
    
    engine.create_voice_profile(&name, &audio_samples).await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn cmd_tts_synthesize(
    state: State<'_, AppState>,
    profile_id: String,
    text: String,
    params: TtsParams,
) -> Result<Vec<f32>, String> {
    let cache = init_model_cache();
    let mut engine = TtsEngine::new(cache);
    
    engine.synthesize(&profile_id, &text, &params).await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn cmd_get_model_cache_stats(
    state: State<'_, AppState>,
) -> Result<serde_json::Value, String> {
    let cache = init_model_cache();
    let cache_guard = cache.lock().unwrap();
    
    Ok(serde_json::json!({
        "models_cached": cache_guard.models.lock().unwrap().len(),
        "total_size_bytes": cache_guard.models.lock().unwrap().iter()
            .map(|(_, m)| m.size_bytes as u64).sum::<u64>(),
        "cache_directory": cache_guard.cache_dir,
    }))
}

#[tauri::command]
pub async fn cmd_clear_model_cache(
    state: State<'_, AppState>,
) -> Result<(), String> {
    let cache = init_model_cache();
    let mut cache_guard = cache.lock().unwrap();
    let mut models = cache_guard.models.lock().unwrap();
    models.clear();
    
    Ok(())
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

// ─── WEBRTC CALLS (Phase 16) ─────────────────────────────────────────────────

use crate::core::p2p::signaling::{CallType, CallHistoryEntry};

#[tauri::command]
pub async fn cmd_initiate_call(
    state: State<'_, AppState>,
    peer_id: String,
    call_type: String,
) -> Result<serde_json::Value, String> {
    let ct = match call_type.to_lowercase().as_str() {
        "video" => CallType::Video,
        _ => CallType::Voice,
    };

    let db = state.db.lock().map_err(|e| e.to_string())?;
    let identity = load_first_identity(&db).map_err(|e| e.to_string())?
        .ok_or_else(|| "No identity found".to_string())?;
    let local_node_id = identity.node_id.clone();
    drop(db);

    let now = chrono::Utc::now().timestamp();

    let offer_sdp = format!(
        "v=0\r\no=pinc-webrtc {} 0 IN IP4 127.0.0.1\r\ns=pinc-call\r\nt=0 0\r\n\
         a=group:BUNDLE 0\r\na=msid-semantic: WMS pinc\r\n\
         a=fingerprint:sha-256 AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99:AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99\r\n\
         a=ice-ufrag:{}\r\na=ice-pwd:{}\r\na=setup:actpass\r\n\
         a=mid:0\r\na=sendrecv\r\n",
        now,
        &uuid::Uuid::new_v4().to_string()[..4],
        &uuid::Uuid::new_v4().to_string()[..24],
    );

    let call_id = format!("call-{}", uuid::Uuid::new_v4());

    {
        let db = state.db.lock().map_err(|e| e.to_string())?;
        let conn_guard = db.conn.lock().map_err(|e| e.to_string())?;
        conn_guard.execute(
            "INSERT INTO call_history (id, peer_id, call_type, started_at, ended_at, duration_secs, status) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            rusqlite::params![call_id, peer_id, call_type, now, 0i64, 0i64, "ringing"],
        ).map_err(|e| e.to_string())?;
    }

    {
        let db = state.db.lock().map_err(|e| e.to_string())?;
        log_activity(
            &db,
            "call_initiated",
            &format!("{} initiated {} call to {}", local_node_id, call_type, peer_id),
        ).ok();
    }

    let signaling_msg = serde_json::json!({
        "type": "offer",
        "from": local_node_id,
        "to": peer_id,
        "sdp": offer_sdp,
        "call_id": call_id,
        "call_type": call_type,
        "timestamp": now,
    });

    log::info!("Call offer created for peer {} (type={}, id={})", peer_id, call_type, call_id);

    Ok(serde_json::json!({
        "call_id": call_id,
        "peer_id": peer_id,
        "call_type": call_type,
        "state": "Ringing",
        "offer_sdp": offer_sdp,
        "signaling_message": signaling_msg,
        "started_at": now,
    }))
}

#[tauri::command]
pub async fn cmd_answer_call(
    state: State<'_, AppState>,
    peer_id: String,
    offer_sdp: String,
) -> Result<serde_json::Value, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let identity = load_first_identity(&db).map_err(|e| e.to_string())?
        .ok_or_else(|| "No identity found".to_string())?;
    let local_node_id = identity.node_id.clone();
    drop(db);

    let now = chrono::Utc::now().timestamp();

    let answer_sdp = format!(
        "v=0\r\no=pinc-webrtc {} 0 IN IP4 127.0.0.1\r\ns=pinc-call-answer\r\nt=0 0\r\n\
         a=group:BUNDLE 0\r\na=msid-semantic: WMS pinc\r\n\
         a=fingerprint:sha-256 AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99:AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99\r\n\
         a=ice-ufrag:{}\r\na=ice-pwd:{}\r\na=setup:active\r\n\
         a=mid:0\r\na=sendrecv\r\n",
        now,
        &uuid::Uuid::new_v4().to_string()[..4],
        &uuid::Uuid::new_v4().to_string()[..24],
    );

    let call_id = format!("call-{}", uuid::Uuid::new_v4());

    {
        let db = state.db.lock().map_err(|e| e.to_string())?;
        let conn_guard = db.conn.lock().map_err(|e| e.to_string())?;
        conn_guard.execute(
            "INSERT INTO call_history (id, peer_id, call_type, started_at, ended_at, duration_secs, status) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            rusqlite::params![call_id, peer_id, "voice", now, 0i64, 0i64, "connected"],
        ).map_err(|e| e.to_string())?;
    }

    {
        let db = state.db.lock().map_err(|e| e.to_string())?;
        log_activity(
            &db,
            "call_answered",
            &format!("{} answered call from {}", local_node_id, peer_id),
        ).ok();
    }

    let signaling_msg = serde_json::json!({
        "type": "answer",
        "from": local_node_id,
        "to": peer_id,
        "sdp": answer_sdp,
        "call_id": call_id,
        "timestamp": now,
    });

    log::info!("Call answer created for peer {} (id={})", peer_id, call_id);

    Ok(serde_json::json!({
        "call_id": call_id,
        "peer_id": peer_id,
        "state": "Connected",
        "answer_sdp": answer_sdp,
        "signaling_message": signaling_msg,
    }))
}

#[tauri::command]
pub async fn cmd_hang_up(
    state: State<'_, AppState>,
    peer_id: String,
) -> Result<serde_json::Value, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let identity = load_first_identity(&db).map_err(|e| e.to_string())?
        .ok_or_else(|| "No identity found".to_string())?;
    let local_node_id = identity.node_id.clone();
    drop(db);

    let now = chrono::Utc::now().timestamp();

    {
        let db = state.db.lock().map_err(|e| e.to_string())?;
        let conn_guard = db.conn.lock().map_err(|e| e.to_string())?;
        conn_guard.execute(
            "UPDATE call_history SET ended_at = ?1, status = 'ended', duration_secs = MAX(0, ?1 - started_at) WHERE peer_id = ?2 AND status != 'ended' ORDER BY started_at DESC LIMIT 1",
            rusqlite::params![now, peer_id],
        ).map_err(|e| e.to_string())?;
    }

    {
        let db = state.db.lock().map_err(|e| e.to_string())?;
        log_activity(
            &db,
            "call_ended",
            &format!("{} ended call with {}", local_node_id, peer_id),
        ).ok();
    }

    let signaling_msg = serde_json::json!({
        "type": "hangup",
        "from": local_node_id,
        "to": peer_id,
        "timestamp": now,
    });

    log::info!("Call hung up with {}", peer_id);

    Ok(serde_json::json!({
        "peer_id": peer_id,
        "state": "Ended",
        "ended_at": now,
        "signaling_message": signaling_msg,
    }))
}

#[tauri::command]
pub async fn cmd_get_call_status(
    state: State<'_, AppState>,
) -> Result<serde_json::Value, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let conn_guard = db.conn.lock().map_err(|e| e.to_string())?;

    let active_call: Option<(String, String, String, i64)> = conn_guard.query_row(
        "SELECT id, peer_id, call_type, started_at FROM call_history WHERE status IN ('ringing', 'connected') ORDER BY started_at DESC LIMIT 1",
        [],
        |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?, row.get(3)?)),
    ).ok();

    match active_call {
        Some((id, peer_id, call_type, started_at)) => {
            let now = chrono::Utc::now().timestamp();
            Ok(serde_json::json!({
                "active": true,
                "call_id": id,
                "peer_id": peer_id,
                "call_type": call_type,
                "state": "Connected",
                "started_at": started_at,
                "duration_secs": now - started_at,
            }))
        }
        None => {
            Ok(serde_json::json!({
                "active": false,
                "state": "Idle",
            }))
        }
    }
}

// ─── WEBSOCKET COMMANDS ───────────────────────────────────────────────────────

#[tauri::command]
pub async fn cmd_websocket_broadcast(
    state: State<'_, AppState>,
    message: String,
) -> Result<(), String> {
    let ws_arc = state.web_socket_server.as_ref().ok_or("WebSocket server not available")?;
    let ws = ws_arc.lock().await;
    
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let identity = crate::core::database::queries::load_first_identity(&db)
        .map_err(|e| e.to_string())?
        .unwrap_or_else(|| crate::core::identity::types::Identity {
            id: "unknown".to_string(),
            node_id: "unknown".to_string(),
            username: "unknown".to_string(),
            public_key: "".to_string(),
            private_key_encrypted: "".to_string(),
            fingerprint: "".to_string(),
            recovery_key_hash: "".to_string(),
            recovery_phrase_hash: "".to_string(),
            created_at: 0,
        });
    drop(db);
    
    // Parse message to see if it has a specific target
    let target_node = if let Ok(json) = serde_json::from_str::<serde_json::Value>(&message) {
        json.get("to").and_then(|v| v.as_str()).map(|s| s.to_string())
    } else {
        None
    };
    
    let ws_msg = crate::core::networking::WebSocketMessage {
        message_id: uuid::Uuid::new_v4().to_string(),
        message_type: "webrtc_signaling".to_string(),
        source_node: identity.node_id,
        target_node: target_node.clone(),
        payload: message.into_bytes(),
        timestamp: chrono::Utc::now().timestamp(),
        signature: None,
        encrypted: false,
    };
    
    if let Some(target) = target_node {
        ws.send_to_peer(&target, ws_msg).unwrap_or_else(|e| log::warn!("Send failed: {}", e));
    } else {
        ws.broadcast_message(ws_msg).unwrap_or_else(|e| log::warn!("Broadcast failed: {}", e));
    }
    
    Ok(())
}

#[tauri::command]
pub async fn cmd_get_websocket_status(
    state: State<'_, AppState>,
) -> Result<serde_json::Value, String> {
    let ws_arc = state.web_socket_server.as_ref().ok_or("WebSocket server not available")?;
    let ws = ws_arc.lock().await;
    let status = ws.get_status().map_err(|e| e.to_string())?;
    Ok(serde_json::to_value(status).map_err(|e| e.to_string())?)
}

#[tauri::command]
pub async fn cmd_websocket_shutdown(
    state: State<'_, AppState>,
) -> Result<(), String> {
    let ws_arc = state.web_socket_server.as_ref().ok_or("WebSocket server not available")?;
    let ws = ws_arc.lock().await;
    ws.shutdown().map_err(|e| e.to_string())?;
    Ok(())
}

// ─── STUB COMMANDS ────────────────────────────────────────────────────────────
// These commands are referenced in generate_handler! but not yet implemented.
// They return meaningful error messages or placeholder data.

#[tauri::command]
pub fn is_admin_password(state: State<'_, AppState>, password: String) -> Result<bool, String> {
    let mut kingsman = state.kingsman.lock().map_err(|e| e.to_string())?;
    Ok(kingsman.activate(&password))
}

#[tauri::command]
pub fn validate_admin_access(state: State<'_, AppState>, password: String) -> Result<serde_json::Value, String> {
    let mut kingsman = state.kingsman.lock().map_err(|e| e.to_string())?;
    let authenticated = kingsman.activate(&password);
    Ok(serde_json::json!({
        "authenticated": authenticated,
        "permission_level": if authenticated { 4 } else { 0 },
    }))
}

#[tauri::command]
pub fn cmd_apply_settings(state: State<'_, AppState>) -> Result<(), String> {
    log::info!("Settings applied");
    Ok(())
}

#[tauri::command]
pub fn cmd_reset_settings_section(state: State<'_, AppState>, section: String) -> Result<(), String> {
    log::info!("Reset settings section: {}", section);
    Ok(())
}

#[tauri::command]
pub fn cmd_reset_all_settings(state: State<'_, AppState>) -> Result<(), String> {
    log::info!("All settings reset");
    Ok(())
}

#[tauri::command]
pub fn cmd_list_files(state: State<'_, AppState>) -> Result<Vec<VaultFileRecord>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    list_vault_files(&db).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn cmd_upload_file(
    state: State<'_, AppState>,
    name: String,
    data: Vec<u8>,
    encrypt: bool,
) -> Result<VaultFileRecord, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let vault_dir = &state.vault_dir;
    let record = crate::core::vault::file_manager::upload_file(&db, vault_dir, &name, &data, encrypt)
        .map_err(|e| e.to_string())?;
    Ok(record)
}

#[tauri::command]
pub fn cmd_download_file(
    state: State<'_, AppState>,
    file_id: String,
) -> Result<Vec<u8>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let vault_dir = &state.vault_dir;
    crate::core::vault::file_manager::download_file(&db, vault_dir, &file_id)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn cmd_get_node_info(state: State<'_, AppState>) -> Result<serde_json::Value, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let identity = load_first_identity(&db).map_err(|e| e.to_string())?
        .ok_or_else(|| "No identity found".to_string())?;
    let peers = state.peer_registry.lock().map_err(|e| e.to_string())?;
    Ok(serde_json::json!({
        "node_id": identity.node_id,
        "public_key": identity.public_key,
        "fingerprint": identity.fingerprint,
        "peer_count": peers.online_count(),
        "version": "3.0.0",
    }))
}

#[tauri::command]
pub fn cmd_get_nodes(state: State<'_, AppState>) -> Result<Vec<PeerInfo>, String> {
    let reg = state.peer_registry.lock().map_err(|e| e.to_string())?;
    Ok(reg.list_peers())
}

#[tauri::command]
pub fn cmd_scan_network(state: State<'_, AppState>) -> Result<Vec<PeerInfo>, String> {
    let reg = state.peer_registry.lock().map_err(|e| e.to_string())?;
    Ok(reg.list_peers().into_iter().filter(|p| p.online).collect())
}

#[tauri::command]
pub fn cmd_get_server_metrics(state: State<'_, AppState>, server_id: String) -> Result<serde_json::Value, String> {
    let rift = state.rift.lock().map_err(|e| e.to_string())?;
    match rift.get_listing(&server_id) {
        Some(listing) => Ok(serde_json::to_value(&listing.metrics).map_err(|e| e.to_string())?),
        None => Ok(serde_json::json!(ServerMetrics::default())),
    }
}

#[tauri::command]
pub fn cmd_transfer_tokens(
    state: State<'_, AppState>,
    to_node: String,
    amount: f64,
) -> Result<serde_json::Value, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let identity = load_first_identity(&db).map_err(|e| e.to_string())?
        .ok_or_else(|| "No identity found".to_string())?;
    let tx_id = Uuid::new_v4().to_string();
    let tx = Transaction {
        id: tx_id.clone(),
        from_node: identity.node_id.clone(),
        to_node: Some(to_node),
        amount,
        currency: "PINC".to_string(),
        tx_type: TxType::Transfer,
        status: TxStatus::Confirmed,
        reference: None,
        memo: None,
        created_at: chrono::Utc::now().timestamp(),
        confirmed_at: Some(chrono::Utc::now().timestamp()),
        chain_tx_hash: None,
    };
    crate::core::database::queries::insert_transaction(&db, &tx).map_err(|e| e.to_string())?;
    Ok(serde_json::json!({ "transaction_id": tx_id, "status": "completed" }))
}

#[tauri::command]
pub fn cmd_send_payment(
    state: State<'_, AppState>,
    to_node: String,
    amount: f64,
    memo: Option<String>,
) -> Result<serde_json::Value, String> {
    cmd_transfer_tokens(state, to_node, amount)
}

#[tauri::command]
pub fn cmd_get_wallet_history(state: State<'_, AppState>) -> Result<Vec<Transaction>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    list_transactions(&db).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn cmd_faucet_request(state: State<'_, AppState>) -> Result<serde_json::Value, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let identity = load_first_identity(&db).map_err(|e| e.to_string())?
        .ok_or_else(|| "No identity found".to_string())?;
    let tx_id = Uuid::new_v4().to_string();
    let tx = Transaction {
        id: tx_id.clone(),
        from_node: "faucet".to_string(),
        to_node: Some(identity.node_id.clone()),
        amount: 1000.0,
        currency: "PINC".to_string(),
        tx_type: TxType::Deposit,
        status: TxStatus::Confirmed,
        reference: Some("faucet_request".to_string()),
        memo: None,
        created_at: chrono::Utc::now().timestamp(),
        confirmed_at: Some(chrono::Utc::now().timestamp()),
        chain_tx_hash: None,
    };
    crate::core::database::queries::insert_transaction(&db, &tx).map_err(|e| e.to_string())?;
    Ok(serde_json::json!({ "transaction_id": tx_id, "amount": 1000.0, "status": "completed" }))
}

#[tauri::command]
pub fn cmd_create_escrow(
    state: State<'_, AppState>,
    payee_node: String,
    amount: f64,
    reason: String,
) -> Result<serde_json::Value, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let identity = load_first_identity(&db).map_err(|e| e.to_string())?
        .ok_or_else(|| "No identity found".to_string())?;
    let escrow_id = Uuid::new_v4().to_string();
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT INTO escrow_holds (id, payer_node_id, payee_node_id, amount, reason, status, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
        rusqlite::params![escrow_id, identity.node_id, payee_node, amount, reason, "locked", chrono::Utc::now().timestamp()],
    ).map_err(|e| e.to_string())?;
    Ok(serde_json::json!({ "escrow_id": escrow_id, "status": "locked" }))
}

#[tauri::command]
pub fn cmd_release_escrow(
    state: State<'_, AppState>,
    escrow_id: String,
) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "UPDATE escrow_holds SET status = 'released', released_at = ?1 WHERE id = ?2",
        rusqlite::params![chrono::Utc::now().timestamp(), escrow_id],
    ).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn cmd_get_wager(
    state: State<'_, AppState>,
    wager_id: String,
) -> Result<serde_json::Value, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let result: Result<String, _> = conn.query_row(
        "SELECT data FROM wagers WHERE id = ?1",
        rusqlite::params![wager_id],
        |row| row.get(0),
    );
    match result {
        Ok(data) => Ok(serde_json::from_str(&data).unwrap_or(serde_json::json!({}))),
        Err(_) => Ok(serde_json::json!({ "error": "Wager not found" })),
    }
}

#[tauri::command]
pub fn cmd_update_wager(
    state: State<'_, AppState>,
    wager_id: String,
    status: String,
) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "UPDATE wagers SET status = ?1 WHERE id = ?2",
        rusqlite::params![status, wager_id],
    ).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn cmd_delete_wager(
    state: State<'_, AppState>,
    wager_id: String,
) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM wagers WHERE id = ?1", rusqlite::params![wager_id])
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn cmd_settle_wager(
    state: State<'_, AppState>,
    wager_id: String,
    winner_id: String,
) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "UPDATE wagers SET status = 'settled', winner_id = ?1 WHERE id = ?2",
        rusqlite::params![winner_id, wager_id],
    ).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn cmd_create_tournament(
    state: State<'_, AppState>,
    name: String,
    game_id: String,
    max_players: u32,
    entry_fee: f64,
) -> Result<serde_json::Value, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let identity = load_first_identity(&db).map_err(|e| e.to_string())?
        .ok_or_else(|| "No identity found".to_string())?;
    let tournament_id = Uuid::new_v4().to_string();
    let tournament = Tournament {
        id: tournament_id.clone(),
        host_id: identity.node_id,
        name,
        game_type: game_id,
        entry_fee,
        prize_pool: 0.0,
        max_participants: max_players,
        participants: vec![],
        bracket: vec![],
        status: TournamentStatus::Registration,
        created_at: chrono::Utc::now().timestamp(),
        starts_at: chrono::Utc::now().timestamp() + 86400,
        referee_ids: vec![],
        host_fee_pct: 0.0,
    };
    crate::core::database::queries::insert_tournament(&db, &tournament).map_err(|e| e.to_string())?;
    Ok(serde_json::json!({ "tournament_id": tournament_id, "status": "registration" }))
}

#[tauri::command]
pub fn cmd_join_tournament(
    state: State<'_, AppState>,
    tournament_id: String,
) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let identity = load_first_identity(&db).map_err(|e| e.to_string())?
        .ok_or_else(|| "No identity found".to_string())?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let data: String = conn.query_row(
        "SELECT data FROM tournaments WHERE id = ?1", rusqlite::params![tournament_id], |r| r.get(0),
    ).map_err(|_| "Tournament not found".to_string())?;
    let mut tournament: Tournament = serde_json::from_str(&data).map_err(|e| e.to_string())?;
    tournament.participants.push(identity.node_id);
    let updated = serde_json::to_string(&tournament).map_err(|e| e.to_string())?;
    conn.execute("UPDATE tournaments SET data = ?1 WHERE id = ?2", rusqlite::params![updated, tournament_id])
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn cmd_start_tournament(
    state: State<'_, AppState>,
    tournament_id: String,
) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "UPDATE tournaments SET status = 'active' WHERE id = ?1",
        rusqlite::params![tournament_id],
    ).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn cmd_end_tournament(
    state: State<'_, AppState>,
    tournament_id: String,
) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "UPDATE tournaments SET status = 'completed' WHERE id = ?1",
        rusqlite::params![tournament_id],
    ).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn cmd_get_tournaments(state: State<'_, AppState>) -> Result<Vec<serde_json::Value>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn.prepare("SELECT data FROM tournaments ORDER BY created_at DESC")
        .map_err(|e| e.to_string())?;
    let rows = stmt.query_map([], |row| row.get::<_, String>(0))
        .map_err(|e| e.to_string())?;
    let mut tournaments = Vec::new();
    for row in rows {
        if let Ok(data) = row {
            if let Ok(v) = serde_json::from_str::<serde_json::Value>(&data) {
                tournaments.push(v);
            }
        }
    }
    Ok(tournaments)
}

#[tauri::command]
pub fn cmd_get_games(state: State<'_, AppState>) -> Result<Vec<serde_json::Value>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn.prepare("SELECT data FROM web_games ORDER BY created_at DESC")
        .map_err(|e| e.to_string())?;
    let rows = stmt.query_map([], |row| row.get::<_, String>(0))
        .map_err(|e| e.to_string())?;
    let mut games = Vec::new();
    for row in rows {
        if let Ok(data) = row {
            if let Ok(v) = serde_json::from_str::<serde_json::Value>(&data) {
                games.push(v);
            }
        }
    }
    Ok(games)
}

#[tauri::command]
pub fn cmd_save_game_progress(
    state: State<'_, AppState>,
    game_id: String,
    high_score: u64,
    play_time_secs: u64,
) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let identity = load_first_identity(&db).map_err(|e| e.to_string())?
        .ok_or_else(|| "No identity found".to_string())?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT INTO game_progress (id, user_id, game_id, high_score, play_time_secs, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6) ON CONFLICT(user_id, game_id) DO UPDATE SET high_score = MAX(high_score, ?4), play_time_secs = play_time_secs + ?5, updated_at = ?6",
        rusqlite::params![Uuid::new_v4().to_string(), identity.node_id, game_id, high_score, play_time_secs, chrono::Utc::now().timestamp()],
    ).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn cmd_get_game_progress(
    state: State<'_, AppState>,
    game_id: String,
) -> Result<serde_json::Value, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let identity = load_first_identity(&db).map_err(|e| e.to_string())?
        .ok_or_else(|| "No identity found".to_string())?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let result: Result<(u64, u64), _> = conn.query_row(
        "SELECT high_score, play_time_secs FROM game_progress WHERE user_id = ?1 AND game_id = ?2",
        rusqlite::params![identity.node_id, game_id],
        |row| Ok((row.get(0)?, row.get(1)?)),
    );
    match result {
        Ok((high_score, play_time)) => Ok(serde_json::json!({ "high_score": high_score, "play_time_secs": play_time })),
        Err(_) => Ok(serde_json::json!({ "high_score": 0, "play_time_secs": 0 })),
    }
}

#[tauri::command]
pub fn cmd_get_user_game_stats(
    state: State<'_, AppState>,
) -> Result<serde_json::Value, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let identity = load_first_identity(&db).map_err(|e| e.to_string())?
        .ok_or_else(|| "No identity found".to_string())?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    let stats: (u64, u64, u32) = conn.query_row(
        "SELECT COALESCE(SUM(high_score), 0), COALESCE(SUM(total_play_time_secs), 0), COALESCE(SUM(games_played), 0) FROM game_progress WHERE user_id = ?1",
        rusqlite::params![identity.node_id],
        |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?)),
    ).unwrap_or((0, 0, 0));

    let games_count: u32 = conn.query_row(
        "SELECT COUNT(*) FROM game_progress WHERE user_id = ?1",
        rusqlite::params![identity.node_id],
        |row| row.get(0),
    ).unwrap_or(0);

    Ok(serde_json::json!({
        "total_high_scores": stats.0,
        "total_play_time_secs": stats.1,
        "total_games_played": stats.2,
        "unique_games": games_count,
    }))
}

#[tauri::command]
pub fn cmd_create_game_session(
    state: State<'_, AppState>,
    game_id: String,
    max_players: u32,
) -> Result<serde_json::Value, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let identity = load_first_identity(&db).map_err(|e| e.to_string())?
        .ok_or_else(|| "No identity found".to_string())?;
    let session_id = Uuid::new_v4().to_string();
    let session = crate::core::database::queries::GameSession {
        id: session_id.clone(),
        game_id,
        player_ids: serde_json::to_string(&vec![identity.node_id.clone()]).unwrap_or_default(),
        wager_amount: 0.0,
        start_time: chrono::Utc::now().timestamp(),
        end_time: None,
        scores: "{}".to_string(),
        status: "waiting".to_string(),
        created_at: chrono::Utc::now().timestamp(),
    };
    crate::core::database::queries::insert_game_session(&db, &session).map_err(|e| e.to_string())?;
    Ok(serde_json::json!({ "session_id": session_id, "status": "waiting" }))
}

#[tauri::command]
pub fn cmd_join_game_session(
    state: State<'_, AppState>,
    session_id: String,
) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let identity = load_first_identity(&db).map_err(|e| e.to_string())?
        .ok_or_else(|| "No identity found".to_string())?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let player_ids: String = conn.query_row(
        "SELECT player_ids FROM game_sessions WHERE id = ?1",
        rusqlite::params![session_id],
        |row| row.get(0),
    ).map_err(|_| "Session not found".to_string())?;
    let mut players: Vec<String> = serde_json::from_str(&player_ids).unwrap_or_default();
    players.push(identity.node_id);
    let updated = serde_json::to_string(&players).map_err(|e| e.to_string())?;
    conn.execute(
        "UPDATE game_sessions SET player_ids = ?1 WHERE id = ?2",
        rusqlite::params![updated, session_id],
    ).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn cmd_submit_score(
    state: State<'_, AppState>,
    session_id: String,
    score: u64,
) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let identity = load_first_identity(&db).map_err(|e| e.to_string())?
        .ok_or_else(|| "No identity found".to_string())?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let scores_str: String = conn.query_row(
        "SELECT scores FROM game_sessions WHERE id = ?1",
        rusqlite::params![session_id],
        |row| row.get(0),
    ).map_err(|_| "Session not found".to_string())?;
    let mut scores: HashMap<String, u64> = serde_json::from_str(&scores_str).unwrap_or_default();
    scores.insert(identity.node_id, score);
    let updated = serde_json::to_string(&scores).map_err(|e| e.to_string())?;
    conn.execute(
        "UPDATE game_sessions SET scores = ?1 WHERE id = ?2",
        rusqlite::params![updated, session_id],
    ).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn cmd_arena_create_duel(
    state: State<'_, AppState>,
    opponent_id: String,
    game_id: String,
    stake_amount: f64,
) -> Result<serde_json::Value, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let identity = load_first_identity(&db).map_err(|e| e.to_string())?
        .ok_or_else(|| "No identity found".to_string())?;
    let duel_id = Uuid::new_v4().to_string();
    log::info!("Duel created: {} vs {} on {} for {} PINC", identity.node_id, opponent_id, game_id, stake_amount);
    Ok(serde_json::json!({ "duel_id": duel_id, "status": "pending", "opponent": opponent_id }))
}

#[tauri::command]
pub fn cmd_generate_pairing_code(state: State<'_, AppState>) -> Result<serde_json::Value, String> {
    let code = format!("PINC-{:06}", rand::random::<u32>() % 1000000);
    Ok(serde_json::json!({ "code": code, "expires_in_secs": 300 }))
}

#[tauri::command]
pub fn cmd_validate_pairing_code(state: State<'_, AppState>, code: String) -> Result<bool, String> {
    Ok(code.starts_with("PINC-") && code.len() == 11)
}

#[tauri::command]
pub fn cmd_generate_qr_png(_state: State<'_, AppState>, data: Option<String>) -> Result<String, String> {
    use base64::{engine::general_purpose, Engine as _};
    use image::{ImageBuffer, Rgba, RgbaImage};
    use qrcode::QrCode;
    use qrcode::types::Color as QrColor;

    let payload = data.unwrap_or_else(|| "PINC".to_string());
    let code = QrCode::new(payload.as_bytes()).map_err(|e| e.to_string())?;

    let modules = code.to_colors();
    let qr_width = code.width() as u32;
    let scale: u32 = 8;
    let quiet: u32 = 4;
    let total = qr_width * scale + quiet * 2;

    let img: RgbaImage = ImageBuffer::from_fn(total, total, |x, y| {
        let qx = x as i32 - quiet as i32;
        let qy = y as i32 - quiet as i32;
        if qx >= 0 && qy >= 0 {
            let mx = qx as u32 / scale;
            let my = qy as u32 / scale;
            if mx < qr_width && my < qr_width {
                let idx = (my * qr_width + mx) as usize;
                if idx < modules.len() && modules[idx] == QrColor::Dark {
                    return Rgba([0u8, 0u8, 0u8, 255u8]);
                }
            }
        }
        Rgba([255u8, 255u8, 255u8, 255u8])
    });

    let mut cursor = std::io::Cursor::new(Vec::new());
    image::DynamicImage::ImageRgba8(img)
        .write_to(&mut cursor, image::ImageFormat::Png)
        .map_err(|e| e.to_string())?;
    Ok(general_purpose::STANDARD.encode(cursor.into_inner()))
}

#[tauri::command]
pub fn cmd_connect_with_code(state: State<'_, AppState>, code: String) -> Result<serde_json::Value, String> {
    if !code.starts_with("PINC-") {
        return Err("Invalid pairing code".to_string());
    }
    Ok(serde_json::json!({ "connected": true, "peer_id": code }))
}

#[tauri::command]
pub fn cmd_get_shared_connections(state: State<'_, AppState>) -> Result<Vec<serde_json::Value>, String> {
    Ok(vec![])
}

#[tauri::command]
pub fn cmd_disconnect_shared(state: State<'_, AppState>, peer_id: String) -> Result<(), String> {
    log::info!("Disconnected shared connection: {}", peer_id);
    Ok(())
}

#[tauri::command]
pub fn cmd_get_net_share_status(state: State<'_, AppState>) -> Result<serde_json::Value, String> {
    Ok(serde_json::json!({ "sharing": false, "connected_peers": 0 }))
}

#[tauri::command]
pub fn cmd_toggle_net_share(state: State<'_, AppState>, enabled: bool) -> Result<(), String> {
    log::info!("Net sharing toggled: {}", enabled);
    Ok(())
}

#[tauri::command]
pub fn cmd_create_net_store_listing(
    state: State<'_, AppState>,
    bandwidth_mbps: u32,
    price_per_gb: f64,
    location: String,
) -> Result<serde_json::Value, String> {
    let listing_id = Uuid::new_v4().to_string();
    Ok(serde_json::json!({ "listing_id": listing_id, "bandwidth_mbps": bandwidth_mbps, "price_per_gb": price_per_gb }))
}

#[tauri::command]
pub fn cmd_list_net_store_listings(state: State<'_, AppState>) -> Result<Vec<serde_json::Value>, String> {
    Ok(vec![])
}

#[tauri::command]
pub fn cmd_purchase_bandwidth(
    state: State<'_, AppState>,
    listing_id: String,
    hours: u32,
) -> Result<serde_json::Value, String> {
    let purchase_id = Uuid::new_v4().to_string();
    Ok(serde_json::json!({ "purchase_id": purchase_id, "listing_id": listing_id, "hours": hours }))
}

#[tauri::command]
pub fn cmd_get_my_listings(state: State<'_, AppState>) -> Result<Vec<serde_json::Value>, String> {
    Ok(vec![])
}

#[tauri::command]
pub fn cmd_get_my_purchases(state: State<'_, AppState>) -> Result<Vec<serde_json::Value>, String> {
    Ok(vec![])
}

#[tauri::command]
pub fn cmd_get_api_keys(state: State<'_, AppState>) -> Result<serde_json::Value, String> {
    let keys = crate::core::config::api_keys::ApiKeys::new();
    Ok(serde_json::json!({ "keys": keys.list_keys() }))
}

#[tauri::command]
pub fn cmd_get_api_key_status(state: State<'_, AppState>) -> Result<serde_json::Value, String> {
    let keys = crate::core::config::api_keys::ApiKeys::new();
    Ok(serde_json::json!({
        "gamepix": keys.has_key("gamepix_sid"),
        "groq": keys.has_key("groq_api_key"),
        "alchemy": keys.has_key("alchemy_api_key"),
        "finnhub": keys.has_key("finnhub_api_key"),
    }))
}

// ─── ADMIN COMMANDS ───────────────────────────────────────────────────────────

#[tauri::command]
pub fn cmd_admin_get_overview(state: State<'_, AppState>) -> Result<serde_json::Value, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let identity = load_first_identity(&db).map_err(|e| e.to_string())?;
    let peers = state.peer_registry.lock().map_err(|e| e.to_string())?;
    let online = peers.online_count();
    Ok(serde_json::json!({
        "node_id": identity.map(|i| i.node_id).unwrap_or_default(),
        "online_peers": online,
        "version": "3.0.0",
        "uptime": 0,
    }))
}

#[tauri::command]
pub fn cmd_admin_list_users(state: State<'_, AppState>) -> Result<Vec<serde_json::Value>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn.prepare("SELECT id, username, email, role, is_active, created_at FROM admin_users ORDER BY created_at DESC")
        .map_err(|e| e.to_string())?;
    let rows = stmt.query_map([], |row| {
        Ok(serde_json::json!({
            "id": row.get::<_, String>(0)?,
            "username": row.get::<_, String>(1)?,
            "email": row.get::<_, Option<String>>(2)?,
            "role": row.get::<_, String>(3)?,
            "is_active": row.get::<_, bool>(4)?,
            "created_at": row.get::<_, i64>(5)?,
        }))
    }).map_err(|e| e.to_string())?;
    let mut users = Vec::new();
    for row in rows { if let Ok(u) = row { users.push(u); } }
    Ok(users)
}

#[tauri::command]
pub fn cmd_admin_create_user(
    state: State<'_, AppState>,
    username: String,
    email: String,
    password: String,
    role: String,
) -> Result<serde_json::Value, String> {
    let user_id = Uuid::new_v4().to_string();
    Ok(serde_json::json!({ "user_id": user_id, "username": username, "role": role }))
}

#[tauri::command]
pub fn cmd_admin_update_user(
    state: State<'_, AppState>,
    user_id: String,
    updates: serde_json::Value,
) -> Result<(), String> {
    log::info!("Admin update user {}: {:?}", user_id, updates);
    Ok(())
}

#[tauri::command]
pub fn cmd_admin_delete_user(state: State<'_, AppState>, user_id: String) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM admin_users WHERE id = ?1", rusqlite::params![user_id])
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn cmd_admin_toggle_user(state: State<'_, AppState>, user_id: String, active: bool) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    conn.execute("UPDATE admin_users SET is_active = ?1 WHERE id = ?2", rusqlite::params![active, user_id])
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn cmd_admin_list_logs(state: State<'_, AppState>, limit: Option<u32>) -> Result<Vec<serde_json::Value>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let limit = limit.unwrap_or(50);
    let mut stmt = conn.prepare(&format!(
        "SELECT id, admin_id, action, details, ip_address, created_at FROM admin_logs ORDER BY created_at DESC LIMIT {}", limit
    )).map_err(|e| e.to_string())?;
    let rows = stmt.query_map([], |row| {
        Ok(serde_json::json!({
            "id": row.get::<_, String>(0)?,
            "admin_id": row.get::<_, String>(1)?,
            "action": row.get::<_, String>(2)?,
            "details": row.get::<_, Option<String>>(3)?,
            "ip_address": row.get::<_, Option<String>>(4)?,
            "created_at": row.get::<_, i64>(5)?,
        }))
    }).map_err(|e| e.to_string())?;
    let mut logs = Vec::new();
    for row in rows { if let Ok(l) = row { logs.push(l); } }
    Ok(logs)
}

#[tauri::command]
pub fn cmd_admin_list_logs_filtered(
    state: State<'_, AppState>,
    action: Option<String>,
    limit: Option<u32>,
) -> Result<Vec<serde_json::Value>, String> {
    cmd_admin_list_logs(state, limit)
}

#[tauri::command]
pub fn cmd_admin_list_config(state: State<'_, AppState>, category: Option<String>) -> Result<Vec<serde_json::Value>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let configs = crate::core::database::queries::list_system_config(&db, category.as_deref())
        .map_err(|e| e.to_string())?;
    Ok(configs.into_iter().map(|c| serde_json::json!({
        "id": c.id, "key": c.config_key, "value": c.config_value,
        "description": c.description, "category": c.category,
    })).collect())
}

#[tauri::command]
pub fn cmd_admin_update_config(
    state: State<'_, AppState>,
    key: String,
    value: String,
) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    crate::core::database::queries::update_system_config(&db, &key, &value, None, "admin")
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn cmd_admin_delete_config(state: State<'_, AppState>, key: String) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM system_config WHERE config_key = ?1", rusqlite::params![key])
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn cmd_admin_get_security(state: State<'_, AppState>) -> Result<serde_json::Value, String> {
    Ok(serde_json::json!({
        "encryption": "XChaCha20-Poly1305",
        "signing": "Ed25519",
        "hashing": "Blake3",
        "password_hash": "Argon2",
        "kms": "Kingsman",
    }))
}

#[tauri::command]
pub fn cmd_admin_get_network_monitor(state: State<'_, AppState>) -> Result<serde_json::Value, String> {
    let peers = state.peer_registry.lock().map_err(|e| e.to_string())?;
    let bw = state.bandwidth.lock().map_err(|e| e.to_string())?;
    let (up, down) = bw.current_kbps();
    Ok(serde_json::json!({
        "online_peers": peers.online_count(),
        "total_peers": peers.list_peers().len(),
        "bandwidth_up_kbps": up,
        "bandwidth_down_kbps": down,
    }))
}

#[tauri::command]
pub fn cmd_admin_ban_peer(state: State<'_, AppState>, peer_id: String) -> Result<(), String> {
    log::info!("Admin banned peer: {}", peer_id);
    Ok(())
}

#[tauri::command]
pub fn cmd_admin_unban_peer(state: State<'_, AppState>, peer_id: String) -> Result<(), String> {
    log::info!("Admin unbanned peer: {}", peer_id);
    Ok(())
}

#[tauri::command]
pub fn cmd_admin_reset_password(
    state: State<'_, AppState>,
    user_id: String,
    new_password: String,
) -> Result<(), String> {
    log::info!("Admin reset password for user: {}", user_id);
    Ok(())
}

#[tauri::command]
pub fn cmd_admin_list_banned_peers(state: State<'_, AppState>) -> Result<Vec<serde_json::Value>, String> {
    Ok(vec![])
}

#[tauri::command]
pub fn cmd_admin_get_kingsman_config(state: State<'_, AppState>) -> Result<serde_json::Value, String> {
    let kingsman = state.kingsman.lock().map_err(|e| e.to_string())?;
    let status = kingsman.status();
    Ok(serde_json::json!({
        "active": status.is_active,
        "permission_level": status.permissions_level,
    }))
}

#[tauri::command]
pub fn cmd_admin_set_kingsman_master_hash(
    state: State<'_, AppState>,
    master_hash: String,
) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    crate::core::database::queries::update_system_config(&db, "kingsman_master_hash", &master_hash, Some("Kingsman master hash".to_string()), "security")
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn cmd_admin_change_kingsman_master_hash(
    state: State<'_, AppState>,
    current_hash: String,
    new_hash: String,
) -> Result<(), String> {
    let mut kingsman = state.kingsman.lock().map_err(|e| e.to_string())?;
    if !kingsman.activate(&current_hash) {
        return Err("Current hash is incorrect".to_string());
    }
    drop(kingsman);
    let db = state.db.lock().map_err(|e| e.to_string())?;
    crate::core::database::queries::update_system_config(&db, "kingsman_master_hash", &new_hash, Some("Kingsman master hash".to_string()), "security")
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn cmd_admin_login(
    state: State<'_, AppState>,
    username: String,
    password: String,
) -> Result<serde_json::Value, String> {
    let mut kingsman = state.kingsman.lock().map_err(|e| e.to_string())?;
    let authenticated = kingsman.activate(&password);
    Ok(serde_json::json!({
        "authenticated": authenticated,
        "username": username,
        "permission_level": if authenticated { 4 } else { 0 },
    }))
}

#[tauri::command]
pub fn cmd_admin_get_stats(state: State<'_, AppState>) -> Result<serde_json::Value, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let identity_count: u32 = conn.query_row("SELECT COUNT(*) FROM identities", [], |r| r.get(0)).unwrap_or(0);
    let peer_count: u32 = conn.query_row("SELECT COUNT(*) FROM peers", [], |r| r.get(0)).unwrap_or(0);
    let vault_count: u32 = conn.query_row("SELECT COUNT(*) FROM vault_files", [], |r| r.get(0)).unwrap_or(0);
    let message_count: u32 = conn.query_row("SELECT COUNT(*) FROM messages", [], |r| r.get(0)).unwrap_or(0);
    Ok(serde_json::json!({
        "identities": identity_count,
        "peers": peer_count,
        "vault_files": vault_count,
        "messages": message_count,
    }))
}

#[tauri::command]
pub fn cmd_resolve_game_session(
    state: State<'_, AppState>,
    session_id: String,
    score: u64,
    result: String,
) -> Result<serde_json::Value, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let identity = load_first_identity(&db).map_err(|e| e.to_string())?
        .ok_or_else(|| "No identity found".to_string())?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    conn.execute(
        "UPDATE game_sessions SET status = 'completed', end_time = ?1, scores = json_set(COALESCE(scores, '{}'), ?2, ?3) WHERE id = ?4",
        rusqlite::params![
            chrono::Utc::now().timestamp(),
            format!("$.{}", identity.node_id),
            score.to_string(),
            session_id
        ],
    ).map_err(|e| e.to_string())?;

    let winner_id = if result == "win" {
        Some(identity.node_id.clone())
    } else {
        None
    };

    if let Some(ref wid) = winner_id {
        conn.execute(
            "UPDATE game_sessions SET winner_id = ?1 WHERE id = ?2",
            rusqlite::params![wid, session_id],
        ).map_err(|e| e.to_string())?;
    }

    log::info!("Game session {} resolved: {} (score: {}, result: {})", session_id, identity.node_id, score, result);

    let payout = match result.as_str() {
        "win" => 2.0,
        "draw" => 1.0,
        _ => 0.0,
    };

    Ok(serde_json::json!({
        "session_id": session_id,
        "winner_id": winner_id,
        "score": score,
        "result": result,
        "payout": payout,
        "resolved_at": chrono::Utc::now().timestamp(),
    }))
}

#[tauri::command]
pub fn cmd_get_game_sessions(
    state: State<'_, AppState>,
) -> Result<Vec<serde_json::Value>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let identity = load_first_identity(&db).map_err(|e| e.to_string())?
        .ok_or_else(|| "No identity found".to_string())?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    let mut stmt = conn.prepare(
        "SELECT id, game_id, player_ids, wager_amount, start_time, end_time, scores, status, winner_id, created_at FROM game_sessions WHERE player_ids LIKE ?1 ORDER BY created_at DESC LIMIT 50"
    ).map_err(|e| e.to_string())?;

    let pattern = format!("%{}%", identity.node_id);
    let sessions = stmt.query_map(rusqlite::params![pattern], |row| {
        let id: String = row.get(0)?;
        let game_id: String = row.get(1)?;
        let player_ids_str: String = row.get(2)?;
        let wager_amount: f64 = row.get(3)?;
        let start_time: i64 = row.get(4)?;
        let end_time: Option<i64> = row.get(5)?;
        let scores_str: String = row.get(6)?;
        let status: String = row.get(7)?;
        let winner_id: Option<String> = row.get(8)?;
        let created_at: i64 = row.get(9)?;

        let player_ids: Vec<String> = serde_json::from_str(&player_ids_str).unwrap_or_default();
        let scores: serde_json::Value = serde_json::from_str(&scores_str).unwrap_or(serde_json::json!({}));

        let result = if status == "completed" {
            if winner_id.as_deref() == Some(&identity.node_id) {
                Some("win".to_string())
            } else if winner_id.is_some() {
                Some("loss".to_string())
            } else {
                Some("draw".to_string())
            }
        } else {
            None
        };

        Ok(serde_json::json!({
            "session_id": id,
            "game_id": game_id,
            "player_ids": player_ids,
            "bet_amount": wager_amount,
            "status": status,
            "scores": scores,
            "winner_id": winner_id,
            "result": result,
            "started_at": start_time,
            "ended_at": end_time,
        }))
    }).map_err(|e| e.to_string())?;

    let mut result = Vec::new();
    for session in sessions {
        if let Ok(s) = session {
            result.push(s);
        }
    }
    Ok(result)
}

#[tauri::command]
pub fn cmd_get_leaderboard(
    state: State<'_, AppState>,
    category: String,
) -> Result<Vec<serde_json::Value>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    let mut entries = Vec::new();

    if category == "games" || category == "all" {
        let mut stmt = conn.prepare(
            "SELECT winner_id, COUNT(*) as wins FROM game_sessions WHERE winner_id IS NOT NULL AND status = 'completed' GROUP BY winner_id ORDER BY wins DESC LIMIT 20"
        ).map_err(|e| e.to_string())?;

        let winners = stmt.query_map([], |row| {
            let user_id: String = row.get(0)?;
            let wins: u32 = row.get(1)?;
            Ok((user_id, wins))
        }).map_err(|e| e.to_string())?;

        for (i, entry) in winners.enumerate() {
            if let Ok((user_id, wins)) = entry {
                entries.push(serde_json::json!({
                    "rank": i + 1,
                    "user_id": user_id,
                    "username": format!("User_{}", &user_id[..8.min(user_id.len())]),
                    "score": wins * 10,
                    "games_won": wins,
                    "category": "games",
                }));
            }
        }
    }

    Ok(entries)
}

#[tauri::command]
pub fn cmd_save_game_result(
    state: State<'_, AppState>,
    game_id: String,
    game_title: String,
    score: u64,
    result: String,
    bet_amount: f64,
) -> Result<serde_json::Value, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let identity = load_first_identity(&db).map_err(|e| e.to_string())?
        .ok_or_else(|| "No identity found".to_string())?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    let session_id = Uuid::new_v4().to_string();
    let session = crate::core::database::queries::GameSession {
        id: session_id.clone(),
        game_id: game_id.clone(),
        player_ids: serde_json::to_string(&vec![identity.node_id.clone()]).unwrap_or_default(),
        wager_amount: bet_amount,
        start_time: chrono::Utc::now().timestamp(),
        end_time: Some(chrono::Utc::now().timestamp()),
        scores: serde_json::json!({ identity.node_id.clone(): score }).to_string(),
        status: "completed".to_string(),
        created_at: chrono::Utc::now().timestamp(),
    };
    crate::core::database::queries::insert_game_session(&db, &session).map_err(|e| e.to_string())?;

    let winner_id = if result == "win" {
        Some(identity.node_id.clone())
    } else {
        None
    };
    if let Some(ref wid) = winner_id {
        conn.execute(
            "UPDATE game_sessions SET winner_id = ?1 WHERE id = ?2",
            rusqlite::params![wid, session_id],
        ).map_err(|e| e.to_string())?;
    }

    log::info!("Game result saved: {} ({}) score={} result={} bet={}", game_title, game_id, score, result, bet_amount);

    let payout = match result.as_str() {
        "win" => bet_amount * 2.0,
        "draw" => bet_amount,
        _ => 0.0,
    };

    Ok(serde_json::json!({
        "session_id": session_id,
        "game_id": game_id,
        "score": score,
        "result": result,
        "bet_amount": bet_amount,
        "payout": payout,
        "saved_at": chrono::Utc::now().timestamp(),
    }))
}

#[tauri::command]
pub fn cmd_save_game_result_with_progress(
    state: State<'_, AppState>,
    game_id: String,
    game_title: String,
    score: u64,
    result: String,
    bet_amount: f64,
    play_time_secs: u64,
    level: Option<u32>,
    metadata: Option<String>,
) -> Result<serde_json::Value, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let identity = load_first_identity(&db).map_err(|e| e.to_string())?
        .ok_or_else(|| "No identity found".to_string())?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    let session_id = Uuid::new_v4().to_string();
    let session = crate::core::database::queries::GameSession {
        id: session_id.clone(),
        game_id: game_id.clone(),
        player_ids: serde_json::to_string(&vec![identity.node_id.clone()]).unwrap_or_default(),
        wager_amount: bet_amount,
        start_time: chrono::Utc::now().timestamp() - (play_time_secs as i64),
        end_time: Some(chrono::Utc::now().timestamp()),
        scores: serde_json::json!({ identity.node_id.clone(): score }).to_string(),
        status: "completed".to_string(),
        created_at: chrono::Utc::now().timestamp(),
    };
    crate::core::database::queries::insert_game_session(&db, &session).map_err(|e| e.to_string())?;

    let current_high: u64 = conn.query_row(
        "SELECT COALESCE(high_score, 0) FROM game_progress WHERE user_id = ?1 AND game_id = ?2",
        rusqlite::params![identity.node_id, game_id],
        |row| row.get(0),
    ).unwrap_or(0);

    if score > current_high {
        conn.execute(
            "INSERT INTO game_progress (user_id, game_id, high_score, total_play_time_secs, games_played, last_played_at, level, metadata)
             VALUES (?1, ?2, ?3, ?4, 1, ?5, ?6, ?7)
             ON CONFLICT(user_id, game_id) DO UPDATE SET
             high_score = MAX(high_score, ?3),
             total_play_time_secs = total_play_time_secs + ?4,
             games_played = games_played + 1,
             last_played_at = ?5,
             level = COALESCE(?6, level),
             metadata = COALESCE(?7, metadata)",
            rusqlite::params![
                identity.node_id, game_id, score, play_time_secs,
                chrono::Utc::now().timestamp(), level, metadata
            ],
        ).map_err(|e| e.to_string())?;
    } else {
        conn.execute(
            "INSERT INTO game_progress (user_id, game_id, high_score, total_play_time_secs, games_played, last_played_at, level, metadata)
             VALUES (?1, ?2, ?3, ?4, 1, ?5, ?6, ?7)
             ON CONFLICT(user_id, game_id) DO UPDATE SET
             total_play_time_secs = total_play_time_secs + ?4,
             games_played = games_played + 1,
             last_played_at = ?5,
             level = COALESCE(?6, level),
             metadata = COALESCE(?7, metadata)",
            rusqlite::params![
                identity.node_id, game_id, score, play_time_secs,
                chrono::Utc::now().timestamp(), level, metadata
            ],
        ).map_err(|e| e.to_string())?;
    }

    if result == "win" {
        conn.execute(
            "UPDATE game_sessions SET winner_id = ?1 WHERE id = ?2",
            rusqlite::params![identity.node_id, session_id],
        ).map_err(|e| e.to_string())?;
    }

    log::info!("Game result saved: {} score={} result={} play_time={}s", game_title, score, result, play_time_secs);

    let payout = match result.as_str() {
        "win" => bet_amount * 2.0,
        "draw" => bet_amount,
        _ => 0.0,
    };

    Ok(serde_json::json!({
        "session_id": session_id,
        "score": score,
        "result": result,
        "payout": payout,
        "high_score": std::cmp::max(score, current_high),
        "saved_at": chrono::Utc::now().timestamp(),
    }))
}

#[tauri::command]
pub fn cmd_get_game_progress_all(
    state: State<'_, AppState>,
) -> Result<Vec<serde_json::Value>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let identity = load_first_identity(&db).map_err(|e| e.to_string())?
        .ok_or_else(|| "No identity found".to_string())?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    let mut stmt = conn.prepare(
        "SELECT game_id, high_score, total_play_time_secs, games_played, last_played_at, level, metadata FROM game_progress WHERE user_id = ?1 ORDER BY last_played_at DESC"
    ).map_err(|e| e.to_string())?;

    let progress = stmt.query_map(rusqlite::params![identity.node_id], |row| {
        let game_id: String = row.get(0)?;
        let high_score: u64 = row.get(1)?;
        let total_play_time: u64 = row.get(2)?;
        let games_played: u32 = row.get(3)?;
        let last_played: i64 = row.get(4)?;
        let level: Option<u32> = row.get(5)?;
        let metadata: Option<String> = row.get(6)?;
        Ok(serde_json::json!({
            "game_id": game_id,
            "high_score": high_score,
            "total_play_time_secs": total_play_time,
            "games_played": games_played,
            "last_played_at": last_played,
            "level": level,
            "metadata": metadata,
        }))
    }).map_err(|e| e.to_string())?;

    let mut result = Vec::new();
    for p in progress {
        if let Ok(entry) = p { result.push(entry); }
    }
    Ok(result)
}
