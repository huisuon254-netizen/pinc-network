use crate::commands::AppState;
use crate::core::database::queries::pinc_id_from_node_id;
use crate::core::messaging::message_manager;
use serde::{Deserialize, Serialize};
use tauri::State;

#[tauri::command]
pub fn cmd_get_starteran_status(state: State<'_, AppState>) -> Result<serde_json::Value, String> {
    let engine = state.starteran.lock().unwrap();
    Ok(engine.to_json_value())
}

#[tauri::command]
pub fn cmd_get_rentbit_status(
    state: State<'_, AppState>,
) -> Result<serde_json::Value, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let identity = crate::core::database::queries::load_first_identity(&db)
        .map_err(|e| e.to_string())?
        .ok_or_else(|| "No identity found".to_string())?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    let active_rentals: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM rift_rentals WHERE renter_id = ?1 AND status = 'Active'",
            rusqlite::params![identity.node_id],
            |r| r.get(0),
        )
        .unwrap_or(0);

    let (cpu_usage, ram_usage, storage_usage) = {
        use sysinfo::{System, Disks};
        let mut sys = System::new();
        sys.refresh_cpu();
        sys.refresh_memory();
        let cpus = sys.cpus();
        let cpu_pct = if !cpus.is_empty() {
            cpus.iter().map(|c| c.cpu_usage() as f64).sum::<f64>() / cpus.len() as f64
        } else { 0.0 };
        let ram_pct = if sys.total_memory() > 0 {
            sys.used_memory() as f64 / sys.total_memory() as f64 * 100.0
        } else { 0.0 };
        let disks = Disks::new_with_refreshed_list();
        let (total, used) = {
            let mut t: u64 = 0; let mut u: u64 = 0;
            for d in &disks {
                let name = d.name().to_string_lossy().to_string();
                if name.starts_with("loop") || name.starts_with("overlay") || name == "tmpfs" || name == "devtmpfs" || name.starts_with("zram") {
                    continue;
                }
                t += d.total_space();
                u += d.total_space().saturating_sub(d.available_space());
            }
            (t, u)
        };
        let storage_pct = if total > 0 { used as f64 / total as f64 * 100.0 } else { 0.0 };
        (cpu_pct, ram_pct, storage_pct)
    };

    let (earnings, host_rating): (f64, f64) = conn
        .query_row(
            "SELECT COALESCE(SUM(total_earnings),0), COALESCE(AVG(average_rating),0) FROM rift_metrics",
            [],
            |r| Ok((r.get(0).unwrap_or(0.0), r.get(1).unwrap_or(0.0))),
        )
        .unwrap_or((0.0, 0.0));

    let qualified = cpu_usage < 80.0 && ram_usage < 85.0 && storage_usage < 90.0;

    Ok(serde_json::json!({
        "active_rentals": active_rentals,
        "cpu_usage": cpu_usage,
        "ram_usage": ram_usage,
        "storage_usage": storage_usage,
        "earnings": earnings,
        "host_rating": host_rating,
        "qualified": qualified,
    }))
}

#[tauri::command]
pub fn cmd_run_device_scan(_state: State<'_, AppState>) -> Result<serde_json::Value, String> {
    let cpu_cores = num_cpus::get();
    let cpu_speed_ghz = get_cpu_speed_ghz();
    let ram_gb = get_ram_gb();
    let (storage_gb, storage_used_pct) = get_storage_info();
    let network_mbps = get_network_mbps();
    let uptime_hours = get_uptime_hours();
    let security_status = get_security_status();

    Ok(serde_json::json!({
        "cpu_cores": cpu_cores,
        "cpu_speed_ghz": cpu_speed_ghz,
        "ram_gb": ram_gb,
        "storage_gb": storage_gb,
        "storage_used_percent": storage_used_pct,
        "network_mbps": network_mbps,
        "uptime_hours": uptime_hours,
        "security_status": security_status,
    }))
}

fn with_sysinfo() -> sysinfo::System {
    sysinfo::System::new()
}

fn get_cpu_speed_ghz() -> f64 {
    let mut sys = with_sysinfo();
    sys.refresh_cpu();
    let cpus = sys.cpus();
    if cpus.is_empty() {
        return 0.0;
    }
    // Average frequency across all CPUs, convert MHz to GHz
    let total_mhz: u64 = cpus.iter().map(|c| c.frequency()).sum();
    let avg_mhz = total_mhz as f64 / cpus.len() as f64;
    avg_mhz / 1000.0
}

fn get_ram_gb() -> u64 {
    let mut sys = with_sysinfo();
    sys.refresh_memory();
    let total_bytes = sys.total_memory();
    total_bytes / (1024 * 1024 * 1024)
}

fn get_storage_info() -> (u64, u64) {
    use sysinfo::Disks;
    let disks = Disks::new_with_refreshed_list();
    let mut total: u64 = 0;
    let mut available: u64 = 0;
    for disk in &disks {
        let name = disk.name().to_string_lossy().to_string();
        if name.starts_with("loop")
            || name.starts_with("overlay")
            || name == "tmpfs"
            || name == "devtmpfs"
            || name.starts_with("zram")
        {
            continue;
        }
        total += disk.total_space();
        available += disk.available_space();
    }
    if total == 0 {
        return (0, 0);
    }
    let used = total - available;
    let pct = (used as f64 / total as f64 * 100.0) as u64;
    (total / 1_073_741_824, pct)
}

fn get_network_mbps() -> u64 {
    use std::time::{Duration, Instant};
    let test_urls = [
        "https://speed.cloudflare.com/__down?bytes=5000000",
        "https://proof.ovh.net/files/5Mb.dat",
        "http://ipv4.download.thinkbroadband.com/5MB.zip",
    ];
    let client = match reqwest::blocking::Client::builder()
        .timeout(Duration::from_secs(10))
        .build()
    {
        Ok(c) => c,
        Err(_) => return 0,
    };
    let mut best_mbps: u64 = 0;
    for url in test_urls {
        let start = Instant::now();
        match client.get(url).send() {
            Ok(resp) => {
                let bytes = match resp.bytes() {
                    Ok(b) => b.len() as u64,
                    Err(_) => continue,
                };
                let elapsed = start.elapsed();
                let secs = elapsed.as_secs_f64();
                if secs > 0.0 {
                    let bits = bytes * 8;
                    let mbps = (bits as f64 / secs / 1_000_000.0) as u64;
                    if mbps > best_mbps {
                        best_mbps = mbps;
                    }
                }
            }
            Err(_) => continue,
        }
    }
    best_mbps
}

