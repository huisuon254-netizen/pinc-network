use serde::{Serialize, Deserialize};

// ─── AUTH ───────────────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AdminIdentity {
    pub id: String,
    pub username: String,
    pub role: String,
    pub permissions: String,
}

#[tauri::command]
pub fn cmd_admin_login(username: String, password: String) -> Result<AdminIdentity, String> {
    if username == "admin" && password == "admin" {
        Ok(AdminIdentity {
            id: "admin-001".to_string(),
            username: "admin".to_string(),
            role: "super_admin".to_string(),
            permissions: "all".to_string(),
        })
    } else if username == "owner" && password == "owner" {
        Ok(AdminIdentity {
            id: "owner-001".to_string(),
            username: "owner".to_string(),
            role: "owner".to_string(),
            permissions: "all".to_string(),
        })
    } else {
        Err("Invalid credentials".to_string())
    }
}

// ─── PLATFORM STATS ────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PlatformStats {
    pub total_users: u64,
    pub online_users: u64,
    pub active_sessions: u64,
    pub new_users_today: u64,
    pub total_wallet_value: f64,
    pub total_sarai_volume: f64,
    pub active_games: u64,
    pub active_challenges: u64,
    pub active_jobs: u64,
    pub active_servers: u64,
    pub active_nodes: u64,
    pub active_bandwidth_providers: u64,
}

#[tauri::command]
pub fn cmd_admin_platform_stats() -> Result<PlatformStats, String> {
    Ok(PlatformStats {
        total_users: 12847,
        online_users: 1243,
        active_sessions: 3456,
        new_users_today: 89,
        total_wallet_value: 2_847_392.50,
        total_sarai_volume: 1_234_567.80,
        active_games: 47,
        active_challenges: 12,
        active_jobs: 156,
        active_servers: 89,
        active_nodes: 342,
        active_bandwidth_providers: 215,
    })
}

// ─── NODES ──────────────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NodeInfo {
    pub id: String,
    pub address: String,
    pub status: String,
    pub cpu_usage: f64,
    pub ram_usage: f64,
    pub bandwidth_mbps: f64,
    pub trust_score: f64,
    pub last_seen: i64,
    pub online: bool,
}

#[tauri::command]
pub fn cmd_admin_list_nodes() -> Result<Vec<NodeInfo>, String> {
    let now = std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap_or_default().as_secs() as i64;
    Ok(vec![
        NodeInfo { id: "node-001".into(), address: "192.168.1.100:14029".into(), status: "online".into(), cpu_usage: 45.2, ram_usage: 62.1, bandwidth_mbps: 150.0, trust_score: 9.2, last_seen: now, online: true },
        NodeInfo { id: "node-002".into(), address: "10.0.0.55:14029".into(), status: "online".into(), cpu_usage: 23.8, ram_usage: 41.5, bandwidth_mbps: 200.0, trust_score: 8.7, last_seen: now, online: true },
        NodeInfo { id: "node-003".into(), address: "172.16.0.10:14029".into(), status: "offline".into(), cpu_usage: 0.0, ram_usage: 0.0, bandwidth_mbps: 0.0, trust_score: 7.5, last_seen: now - 3600, online: false },
        NodeInfo { id: "node-004".into(), address: "192.168.2.200:14029".into(), status: "online".into(), cpu_usage: 78.3, ram_usage: 85.2, bandwidth_mbps: 100.0, trust_score: 9.5, last_seen: now, online: true },
        NodeInfo { id: "node-005".into(), address: "10.1.1.10:14029".into(), status: "online".into(), cpu_usage: 12.1, ram_usage: 33.4, bandwidth_mbps: 300.0, trust_score: 9.8, last_seen: now, online: true },
    ])
}

// ─── SERVERS ────────────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ServerInfo {
    pub id: String,
    pub owner_id: String,
    pub tier: String,
    pub status: String,
    pub cpu_usage: f64,
    pub ram_usage: f64,
    pub storage_usage: f64,
    pub uptime_pct: f64,
    pub revenue: f64,
    pub health: String,
}

#[tauri::command]
pub fn cmd_admin_list_servers() -> Result<Vec<ServerInfo>, String> {
    Ok(vec![
        ServerInfo { id: "srv-001".into(), owner_id: "node-001".into(), tier: "premium".into(), status: "active".into(), cpu_usage: 52.3, ram_usage: 68.1, storage_usage: 45.0, uptime_pct: 99.9, revenue: 1247.50, health: "green".into() },
        ServerInfo { id: "srv-002".into(), owner_id: "node-002".into(), tier: "standard".into(), status: "active".into(), cpu_usage: 34.7, ram_usage: 55.2, storage_usage: 72.0, uptime_pct: 98.5, revenue: 823.20, health: "green".into() },
        ServerInfo { id: "srv-003".into(), owner_id: "node-004".into(), tier: "enterprise".into(), status: "active".into(), cpu_usage: 89.1, ram_usage: 92.3, storage_usage: 88.5, uptime_pct: 99.2, revenue: 3456.80, health: "yellow".into() },
        ServerInfo { id: "srv-004".into(), owner_id: "node-005".into(), tier: "standard".into(), status: "maintenance".into(), cpu_usage: 5.0, ram_usage: 12.0, storage_usage: 30.0, uptime_pct: 95.0, revenue: 412.00, health: "red".into() },
    ])
}

// ─── WALLET STATS ──────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WalletStats {
    pub total_deposits: f64,
    pub total_withdrawals: f64,
    pub daily_volume: f64,
    pub monthly_volume: f64,
    pub fee_revenue: f64,
}

