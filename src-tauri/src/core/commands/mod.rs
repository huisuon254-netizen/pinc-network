use crate::commands::AppState;
use std::fs;
use std::process::Command;
use tauri::State;

#[tauri::command]
pub fn cmd_get_starteran_status(_state: State<'_, AppState>) -> Result<serde_json::Value, String> {
    Ok(serde_json::json!({
        "sharing_active": false,
        "active_connections": 0,
        "traffic_shared_gb": 0.0,
        "earnings": 0.0,
        "reliability_score": 0.0,
        "approval_level": "none",
    }))
}

#[tauri::command]
pub fn cmd_get_rentbit_status(_state: State<'_, AppState>) -> Result<serde_json::Value, String> {
    Ok(serde_json::json!({
        "active_rentals": 0,
        "cpu_usage": 0.0,
        "ram_usage": 0.0,
        "storage_usage": 0.0,
        "earnings": 0.0,
        "host_rating": 0.0,
        "qualified": false,
    }))
}

#[tauri::command]
pub fn cmd_run_device_scan(_state: State<'_, AppState>) -> Result<serde_json::Value, String> {
    let cpu_cores = num_cpus::get();
    let cpu_speed_ghz = get_cpu_speed_ghz();
    let ram_gb = get_ram_gb();
    let (storage_gb, storage_used_pct) = get_storage_info();
    let network_mbps = 0; // Speed test would be separate
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

fn get_cpu_speed_ghz() -> f64 {
    fs::read_to_string("/proc/cpuinfo")
        .ok()
        .and_then(|s| {
            s.lines()
                .find(|l| l.starts_with("cpu MHz"))
                .and_then(|l| l.split(':').nth(1))
                .and_then(|v| v.trim().parse::<f64>().ok())
        })
        .map(|mhz| mhz / 1000.0)
        .unwrap_or(0.0)
}

fn get_ram_gb() -> u64 {
    fs::read_to_string("/proc/meminfo")
        .ok()
        .and_then(|s| {
            s.lines()
                .find(|l| l.starts_with("MemTotal"))
                .and_then(|l| l.split_whitespace().nth(1))
                .and_then(|v| v.parse::<u64>().ok())
        })
        .map(|kb| kb / 1048576)
        .unwrap_or(0)
}

fn get_storage_info() -> (u64, u64) {
    Command::new("df")
        .args(["-B1", "/"])
        .output()
        .ok()
        .and_then(|o| String::from_utf8(o.stdout).ok())
        .map(|s| {
            let mut lines = s.lines();
            lines.next(); // skip header
            if let Some(line) = lines.next() {
                let parts: Vec<&str> = line.split_whitespace().collect();
                if parts.len() >= 5 {
                    let total: u64 = parts[1].parse().unwrap_or(0);
                    let used: u64 = parts[2].parse().unwrap_or(0);
                    let pct = if total > 0 {
                        (used as f64 / total as f64 * 100.0) as u64
                    } else {
                        0
                    };
                    return (total / 1_073_741_824, pct);
                }
            }
            (0u64, 0u64)
        })
        .unwrap_or((0, 0))
}

fn get_uptime_hours() -> u64 {
    fs::read_to_string("/proc/uptime")
        .ok()
        .and_then(|s| s.split_whitespace().next()?.parse::<f64>().ok())
        .map(|secs| (secs / 3600.0) as u64)
        .unwrap_or(0)
}

fn get_security_status() -> String {
    // Check basic entropy
    let entropy_ok = fs::read_to_string("/proc/sys/kernel/random/uuid").is_ok();
    // Check firewall
    let firewall_ok = Command::new("sh")
        .args(["-c", "iptables -L -n 2>/dev/null | head -1"])
        .output()
        .ok()
        .and_then(|o| String::from_utf8(o.stdout).ok())
        .map(|s| !s.is_empty())
        .unwrap_or(false);

    if entropy_ok && firewall_ok {
        "ok".to_string()
    } else {
        let mut warnings = Vec::new();
        if !entropy_ok {
            warnings.push("entropy source unavailable");
        }
        if !firewall_ok {
            warnings.push("firewall not detected");
        }
        format!("warning: {}", warnings.join(", "))
    }
}

#[tauri::command]
pub fn cmd_get_conversations(
    _state: State<'_, AppState>,
) -> Result<Vec<serde_json::Value>, String> {
    Ok(vec![])
}

#[tauri::command]
pub fn cmd_get_call_history(_state: State<'_, AppState>) -> Result<Vec<serde_json::Value>, String> {
    Ok(vec![])
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
pub fn cmd_get_jobs(_state: State<'_, AppState>) -> Result<Vec<serde_json::Value>, String> {
    Ok(vec![])
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
pub fn cmd_jobs_create_job(
    _state: State<'_, AppState>,
    title: String,
    category: String,
    subcategory: String,
    budget_min: f64,
    budget_max: f64,
    skills: Vec<String>,
    description: String,
    deadline: String,
) -> Result<serde_json::Value, String> {
    let job_id = uuid::Uuid::new_v4().to_string();
    log::info!(
        "Job posted: {} ({}/{}) [{:.0}-{:.0} PINC]",
        title,
        category,
        subcategory,
        budget_min,
        budget_max
    );
    log::info!("Skills: {:?}, Deadline: {}", skills, deadline);
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
    _state: State<'_, AppState>,
    title: String,
    category: String,
    difficulty: String,
    _reward_points: u32,
    _description: String,
) -> Result<serde_json::Value, String> {
    let challenge_id = uuid::Uuid::new_v4().to_string();
    log::info!("Challenge created: {} ({}/{})", title, category, difficulty);
    Ok(serde_json::json!({ "challenge_id": challenge_id, "status": "open" }))
}

// ─── CONTACTS ───────────────────────────────────────────────────────────────

#[tauri::command]
pub fn cmd_add_contact(
    state: State<'_, AppState>,
    contact_node_id: String,
    nickname: String,
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

    let contact = crate::core::database::queries::insert_contact(
        &db,
        &identity.node_id,
        &contact_node_id,
        &contact_username,
        &nickname,
    )
    .map_err(|e| e.to_string())?;

    Ok(serde_json::json!({
        "id": contact.id,
        "contact_node_id": contact.contact_node_id,
        "contact_username": contact.contact_username,
        "nickname": contact.nickname,
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
                i.node_id.clone()
            } else {
                i.username.clone()
            };
            serde_json::json!({
                "node_id": i.node_id,
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

// === OPENMAESTRO COMMANDS ===

#[tauri::command]
pub fn cmd_list_challenges(_category: Option<String>) -> Result<Vec<serde_json::Value>, String> {
    // Return mock challenges for now
    Ok(vec![
        serde_json::json!({
            "id": "ch-001", "title": "Build REST API", "category": "coding",
            "difficulty": "medium", "reward": 150, "participants": 23, "timeLimit": 3600, "status": "open"
        }),
        serde_json::json!({
            "id": "ch-002", "title": "Capture The Flag", "category": "cybersecurity",
            "difficulty": "hard", "reward": 500, "participants": 45, "timeLimit": 7200, "status": "open"
        }),
        serde_json::json!({
            "id": "ch-003", "title": "Build AI Chatbot", "category": "ai",
            "difficulty": "medium", "reward": 300, "participants": 18, "timeLimit": 5400, "status": "open"
        }),
        serde_json::json!({
            "id": "ch-004", "title": "Logo Design Sprint", "category": "design",
            "difficulty": "easy", "reward": 75, "participants": 34, "timeLimit": 1800, "status": "open"
        }),
        serde_json::json!({
            "id": "ch-005", "title": "Data Pipeline Optimization", "category": "data",
            "difficulty": "hard", "reward": 400, "participants": 12, "timeLimit": 4800, "status": "open"
        }),
        serde_json::json!({
            "id": "ch-006", "title": "Kubernetes Cluster Recovery", "category": "infrastructure",
            "difficulty": "hard", "reward": 750, "participants": 8, "timeLimit": 1800, "status": "open"
        }),
    ])
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