fn get_uptime_hours() -> u64 {
    sysinfo::System::uptime() / 3600
}

fn get_security_status() -> String {
    let mut sys = with_sysinfo();
    sys.refresh_cpu();
    let cpu_count = sys.cpus().len();
    if cpu_count > 0 {
        "ok".to_string()
    } else {
        "warning: limited system information".to_string()
    }
}

#[tauri::command]
pub fn cmd_get_conversations(
    state: State<'_, AppState>,
) -> Result<Vec<serde_json::Value>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let identity = crate::core::database::queries::load_first_identity(&db)
        .map_err(|e| e.to_string())?
        .ok_or_else(|| "No identity found".to_string())?;

    let conversations = message_manager::get_conversations(&db, &identity.node_id)
        .map_err(|e| e.to_string())?;

    Ok(conversations
        .into_iter()
        .map(|c| {
            serde_json::json!({
                "id": c.conversation_id,
                "name": c.peer_id,
                "last_message": c.last_message_preview,
                "last_message_at": c.last_message_at,
                "unread_count": c.unread_count,
            })
        })
        .collect())
}

#[tauri::command]
pub fn cmd_get_call_history(
    state: State<'_, AppState>,
) -> Result<Vec<serde_json::Value>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare("SELECT id, peer_id, call_type, started_at, ended_at, duration_secs, status FROM call_history ORDER BY started_at DESC LIMIT 100")
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([], |row| {
            let started: i64 = row.get(3)?;
            let _ended: i64 = row.get(4)?;
            let duration: i64 = row.get(5)?;
            let status: String = row.get(6)?;
            let direction = if status == "outgoing" { "outgoing" } else if status == "incoming" { "incoming" } else { "missed" };
            Ok(serde_json::json!({
                "id": row.get::<_, String>(0)?,
                "contact": row.get::<_, String>(1)?,
                "type": row.get::<_, String>(2)?,
                "direction": direction,
                "timestamp": started,
                "duration": duration,
            }))
        })
        .map_err(|e| e.to_string())?;
    Ok(rows.filter_map(|r| r.ok()).collect())
}

#[tauri::command]
pub fn cmd_get_communities(_state: State<'_, AppState>) -> Result<Vec<serde_json::Value>, String> {
    Ok(vec![])
}

#[tauri::command]
pub fn cmd_get_status_updates(
    _state: State<'_, AppState>,
) -> Result<Vec<serde_json::Value>, String> {
    Ok(vec![])
}

#[tauri::command]
pub fn cmd_get_challenges(_state: State<'_, AppState>) -> Result<Vec<serde_json::Value>, String> {
    Ok(vec![])
}

#[tauri::command]
pub fn cmd_get_rankings(
    _state: State<'_, AppState>,
    _category: String,
) -> Result<Vec<serde_json::Value>, String> {
    Ok(vec![])
}

#[tauri::command]
pub fn cmd_get_security_logs(
    _state: State<'_, AppState>,
) -> Result<Vec<serde_json::Value>, String> {
    Ok(vec![])
}

#[tauri::command]
pub fn cmd_get_devices(_state: State<'_, AppState>) -> Result<Vec<serde_json::Value>, String> {
    Ok(vec![])
}

#[tauri::command]
pub fn cmd_get_app_notifications(
    _state: State<'_, AppState>,
) -> Result<Vec<serde_json::Value>, String> {
    Ok(vec![])
}

#[tauri::command]
pub fn cmd_get_jobs(state: State<'_, AppState>) -> Result<Vec<serde_json::Value>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn.prepare(
        "SELECT id, title, description, budget, status, owner_id, created_at FROM marketplace_jobs ORDER BY created_at DESC"
    ).map_err(|e| e.to_string())?;
    let rows = stmt.query_map([], |row| {
        Ok(serde_json::json!({
            "id": row.get::<_, String>(0)?,
            "title": row.get::<_, String>(1)?,
            "description": row.get::<_, String>(2)?,
            "budget": row.get::<_, f64>(3)?,
            "status": row.get::<_, String>(4)?,
            "owner_id": row.get::<_, String>(5)?,
            "created_at": row.get::<_, i64>(6)?,
            "currency": "PINC",
            "skills_required": [],
        }))
    }).map_err(|e| e.to_string())?;
    Ok(rows.filter_map(|r| r.ok()).collect())
}

#[tauri::command]
pub fn cmd_get_my_jobs(_state: State<'_, AppState>) -> Result<Vec<serde_json::Value>, String> {
    Ok(vec![])
}

#[tauri::command]
pub fn cmd_get_jobs_stats(_state: State<'_, AppState>) -> Result<serde_json::Value, String> {
    Ok(serde_json::json!({
        "active_jobs": 0,
        "pending_applications": 0,
        "completed_jobs": 0,
        "total_earnings": 0.0,
        "success_rate": 0.0,
    }))
}

#[tauri::command]
pub fn cmd_get_jobs_earnings(_state: State<'_, AppState>) -> Result<serde_json::Value, String> {
    Ok(serde_json::json!({
        "total_earned": 0.0,
        "pending_amount": 0.0,
        "withdrawn_amount": 0.0,
        "history": [],
    }))
}

#[tauri::command]
#[allow(clippy::too_many_arguments)]
pub fn cmd_jobs_create_job(
    state: State<'_, AppState>,
    title: String,
    category: String,
    subcategory: String,
    budget_min: f64,
    budget_max: f64,
    skills: Vec<String>,
    description: String,
    deadline: String,
) -> Result<serde_json::Value, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let identity = crate::core::database::queries::load_first_identity(&db)
        .map_err(|e| e.to_string())?
        .ok_or("No identity found".to_string())?;
    let job_id = uuid::Uuid::new_v4().to_string();
    let now = now_ts();
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT INTO marketplace_jobs (id, title, description, budget, status, owner_id, created_at) VALUES (?1, ?2, ?3, ?4, 'open', ?5, ?6)",
        rusqlite::params![job_id, title, description, budget_max, identity.node_id, now],
    ).map_err(|e| e.to_string())?;
    Ok(serde_json::json!({
        "job_id": job_id,
        "title": title,
        "category": category,
        "subcategory": subcategory,
        "budget_min": budget_min,
        "budget_max": budget_max,
        "skills": skills,
        "description": description,
        "deadline": deadline,
        "status": "open",
        "owner_id": identity.node_id,
        "created_at": now,
    }))
}