#[tauri::command]
pub fn cmd_admin_wallet_stats() -> Result<WalletStats, String> {
    Ok(WalletStats {
        total_deposits: 4_521_300.00,
        total_withdrawals: 2_847_200.00,
        daily_volume: 156_780.00,
        monthly_volume: 4_234_567.00,
        fee_revenue: 234_567.80,
    })
}

// ─── TRAFFIC STATS ─────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TrafficStats {
    pub messages_per_minute: u64,
    pub voice_calls_active: u64,
    pub video_calls_active: u64,
    pub file_transfers_active: u64,
    pub total_data_usage_gb: f64,
    pub regional_load: std::collections::HashMap<String, f64>,
    pub global_load: f64,
}

#[tauri::command]
pub fn cmd_admin_traffic_stats() -> Result<TrafficStats, String> {
    let mut regional = std::collections::HashMap::new();
    regional.insert("North America".into(), 67.3);
    regional.insert("Europe".into(), 54.8);
    regional.insert("Asia".into(), 72.1);
    regional.insert("South America".into(), 34.5);
    regional.insert("Africa".into(), 22.1);
    regional.insert("Oceania".into(), 41.2);
    Ok(TrafficStats {
        messages_per_minute: 1247,
        voice_calls_active: 23,
        video_calls_active: 8,
        file_transfers_active: 15,
        total_data_usage_gb: 2431.7,
        regional_load: regional,
        global_load: 52.4,
    })
}

// ─── GAME STATS ────────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TopPlayer {
    pub node_id: String,
    pub score: u64,
    pub wins: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GameStats {
    pub games_running: u64,
    pub players_online: u64,
    pub current_matches: u64,
    pub top_players: Vec<TopPlayer>,
    pub tournaments_active: u64,
}

#[tauri::command]
pub fn cmd_admin_game_stats() -> Result<GameStats, String> {
    Ok(GameStats {
        games_running: 47,
        players_online: 312,
        current_matches: 23,
        top_players: vec![
            TopPlayer { node_id: "3847291".into(), score: 15420, wins: 89 },
            TopPlayer { node_id: "7291045".into(), score: 14200, wins: 82 },
            TopPlayer { node_id: "5163827".into(), score: 13800, wins: 78 },
            TopPlayer { node_id: "9204716".into(), score: 12500, wins: 71 },
            TopPlayer { node_id: "6438291".into(), score: 11200, wins: 65 },
        ],
        tournaments_active: 3,
    })
}

// ─── SECURITY EVENTS ───────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SecurityEvent {
    pub id: String,
    pub event_type: String,
    pub description: String,
    pub severity: String,
    pub timestamp: i64,
}

#[tauri::command]
pub fn cmd_admin_security_events() -> Result<Vec<SecurityEvent>, String> {
    let now = std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap_or_default().as_secs() as i64;
    Ok(vec![
        SecurityEvent { id: "evt-001".into(), event_type: "failed_login".into(), description: "Multiple failed login attempts from IP 203.0.113.42".into(), severity: "high".into(), timestamp: now - 300 },
        SecurityEvent { id: "evt-002".into(), event_type: "bot_detected".into(), description: "Automated bot activity detected on node 8472910".into(), severity: "critical".into(), timestamp: now - 600 },
        SecurityEvent { id: "evt-003".into(), event_type: "suspicious_transfer".into(), description: "Unusual transfer pattern from wallet 3847291".into(), severity: "medium".into(), timestamp: now - 1200 },
        SecurityEvent { id: "evt-004".into(), event_type: "failed_recovery".into(), description: "Failed identity recovery attempt for node 5163827".into(), severity: "high".into(), timestamp: now - 1800 },
        SecurityEvent { id: "evt-005".into(), event_type: "spam_network".into(), description: "Coordinated spam activity from 3 nodes".into(), severity: "medium".into(), timestamp: now - 2400 },
    ])
}

// ─── ADMIN ACTIONS ─────────────────────────────────────────────────────────

#[tauri::command]
pub fn cmd_admin_freeze_identity(node_id: String) -> Result<serde_json::Value, String> {
    log::warn!("ADMIN: Freezing identity {}", node_id);
    Ok(serde_json::json!({ "frozen": true, "node_id": node_id }))
}

#[tauri::command]
pub fn cmd_admin_suspend_user(node_id: String) -> Result<serde_json::Value, String> {
    log::warn!("ADMIN: Suspending user {}", node_id);
    Ok(serde_json::json!({ "suspended": true, "node_id": node_id }))
}

#[tauri::command]
pub fn cmd_admin_send_notification(title: String, message: String, target: String) -> Result<serde_json::Value, String> {
    log::info!("ADMIN: Sending notification '{}' to {}", title, target);
    Ok(serde_json::json!({ "sent": true, "title": title, "target": target }))
}

#[tauri::command]
pub fn cmd_admin_toggle_feature(feature_id: String, enabled: bool) -> Result<serde_json::Value, String> {
    log::info!("ADMIN: Feature {} set to {}", feature_id, enabled);
    Ok(serde_json::json!({ "feature": feature_id, "enabled": enabled }))
}

#[tauri::command]
pub fn cmd_admin_set_fees(platform_fee: f64, escrow_fee: f64, listing_fee: f64) -> Result<serde_json::Value, String> {
    log::info!("ADMIN: Fees updated — platform: {}%, escrow: {}%, listing: {}%", platform_fee, escrow_fee, listing_fee);
    Ok(serde_json::json!({ "updated": true }))
}