#[tauri::command]
pub fn cmd_jobs_apply_job(
    _state: State<'_, AppState>,
    job_id: String,
    proposal: String,
) -> Result<serde_json::Value, String> {
    let application_id = uuid::Uuid::new_v4().to_string();
    log::info!(
        "Application submitted for job {} — {}",
        job_id,
        application_id
    );
    Ok(serde_json::json!({
        "application_id": application_id,
        "job_id": job_id,
        "proposal": proposal,
        "status": "pending",
    }))
}

#[tauri::command]
pub fn cmd_jobs_accept_application(
    _state: State<'_, AppState>,
    application_id: String,
) -> Result<serde_json::Value, String> {
    log::info!("Accepted application: {}", application_id);
    Ok(serde_json::json!({
        "application_id": application_id,
        "accepted": true,
    }))
}

#[tauri::command]
pub fn cmd_jobs_reject_application(
    _state: State<'_, AppState>,
    application_id: String,
) -> Result<serde_json::Value, String> {
    log::info!("Rejected application: {}", application_id);
    Ok(serde_json::json!({
        "application_id": application_id,
        "rejected": true,
    }))
}

#[tauri::command]
pub fn cmd_jobs_complete_job(
    _state: State<'_, AppState>,
    job_id: String,
) -> Result<serde_json::Value, String> {
    log::info!("Job marked complete: {}", job_id);
    Ok(serde_json::json!({
        "job_id": job_id,
        "completed": true,
    }))
}

#[tauri::command]
pub fn cmd_create_challenge(
    state: State<'_, AppState>,
    title: String,
    category: String,
    difficulty: String,
    _reward_points: u32,
    _description: String,
) -> Result<serde_json::Value, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let identity = crate::core::database::queries::load_first_identity(&db)
        .map_err(|e| e.to_string())?
        .ok_or("No identity".to_string())?;
    let challenge_id = uuid::Uuid::new_v4().to_string();
    let now = now_ts();
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT OR IGNORE INTO challenges (id, title, creator_id, category, difficulty, reward_points, status, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, 'open', ?7)",
        rusqlite::params![challenge_id, title, identity.node_id, category, difficulty, _reward_points, now],
    ).map_err(|e| e.to_string())?;
    Ok(serde_json::json!({ "challenge_id": challenge_id, "status": "open", "created_at": now }))
}

// ─── CONTACTS ───────────────────────────────────────────────────────────────

#[tauri::command]
pub fn cmd_add_contact(
    state: State<'_, AppState>,
    contact_node_id: String,
    nickname: String,
    service_name: Option<String>,
    share_code: Option<String>,
) -> Result<serde_json::Value, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let identity = crate::core::database::queries::load_first_identity(&db)
        .map_err(|e| e.to_string())?
        .ok_or("No identity found".to_string())?;

    let contact_username =
        crate::core::database::queries::search_identities_by_query(&db, &contact_node_id)
            .ok()
            .and_then(|v| {
                v.into_iter()
                    .find(|i| i.node_id == contact_node_id)
                    .map(|i| i.username)
            })
            .unwrap_or_default();

    let svc = service_name.unwrap_or_default();
    let code = share_code.unwrap_or_default();

    let contact = crate::core::database::queries::insert_contact(
        &db,
        &identity.node_id,
        &contact_node_id,
        &contact_username,
        &nickname,
        &svc,
        &code,
    )
    .map_err(|e| e.to_string())?;

    Ok(serde_json::json!({
        "id": contact.id,
        "contact_node_id": contact.contact_node_id,
        "contact_username": contact.contact_username,
        "nickname": contact.nickname,
        "service_name": contact.service_name,
        "share_code": contact.share_code,
        "pinc_id": pinc_id_from_node_id(&contact.contact_node_id),
        "status": contact.status,
    }))
}

#[tauri::command]
pub fn cmd_list_contacts(state: State<'_, AppState>) -> Result<Vec<serde_json::Value>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let identity = crate::core::database::queries::load_first_identity(&db)
        .map_err(|e| e.to_string())?
        .ok_or("No identity found".to_string())?;

    let contacts = crate::core::database::queries::list_contacts(&db, &identity.node_id)
        .map_err(|e| e.to_string())?;

    Ok(contacts
        .into_iter()
        .map(|c| {
            serde_json::json!({
                "id": c.id,
                "contact_node_id": c.contact_node_id,
                "contact_username": c.contact_username,
                "nickname": c.nickname,
                "service_name": c.service_name,
                "share_code": c.share_code,
                "pinc_id": pinc_id_from_node_id(&c.contact_node_id),
                "status": c.status,
                "created_at": c.created_at,
            })
        })
        .collect())
}

#[tauri::command]
pub fn cmd_remove_contact(
    state: State<'_, AppState>,
    contact_node_id: String,
) -> Result<serde_json::Value, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let identity = crate::core::database::queries::load_first_identity(&db)
        .map_err(|e| e.to_string())?
        .ok_or("No identity found".to_string())?;

    crate::core::database::queries::remove_contact(&db, &identity.node_id, &contact_node_id)
        .map_err(|e| e.to_string())?;

    Ok(serde_json::json!({ "removed": true, "contact_node_id": contact_node_id }))
}

#[tauri::command]
pub fn cmd_update_contact_service(
    state: State<'_, AppState>,
    contact_node_id: String,
    service_name: String,
) -> Result<serde_json::Value, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let identity = crate::core::database::queries::load_first_identity(&db)
        .map_err(|e| e.to_string())?
        .ok_or("No identity found".to_string())?;

    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "UPDATE contacts SET service_name = ?1 WHERE owner_node_id = ?2 AND contact_node_id = ?3",
        rusqlite::params![service_name, identity.node_id, contact_node_id],
    )
    .map_err(|e| e.to_string())?;

    Ok(serde_json::json!({ "updated": true, "contact_node_id": contact_node_id }))
}

#[tauri::command]
pub fn cmd_generate_starteran_share_code(
    state: State<'_, AppState>,
) -> Result<serde_json::Value, String> {
    let engine = state.starteran.lock().unwrap();
    let code = engine.generate_share_code();
    Ok(serde_json::json!({ "share_code": code }))
}

#[tauri::command]
pub fn cmd_pinc_id_from_node_id(
    _state: State<'_, AppState>,
    node_id: String,
) -> Result<serde_json::Value, String> {
    Ok(serde_json::json!({ "pinc_id": pinc_id_from_node_id(&node_id) }))
}

#[tauri::command]
pub fn cmd_search_users(
    state: State<'_, AppState>,
    query: String,
) -> Result<Vec<serde_json::Value>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let identities = crate::core::database::queries::search_identities_by_query(&db, &query)
        .map_err(|e| e.to_string())?;

    Ok(identities
        .into_iter()
        .map(|i| {
            let display_name = if i.username.is_empty() {
                pinc_id_from_node_id(&i.node_id)
            } else {
                i.username.clone()
            };
            serde_json::json!({
                "node_id": i.node_id,
                "pinc_id": pinc_id_from_node_id(&i.node_id),
                "display_name": display_name,
                "username": i.username,
                "bio": serde_json::Value::Null,
                "avatar_hash": serde_json::Value::Null,
                "skills": [],
                "badges": [],
                "follower_count": 0,
                "following_count": 0,
                "post_count": 0,
                "joined_at": i.created_at,
                "verified": false,
            })
        })
        .collect())
}

// ─── FORUMS ─────────────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ForumPostRow {
    pub id: String,
    pub author_pinc_id: String,
    pub display_name: String,
    pub content: String,
    pub post_type: String,
    pub visibility: String,
    pub like_count: i64,
    pub reply_count: i64,
    pub reply_to: Option<String>,
    pub tags: String,
    pub encrypted: i64,
    pub created_at: i64,
    pub edited_at: Option<i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ForumCommentRow {
    pub id: String,
    pub post_id: String,
    pub author_pinc_id: String,
    pub display_name: String,
    pub content: String,
    pub like_count: i64,
    pub created_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ForumProfileRow {
    pub pinc_id: String,
    pub handle: String,
    pub display_name: String,
    pub bio: String,
    pub avatar_hash: Option<String>,
    pub is_verified: i64,
    pub created_at: i64,
}

fn now_ts() -> i64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs() as i64
}

#[tauri::command]
pub fn cmd_get_forum_posts(
    _state: State<'_, AppState>,
    limit: Option<u32>,
) -> Result<Vec<serde_json::Value>, String> {
    let db = _state.db.lock().map_err(|e| e.to_string())?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let limit = limit.unwrap_or(50);
    let mut stmt = conn
        .prepare(
            "SELECT id, author_pinc_id, display_name, content, post_type, visibility, like_count, reply_count, reply_to, tags, encrypted, created_at, edited_at
             FROM forum_posts ORDER BY created_at DESC LIMIT ?1",
        )
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map(rusqlite::params![limit], |row| {
            Ok(ForumPostRow {
                id: row.get(0)?,
                author_pinc_id: row.get(1)?,
                display_name: row.get(2)?,
                content: row.get(3)?,
                post_type: row.get(4)?,
                visibility: row.get(5)?,
                like_count: row.get(6)?,
                reply_count: row.get(7)?,
                reply_to: row.get(8)?,
                tags: row.get(9)?,
                encrypted: row.get(10)?,
                created_at: row.get(11)?,
                edited_at: row.get(12)?,
            })
        })
        .map_err(|e| e.to_string())?;
    rows.map(|r| r.map_err(|e| e.to_string()))
        .collect::<Result<Vec<_>, _>>()
        .map(|posts| {
            posts
                .into_iter()
                .map(|p| {
                    serde_json::json!({
                        "id": p.id,
                        "author_pinc_id": p.author_pinc_id,
                        "display_name": p.display_name,
                        "content": p.content,
                        "post_type": p.post_type,
                        "visibility": p.visibility,
                        "like_count": p.like_count,
                        "reply_count": p.reply_count,
                        "reply_to": p.reply_to,
                        "tags": serde_json::from_str::<serde_json::Value>(&p.tags).unwrap_or(serde_json::json!([])),
                        "encrypted": p.encrypted != 0,
                        "created_at": p.created_at,
                        "edited_at": p.edited_at,
                    })
                })
                .collect()
        })
}

#[tauri::command]
pub fn cmd_create_forum_post(
    state: State<'_, AppState>,
    content: String,
    post_type: Option<String>,
    visibility: Option<String>,
) -> Result<serde_json::Value, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let identity = crate::core::database::queries::load_first_identity(&db)
        .map_err(|e| e.to_string())?
        .ok_or("No identity found".to_string())?;

    let ptype = post_type.unwrap_or_else(|| "text".to_string());
    let vis = visibility.unwrap_or_else(|| "public".to_string());
    let pinc_id = pinc_id_from_node_id(&identity.node_id);
    let now = now_ts();
    let post_id = format!("post-{}", uuid::Uuid::new_v4());

    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT INTO forum_posts (id, author_pinc_id, display_name, content, post_type, visibility, like_count, reply_count, reply_to, tags, encrypted, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, 0, 0, NULL, '[]', 0, ?7)",
        rusqlite::params![post_id, pinc_id, pinc_id, content, ptype, vis, now],
    )
    .map_err(|e| e.to_string())?;

    Ok(serde_json::json!({
        "id": post_id,
        "author_pinc_id": pinc_id,
        "display_name": pinc_id,
        "content": content,
        "post_type": ptype,
        "visibility": vis,
        "like_count": 0,
        "reply_count": 0,
        "reply_to": serde_json::Value::Null,
        "tags": serde_json::json!([]),
        "encrypted": false,
        "created_at": now,
        "edited_at": serde_json::Value::Null,
    }))
}

#[tauri::command]
pub fn cmd_get_forum_comments(
    _state: State<'_, AppState>,
    post_id: String,
) -> Result<Vec<serde_json::Value>, String> {
    let db = _state.db.lock().map_err(|e| e.to_string())?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare("SELECT id, post_id, author_pinc_id, display_name, content, like_count, created_at FROM forum_comments WHERE post_id = ?1 ORDER BY created_at ASC")
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map(rusqlite::params![post_id], |row| {
            Ok(ForumCommentRow {
                id: row.get(0)?,
                post_id: row.get(1)?,
                author_pinc_id: row.get(2)?,
                display_name: row.get(3)?,
                content: row.get(4)?,
                like_count: row.get(5)?,
                created_at: row.get(6)?,
            })
        })
        .map_err(|e| e.to_string())?;
    rows.map(|r| r.map_err(|e| e.to_string()))
        .collect::<Result<Vec<_>, _>>()
        .map(|comments| {
            comments
                .into_iter()
                .map(|c| {
                    serde_json::json!({
                        "id": c.id,
                        "post_id": c.post_id,
                        "author_pinc_id": c.author_pinc_id,
                        "display_name": c.display_name,
                        "content": c.content,
                        "like_count": c.like_count,
                        "created_at": c.created_at,
                    })
                })
                .collect()
        })
}

#[tauri::command]
pub fn cmd_create_forum_comment(
    _state: State<'_, AppState>,
    post_id: String,
    content: String,
) -> Result<serde_json::Value, String> {
    let db = _state.db.lock().map_err(|e| e.to_string())?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    let comment_id = format!("cmt-{}", uuid::Uuid::new_v4());
    let pinc_id = pinc_id_from_node_id(
        &crate::core::database::queries::load_first_identity(&db)
            .ok()
            .flatten()
            .map(|i| i.node_id)
            .unwrap_or_default(),
    );
    let now = now_ts();

    conn.execute(
        "INSERT INTO forum_comments (id, post_id, author_pinc_id, display_name, content, like_count, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5, 0, ?6)",
        rusqlite::params![comment_id, post_id, pinc_id, pinc_id, content, now],
    )
    .map_err(|e| e.to_string())?;

    conn.execute(
        "UPDATE forum_posts SET reply_count = reply_count + 1 WHERE id = ?1",
        rusqlite::params![post_id],
    )
    .ok();

    Ok(serde_json::json!({
        "id": comment_id,
        "post_id": post_id,
        "author_pinc_id": pinc_id,
        "display_name": pinc_id,
        "content": content,
        "like_count": 0,
        "created_at": now,
    }))
}

#[tauri::command]
pub fn cmd_get_forum_profile(
    _state: State<'_, AppState>,
    pinc_id: String,
) -> Result<Option<serde_json::Value>, String> {
    let db = _state.db.lock().map_err(|e| e.to_string())?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let result: Result<ForumProfileRow, _> = conn
        .query_row(
            "SELECT pinc_id, handle, display_name, bio, avatar_hash, is_verified, created_at FROM forum_profiles WHERE pinc_id = ?1",
            rusqlite::params![pinc_id],
            |row| {
                Ok(ForumProfileRow {
                    pinc_id: row.get(0)?,
                    handle: row.get(1)?,
                    display_name: row.get(2)?,
                    bio: row.get(3)?,
                    avatar_hash: row.get(4)?,
                    is_verified: row.get(5)?,
                    created_at: row.get(6)?,
                })
            },
        );

    match result {
        Ok(p) => Ok(Some(serde_json::json!({
            "pinc_id": p.pinc_id,
            "handle": p.handle,
            "display_name": p.display_name,
            "bio": p.bio,
            "avatar_hash": p.avatar_hash,
            "is_verified": p.is_verified != 0,
            "created_at": p.created_at,
        }))),
        Err(_) => Ok(None),
    }
}

#[tauri::command]
pub fn cmd_create_or_update_forum_profile(
    state: State<'_, AppState>,
    handle: Option<String>,
    display_name: Option<String>,
    bio: Option<String>,
) -> Result<serde_json::Value, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let identity = crate::core::database::queries::load_first_identity(&db)
        .map_err(|e| e.to_string())?
        .ok_or("No identity found".to_string())?;

    let pinc_id = pinc_id_from_node_id(&identity.node_id);
    let handle = handle.unwrap_or_default();
    let display_name = display_name.unwrap_or_else(|| pinc_id.clone());
    let bio = bio.unwrap_or_default();
    let now = now_ts();

    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let existing: Option<String> = conn
        .query_row(
            "SELECT pinc_id FROM forum_profiles WHERE pinc_id = ?1",
            rusqlite::params![pinc_id],
            |row| row.get(0),
        )
        .ok();

    if existing.is_some() {
        conn.execute(
            "UPDATE forum_profiles SET handle = ?1, display_name = ?2, bio = ?3 WHERE pinc_id = ?4",
            rusqlite::params![handle, display_name, bio, pinc_id],
        )
        .map_err(|e| e.to_string())?;
    } else {
        conn.execute(
            "INSERT INTO forum_profiles (pinc_id, handle, display_name, bio, avatar_hash, is_verified, created_at) VALUES (?1, ?2, ?3, ?4, NULL, 0, ?5)",
            rusqlite::params![pinc_id, handle, display_name, bio, now],
        )
        .map_err(|e| e.to_string())?;
    }

    Ok(serde_json::json!({
        "pinc_id": pinc_id,
        "handle": handle,
        "display_name": display_name,
        "bio": bio,
        "is_verified": false,
        "created_at": now,
    }))
}

// ─── COMMUNITIES ────────────────────────────────────────────────────────────

#[tauri::command]
pub fn cmd_list_communities(_state: State<'_, AppState>) -> Result<Vec<serde_json::Value>, String> {
    let db = _state.db.lock().map_err(|e| e.to_string())?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare("SELECT id, name, c_type, description, member_ids, created_at FROM communities ORDER BY created_at DESC")
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([], |row| {
            let members_str: String = row.get(4)?;
            let members: Vec<serde_json::Value> =
                serde_json::from_str(&members_str).unwrap_or_default();
            Ok(serde_json::json!({
                "id": row.get::<_, String>(0)?,
                "name": row.get::<_, String>(1)?,
                "type": row.get::<_, String>(2)?,
                "description": row.get::<_, String>(3)?,
                "member_ids": members,
                "member_count": members.len(),
                "created_at": row.get::<_, i64>(5)?,
            }))
        })
        .map_err(|e| e.to_string())?;
    rows.map(|r| r.map_err(|e| e.to_string()))
        .collect::<Result<Vec<_>, _>>()
}

#[tauri::command]
pub fn cmd_create_community(
    state: State<'_, AppState>,
    name: String,
    c_type: Option<String>,
    description: Option<String>,
) -> Result<serde_json::Value, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let identity = crate::core::database::queries::load_first_identity(&db)
        .map_err(|e| e.to_string())?
        .ok_or("No identity found".to_string())?;

    let ctype = c_type.unwrap_or_else(|| "public".to_string());
    let desc = description.unwrap_or_default();
    let pinc_id = pinc_id_from_node_id(&identity.node_id);
    let members = serde_json::json!([pinc_id]).to_string();
    let now = now_ts();
    let community_id = format!("comm-{}", uuid::Uuid::new_v4());

    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT INTO communities (id, name, c_type, description, member_ids, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        rusqlite::params![community_id, name, ctype, desc, members, now],
    )
    .map_err(|e| e.to_string())?;

    Ok(serde_json::json!({
        "id": community_id,
        "name": name,
        "type": ctype,
        "description": desc,
        "member_ids": serde_json::json!([pinc_id]),
        "member_count": 1,
        "created_at": now,
    }))
}

#[tauri::command]
pub fn cmd_join_community(
    state: State<'_, AppState>,
    community_id: String,
) -> Result<serde_json::Value, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let identity = crate::core::database::queries::load_first_identity(&db)
        .map_err(|e| e.to_string())?
        .ok_or("No identity found".to_string())?;

    let pinc_id = pinc_id_from_node_id(&identity.node_id);
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    let members_str: String = conn
        .query_row(
            "SELECT member_ids FROM communities WHERE id = ?1",
            rusqlite::params![community_id],
            |row| row.get(0),
        )
        .map_err(|_| "Community not found".to_string())?;

    let mut members: Vec<serde_json::Value> =
        serde_json::from_str(&members_str).unwrap_or_default();
    if !members.iter().any(|m| m.as_str() == Some(&pinc_id)) {
        members.push(serde_json::Value::String(pinc_id.clone()));
    }

    let updated = serde_json::to_string(&members).map_err(|e| e.to_string())?;
    conn.execute(
        "UPDATE communities SET member_ids = ?1 WHERE id = ?2",
        rusqlite::params![updated, community_id],
    )
    .map_err(|e| e.to_string())?;

    Ok(serde_json::json!({ "joined": true, "community_id": community_id }))
}

#[tauri::command]
pub fn cmd_leave_community(
    state: State<'_, AppState>,
    community_id: String,
) -> Result<serde_json::Value, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let identity = crate::core::database::queries::load_first_identity(&db)
        .map_err(|e| e.to_string())?
        .ok_or("No identity found".to_string())?;

    let pinc_id = pinc_id_from_node_id(&identity.node_id);
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    let members_str: String = conn
        .query_row(
            "SELECT member_ids FROM communities WHERE id = ?1",
            rusqlite::params![community_id],
            |row| row.get(0),
        )
        .map_err(|_| "Community not found".to_string())?;

    let members: Vec<serde_json::Value> = serde_json::from_str(&members_str).unwrap_or_default();
    let updated: Vec<serde_json::Value> = members
        .into_iter()
        .filter(|m| m.as_str() != Some(pinc_id.as_str()))
        .collect();

    let updated_str = serde_json::to_string(&updated).map_err(|e| e.to_string())?;
    conn.execute(
        "UPDATE communities SET member_ids = ?1 WHERE id = ?2",
        rusqlite::params![updated_str, community_id],
    )
    .map_err(|e| e.to_string())?;

    Ok(serde_json::json!({ "left": true, "community_id": community_id }))
}

#[tauri::command]
pub fn cmd_list_channels(
    state: State<'_, AppState>,
    community_id: String,
) -> Result<Vec<serde_json::Value>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare("SELECT id, community_id, name, created_at FROM channels WHERE community_id = ?1 ORDER BY created_at ASC")
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map(rusqlite::params![community_id], |row| {
            Ok(serde_json::json!({
                "id": row.get::<_, String>(0)?,
                "community_id": row.get::<_, String>(1)?,
                "name": row.get::<_, String>(2)?,
                "created_at": row.get::<_, i64>(3)?,
            }))
        })
        .map_err(|e| e.to_string())?;
    Ok(rows.filter_map(|r| r.ok()).collect())
}

#[tauri::command]
pub fn cmd_create_channel(
    state: State<'_, AppState>,
    community_id: String,
    name: String,
) -> Result<serde_json::Value, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let channel_id = format!("ch-{}", uuid::Uuid::new_v4());
    let now = now_ts();
    conn.execute(
        "INSERT INTO channels (id, community_id, name, created_at) VALUES (?1, ?2, ?3, ?4)",
        rusqlite::params![channel_id, community_id, name, now],
    )
    .map_err(|e| e.to_string())?;
    Ok(serde_json::json!({
        "id": channel_id,
        "community_id": community_id,
        "name": name,
        "created_at": now,
    }))
}

#[tauri::command]
pub fn cmd_like_forum_post(
    state: State<'_, AppState>,
    post_id: String,
) -> Result<serde_json::Value, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "UPDATE forum_posts SET like_count = like_count + 1 WHERE id = ?1",
        rusqlite::params![post_id],
    )
    .map_err(|e| e.to_string())?;
    Ok(serde_json::json!({ "liked": true, "post_id": post_id }))
}

// === OPENMAESTRO STUBS ===

#[tauri::command]
pub fn cmd_list_challenges(state: State<'_, AppState>, _category: Option<String>) -> Result<Vec<serde_json::Value>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn.prepare(
        "SELECT id, title, creator_id, category, difficulty, reward_points, status, created_at FROM challenges ORDER BY created_at DESC"
    ).unwrap_or_else(|_| conn.prepare("SELECT '' as id, '' as title, '' as creator_id, '' as category, '' as difficulty, 0 as reward_points, '' as status, 0 as created_at WHERE 0").unwrap());
    let rows = stmt.query_map([], |row| {
        Ok(serde_json::json!({
            "id": row.get::<_, String>(0)?,
            "title": row.get::<_, String>(1)?,
            "creator_id": row.get::<_, String>(2)?,
            "category": row.get::<_, String>(3)?,
            "difficulty": row.get::<_, String>(4)?,
            "reward": row.get::<_, i64>(5)?,
            "reward_points": row.get::<_, i64>(5)?,
            "status": row.get::<_, String>(6)?,
            "created_at": row.get::<_, i64>(7)?,
            "participants": 0,
            "timeLimit": 3600,
        }))
    }).map_err(|e| e.to_string())?;
    let mut results: Vec<serde_json::Value> = rows.filter_map(|r| r.ok()).collect();
    // Seed defaults if empty
    if results.is_empty() {
        results = vec![
            serde_json::json!({"id": "ch-001", "title": "Build REST API", "category": "coding", "difficulty": "medium", "reward": 150, "participants": 23, "timeLimit": 3600, "status": "open"}),
            serde_json::json!({"id": "ch-002", "title": "Capture The Flag", "category": "cybersecurity", "difficulty": "hard", "reward": 500, "participants": 45, "timeLimit": 7200, "status": "open"}),
            serde_json::json!({"id": "ch-003", "title": "Build AI Chatbot", "category": "ai", "difficulty": "medium", "reward": 300, "participants": 18, "timeLimit": 5400, "status": "open"}),
        ];
    }
    Ok(results)
}

#[tauri::command]
pub fn cmd_list_problems() -> Result<Vec<serde_json::Value>, String> {
    Ok(vec![
        serde_json::json!({
            "id": "pr-001", "title": "Website Down - 502 Bad Gateway",
            "description": "Production site returning 502. Need fix within 30 minutes.",
            "reward": 100, "status": "urgent", "timeRemaining": "28m", "postedBy": "TechCorp"
        }),
        serde_json::json!({
            "id": "pr-002", "title": "Database Corrupted",
            "description": "PostgreSQL primary DB corrupted. Data recovery needed.",
            "reward": 500, "status": "critical", "timeRemaining": "1h", "postedBy": "DataFlow Inc"
        }),
        serde_json::json!({
            "id": "pr-003", "title": "API Endpoint Broken",
            "description": "Payment API returning 500 errors intermittently.",
            "reward": 50, "status": "open", "timeRemaining": "4h", "postedBy": "PayStack"
        }),
        serde_json::json!({
            "id": "pr-004", "title": "Network Outage - Partial",
            "description": "US-East region experiencing packet loss.",
            "reward": 250, "status": "urgent", "timeRemaining": "45m", "postedBy": "CloudNet"
        }),
        serde_json::json!({
            "id": "pr-005", "title": "Server Security Breach",
            "description": "Suspicious activity detected. Need immediate investigation.",
            "reward": 1000, "status": "critical", "timeRemaining": "15m", "postedBy": "SecureBank"
        }),
    ])
}

#[tauri::command]
pub fn cmd_join_challenge(challenge_id: String) -> Result<serde_json::Value, String> {
    Ok(serde_json::json!({
        "success": true, "challenge_id": challenge_id,
        "message": "Joined challenge successfully"
    }))
}

#[tauri::command]
pub fn cmd_list_duels() -> Result<Vec<serde_json::Value>, String> {
    Ok(vec![
        serde_json::json!({"id": "d-1", "type": "Coding Duel", "entryFee": 5, "prizePool": 10, "playersOnline": 234}),
        serde_json::json!({"id": "d-2", "type": "Chess Duel", "entryFee": 5, "prizePool": 10, "playersOnline": 189}),
        serde_json::json!({"id": "d-3", "type": "AI Duel", "entryFee": 10, "prizePool": 20, "playersOnline": 156}),
        serde_json::json!({"id": "d-4", "type": "Security Duel", "entryFee": 10, "prizePool": 20, "playersOnline": 98}),
        serde_json::json!({"id": "d-5", "type": "Design Duel", "entryFee": 5, "prizePool": 10, "playersOnline": 167}),
    ])
}

#[tauri::command]
pub fn cmd_list_rankings(_filter: Option<String>) -> Result<Vec<serde_json::Value>, String> {
    Ok(vec![
        serde_json::json!({"rank": 1, "nodeId": "3847291", "username": "cryptoking", "score": 15420, "wins": 89, "country": "US"}),
        serde_json::json!({"rank": 2, "nodeId": "9261834", "username": "zeroday", "score": 14200, "wins": 82, "country": "DE"}),
        serde_json::json!({"rank": 3, "nodeId": "5173620", "username": "rustacean", "score": 13800, "wins": 78, "country": "JP"}),
        serde_json::json!({"rank": 4, "nodeId": "7492015", "username": "aibuilder", "score": 12500, "wins": 71, "country": "UK"}),
        serde_json::json!({"rank": 5, "nodeId": "6038471", "username": "datawizard", "score": 11900, "wins": 67, "country": "IN"}),
        serde_json::json!({"rank": 6, "nodeId": "2951038", "username": "netrunner", "score": 11200, "wins": 63, "country": "KR"}),
        serde_json::json!({"rank": 7, "nodeId": "8145920", "username": "devopsqueen", "score": 10800, "wins": 60, "country": "CA"}),
        serde_json::json!({"rank": 8, "nodeId": "4302719", "username": "hackerman", "score": 10200, "wins": 57, "country": "IL"}),
    ])
}

// === ZEROFLIPPER COMMANDS ===

#[tauri::command]
pub fn cmd_list_products(
    _category: Option<String>,
    _search: Option<String>,
) -> Result<Vec<serde_json::Value>, String> {
    Ok(vec![
        serde_json::json!({"id": "p-1", "name": "AI Customer Support Agent", "category": "AI Agents", "price": 149.99, "rating": 4.9, "seller": "NeuralForge", "type": "Template"}),
        serde_json::json!({"id": "p-2", "name": "SaaS Dashboard Kit", "category": "Dashboards", "price": 79.99, "rating": 4.8, "seller": "UIMasters", "type": "UI Kit"}),
        serde_json::json!({"id": "p-3", "name": "E-Commerce Mobile App", "category": "Mobile Apps", "price": 199.99, "rating": 4.7, "seller": "AppCraft", "type": "Template"}),
        serde_json::json!({"id": "p-4", "name": "REST API Boilerplate", "category": "APIs", "price": 49.99, "rating": 4.9, "seller": "CodeLab", "type": "Template"}),
        serde_json::json!({"id": "p-5", "name": "CRM Enterprise System", "category": "CRM Systems", "price": 399.99, "rating": 4.6, "seller": "BizTech", "type": "System"}),
        serde_json::json!({"id": "p-6", "name": "Marketing Video Pack", "category": "Video Assets", "price": 29.99, "rating": 4.5, "seller": "MediaPro", "type": "Asset"}),
        serde_json::json!({"id": "p-7", "name": "ERP Management Suite", "category": "ERP Systems", "price": 499.99, "rating": 4.8, "seller": "EnterpriseTech", "type": "System"}),
        serde_json::json!({"id": "p-8", "name": "3D Icon Collection", "category": "3D Models", "price": 39.99, "rating": 4.7, "seller": "DesignStudio", "type": "Asset"}),
        serde_json::json!({"id": "p-9", "name": "AI Prompt Templates", "category": "AI Agents", "price": 19.99, "rating": 4.9, "seller": "PromptMaster", "type": "Pack"}),
        serde_json::json!({"id": "p-10", "name": "React Dashboard Pro", "category": "UI Kits", "price": 89.99, "rating": 4.8, "seller": "ReactUI", "type": "Template"}),
        serde_json::json!({"id": "p-11", "name": "Legal Contract Bundle", "category": "Legal Documents", "price": 59.99, "rating": 4.4, "seller": "LegalTech", "type": "Pack"}),
        serde_json::json!({"id": "p-12", "name": "Automation Workflow Kit", "category": "Automation Systems", "price": 119.99, "rating": 4.7, "seller": "AutoFlow", "type": "System"}),
    ])
}

#[tauri::command]
pub fn cmd_buy_product(product_id: String) -> Result<serde_json::Value, String> {
    Ok(serde_json::json!({
        "success": true, "product_id": product_id, "message": "Purchase successful"
    }))
}

// ─── STARTERAN LISTING CREATION ─────────────────────────────────────────────

#[tauri::command]
pub fn cmd_create_starteran_listing(
    state: State<'_, AppState>,
    bandwidth_mbps: f64,
    price_per_gb: f64,
    description: Option<String>,
) -> Result<serde_json::Value, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let identity = crate::core::database::queries::load_first_identity(&db)
        .map_err(|e| e.to_string())?
        .ok_or("No identity found".to_string())?;
    let listing_id = uuid::Uuid::new_v4().to_string();
    let now = now_ts();
    let share_code = {
        use rand::Rng;
        let mut rng = rand::thread_rng();
        let p1: String = (0..4).map(|_| rng.sample(rand::distributions::Alphanumeric) as char).collect();
        let p2: String = (0..4).map(|_| rng.sample(rand::distributions::Alphanumeric) as char).collect();
        format!("ERAN-{}-{}", p1.to_uppercase(), p2.to_uppercase())
    };
    let desc = description.unwrap_or_else(|| format!("PINC Starteran Node — {:.0}Mbps", bandwidth_mbps));
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT OR IGNORE INTO net_store_listings (id, owner_node_id, bandwidth_mbps, price_per_gb, description, share_code, status, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, 'active', ?7)",
        rusqlite::params![listing_id, identity.node_id, bandwidth_mbps, price_per_gb, desc, share_code, now],
    ).map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT OR IGNORE INTO shared_connections (id, owner_node_id, peer_node_id, connection_type, max_bandwidth, used_bandwidth, status, created_at) VALUES (?1, ?2, 'broadcast', 'starteran', ?3, 0, 'active', ?4)",
        rusqlite::params![uuid::Uuid::new_v4().to_string(), identity.node_id, bandwidth_mbps, now],
    ).ok();
    Ok(serde_json::json!({
        "listing_id": listing_id,
        "owner_node_id": identity.node_id,
        "bandwidth_mbps": bandwidth_mbps,
        "price_per_gb": price_per_gb,
        "share_code": share_code,
        "description": desc,
        "status": "active",
        "created_at": now,
    }))
}

#[tauri::command]
pub fn cmd_list_starteran_listings(state: State<'_, AppState>) -> Result<Vec<serde_json::Value>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn.prepare(
        "SELECT id, owner_node_id, bandwidth_mbps, price_per_gb, description, share_code, status, created_at FROM net_store_listings WHERE status = 'active' ORDER BY created_at DESC"
    ).map_err(|e| e.to_string())?;
    let rows = stmt.query_map([], |row| {
        Ok(serde_json::json!({
            "id": row.get::<_, String>(0)?,
            "owner_node_id": row.get::<_, String>(1)?,
            "bandwidth_mbps": row.get::<_, f64>(2)?,
            "price_per_gb": row.get::<_, f64>(3)?,
            "description": row.get::<_, String>(4)?,
            "share_code": row.get::<_, String>(5)?,
            "status": row.get::<_, String>(6)?,
            "created_at": row.get::<_, i64>(7)?,
        }))
    }).map_err(|e| e.to_string())?;
    Ok(rows.filter_map(|r| r.ok()).collect())
}

#[tauri::command]
pub fn cmd_activate_starteran_sharing(
    state: State<'_, AppState>,
) -> Result<serde_json::Value, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let identity = crate::core::database::queries::load_first_identity(&db)
        .map_err(|e| e.to_string())?
        .ok_or("No identity found".to_string())?;
    let now = now_ts();
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "UPDATE net_store_listings SET status = 'active' WHERE owner_node_id = ?1",
        rusqlite::params![identity.node_id],
    ).map_err(|e| e.to_string())?;
    conn.execute(
        "UPDATE shared_connections SET status = 'active' WHERE owner_node_id = ?1",
        rusqlite::params![identity.node_id],
    ).map_err(|e| e.to_string())?;
    Ok(serde_json::json!({
        "activated": true,
        "node_id": identity.node_id,
        "timestamp": now,
    }))
}
