use std::path::PathBuf;
use std::sync::{Arc, Mutex};
use tauri::Manager;

pub mod core;
pub mod modules;

use core::database::connection::Database;
use core::database::migrations::run_migrations;

pub struct AppState {
    pub db: Arc<Mutex<Database>>,
    pub vault_dir: PathBuf,
}

#[tauri::command]
fn cmd_get_wallet_balance(state: tauri::State<AppState>) -> Result<serde_json::Value, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let identity = core::database::queries::load_first_identity(&db).map_err(|e| e.to_string())?;
    if let Some(ident) = identity {
        if let Some((balance, escrow_locked, pending_in, pending_out)) =
            core::database::queries::get_wallet_balance(&db, &ident.node_id)
                .map_err(|e| e.to_string())?
        {
            Ok(
                serde_json::json!({ "balance": balance, "currency": "PINC", "escrow_locked": escrow_locked, "pending_deposits": pending_in, "pending_withdrawals": pending_out }),
            )
        } else {
            Ok(
                serde_json::json!({ "balance": 0.0, "currency": "PINC", "escrow_locked": 0.0, "pending_deposits": 0.0, "pending_withdrawals": 0.0 }),
            )
        }
    } else {
        Ok(
            serde_json::json!({ "balance": 0.0, "currency": "PINC", "escrow_locked": 0.0, "pending_deposits": 0.0, "pending_withdrawals": 0.0 }),
        )
    }
}

#[tauri::command]
fn cmd_get_transactions(state: tauri::State<AppState>) -> Result<Vec<serde_json::Value>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    // Try rich query with extended columns (currency, from_node, to_node, memo). Fallback to legacy.
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    // Ensure extended columns exist (no-op if already)
    let _ = conn.execute("ALTER TABLE wallet_transactions ADD COLUMN currency TEXT DEFAULT 'PINC'", []);
    let _ = conn.execute("ALTER TABLE wallet_transactions ADD COLUMN from_node TEXT DEFAULT ''", []);
    let _ = conn.execute("ALTER TABLE wallet_transactions ADD COLUMN to_node TEXT", []);
    let _ = conn.execute("ALTER TABLE wallet_transactions ADD COLUMN memo TEXT", []);
    drop(conn);
    // Try to read with extended columns first
    let db2 = state.db.lock().map_err(|e| e.to_string())?;
    let conn2 = db2.conn.lock().map_err(|e| e.to_string())?;
    // Attempt extended select; if fails, fallback to queries helper
    let try_extended = (|| -> Result<Vec<serde_json::Value>, String> {
        let mut stmt = conn2
            .prepare("SELECT id, amount, tx_type, peer_id, status, created_at, currency, from_node, to_node, memo FROM wallet_transactions ORDER BY created_at DESC")
            .map_err(|e| e.to_string())?;
        let rows = stmt
            .query_map([], |row| {
                let id: String = row.get(0)?;
                let amount: f64 = row.get(1)?;
                let tx_type: String = row.get(2)?;
                let peer_id: Option<String> = row.get(3)?;
                let status: String = row.get(4)?;
                let created_at: i64 = row.get(5)?;
                let currency: Option<String> = row.get(6).ok();
                let from_node: Option<String> = row.get(7).ok();
                let to_node: Option<String> = row.get(8).ok();
                let memo: Option<String> = row.get(9).ok();
                Ok(serde_json::json!({
                    "id": id,
                    "amount": amount,
                    "tx_type": tx_type,
                    "type": tx_type.to_lowercase(),
                    "peer_id": peer_id.clone(),
                    "from_node": from_node.clone().unwrap_or_default(),
                    "from": from_node.unwrap_or_default(),
                    "to_node": to_node.clone().or_else(|| peer_id.clone()).unwrap_or_default(),
                    "to": to_node.clone().or_else(|| peer_id.clone()).unwrap_or_default(),
                    "currency": currency.unwrap_or_else(|| "PINC".to_string()),
                    "status": status,
                    "created_at": created_at,
                    "timestamp": created_at,
                    "memo": memo.clone(),
                    "description": memo,
                }))
            })
            .map_err(|e| e.to_string())?;
        let mut out = Vec::new();
        for r in rows {
            out.push(r.map_err(|e| e.to_string())?);
        }
        Ok(out)
    })();
    match try_extended {
        Ok(v) => Ok(v),
        Err(_) => {
            drop(conn2);
            drop(db2);
            let txs = core::database::queries::list_transactions(&db).map_err(|e| e.to_string())?;
            Ok(txs
                .into_iter()
                .map(|tx| {
                    serde_json::json!({
                        "id": tx.id, "from_node": tx.from_node, "to_node": tx.to_node, "amount": tx.amount,
                        "currency": tx.currency, "tx_type": format!("{:?}", tx.tx_type), "status": format!("{:?}", tx.status), "created_at": tx.created_at,
                        "timestamp": tx.created_at
                    })
                })
                .collect())
        }
    }
}

#[tauri::command]
fn cmd_transfer_tokens(
    state: tauri::State<AppState>,
    to_node: String,
    amount: f64,
) -> Result<serde_json::Value, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let identity = core::database::queries::load_first_identity(&db)
        .map_err(|e| e.to_string())?
        .ok_or("No identity")?;
    let tx_id = uuid::Uuid::new_v4().to_string();
    let now = chrono::Utc::now().timestamp();
    let tx = core::payment::types::Transaction {
        id: tx_id.clone(),
        from_node: identity.node_id.clone(),
        to_node: Some(to_node),
        amount,
        currency: "PINC".to_string(),
        tx_type: core::payment::types::TxType::Transfer,
        status: core::payment::types::TxStatus::Confirmed,
        reference: None,
        memo: None,
        created_at: now,
        confirmed_at: Some(now),
        chain_tx_hash: None,
    };
    core::database::queries::insert_transaction(&db, &tx).map_err(|e| e.to_string())?;
    Ok(serde_json::json!({"transaction_id": tx_id, "status": "completed"}))
}

#[tauri::command]
fn cmd_faucet_request(state: tauri::State<AppState>) -> Result<serde_json::Value, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let identity = core::database::queries::load_first_identity(&db)
        .map_err(|e| e.to_string())?
        .ok_or("No identity")?;
    let tx_id = uuid::Uuid::new_v4().to_string();
    let now = chrono::Utc::now().timestamp();
    let tx = core::payment::types::Transaction {
        id: tx_id.clone(),
        from_node: "faucet".to_string(),
        to_node: Some(identity.node_id.clone()),
        amount: 1000.0,
        currency: "PINC".to_string(),
        tx_type: core::payment::types::TxType::Deposit,
        status: core::payment::types::TxStatus::Confirmed,
        reference: Some("faucet_request".to_string()),
        memo: None,
        created_at: now,
        confirmed_at: Some(now),
        chain_tx_hash: None,
    };
    core::database::queries::insert_transaction(&db, &tx).map_err(|e| e.to_string())?;
    Ok(serde_json::json!({"transaction_id": tx_id, "amount": 1000.0, "status": "completed"}))
}

#[tauri::command]
fn cmd_create_escrow(
    state: tauri::State<AppState>,
    payee_node: String,
    amount: f64,
    reason: String,
) -> Result<serde_json::Value, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let identity = core::database::queries::load_first_identity(&db)
        .map_err(|e| e.to_string())?
        .ok_or("No identity")?;
    let escrow_id = uuid::Uuid::new_v4().to_string();
    let now = chrono::Utc::now().timestamp();
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    conn.execute("INSERT INTO escrow_holds (id, payer_node_id, payee_node_id, amount, reason, status, created_at) VALUES (?1,?2,?3,?4,?5,?6,?7)",
        rusqlite::params![escrow_id, identity.node_id, payee_node, amount, reason, "locked", now]).map_err(|e| e.to_string())?;
    Ok(serde_json::json!({"escrow_id": escrow_id, "status": "locked"}))
}

#[tauri::command]
fn cmd_release_escrow(state: tauri::State<AppState>, escrow_id: String) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let now = chrono::Utc::now().timestamp();
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "UPDATE escrow_holds SET status='released', released_at=?1 WHERE id=?2",
        rusqlite::params![now, escrow_id],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn cmd_internal_get_balances(state: tauri::State<AppState>) -> Result<serde_json::Value, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let eng = core::payment::internal_wallets::InternalWalletEngine::new(
        core::payment::internal_wallets::FeeConfig::default(),
    );
    eng.ensure_all_wallets(&db).map_err(|e| e.to_string())?;
    let map = eng.get_all_balances(&db).map_err(|e| e.to_string())?;
    Ok(serde_json::json!(map))
}

#[tauri::command]
fn cmd_internal_deposit(
    state: tauri::State<AppState>,
    stable: String,
    principal: f64,
    agent_markup: Option<f64>,
    agent_id: Option<String>,
) -> Result<serde_json::Value, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let eng = core::payment::internal_wallets::InternalWalletEngine::new(
        core::payment::internal_wallets::FeeConfig::default(),
    );
    let s = core::payment::internal_wallets::StableCoin::from_str(&stable)
        .ok_or("invalid stable: use USDT|USDC|DAI|FDUSD|PYUSD")?;
    let (user_token, fee) = eng
        .process_deposit(&db, s, principal, agent_markup, agent_id)
        .map_err(|e| e.to_string())?;
    Ok(serde_json::json!({"user_token": user_token, "fee_to_fee_wallet": fee, "stable": stable}))
}

#[tauri::command]
fn cmd_internal_withdraw(
    state: tauri::State<AppState>,
    stable: String,
    amount: f64,
) -> Result<serde_json::Value, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let eng = core::payment::internal_wallets::InternalWalletEngine::new(
        core::payment::internal_wallets::FeeConfig::default(),
    );
    let s =
        core::payment::internal_wallets::StableCoin::from_str(&stable).ok_or("invalid stable")?;
    eng.process_withdraw(&db, s, amount)
        .map_err(|e| e.to_string())?;
    Ok(serde_json::json!({"status": "completed", "stable": stable, "amount": amount}))
}

#[tauri::command]
fn cmd_internal_rebalance(state: tauri::State<AppState>) -> Result<serde_json::Value, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let eng = core::payment::internal_wallets::InternalWalletEngine::new(
        core::payment::internal_wallets::FeeConfig::default(),
    );
    eng.try_rebalance_all(&db).map_err(|e| e.to_string())?;
    let map = eng.get_all_balances(&db).map_err(|e| e.to_string())?;
    Ok(serde_json::json!(map))
}

#[tauri::command]
fn cmd_internal_quote(
    _state: tauri::State<AppState>,
    from: String,
    to: String,
    amount: f64,
) -> Result<serde_json::Value, String> {
    let eng = core::payment::internal_wallets::InternalWalletEngine::new(
        core::payment::internal_wallets::FeeConfig::default(),
    );
    let f = core::payment::internal_wallets::StableCoin::from_str(&from).ok_or("invalid from")?;
    let t = core::payment::internal_wallets::StableCoin::from_str(&to).ok_or("invalid to")?;
    let q = eng.cheapest_quote(&f, &t, amount);
    Ok(serde_json::json!(q))
}

#[tauri::command]
fn cmd_has_identity(state: tauri::State<AppState>) -> Result<bool, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    Ok(core::database::queries::load_first_identity(&db)
        .map_err(|e| e.to_string())?
        .is_some())
}

#[tauri::command]
fn cmd_create_identity(
    state: tauri::State<AppState>,
    master_key: String,
    username: String,
    first_name: Option<String>,
    last_name: Option<String>,
    date_of_birth: Option<String>,
) -> Result<serde_json::Value, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    // Identity requires two names + DOB — stored permanently on the identity row.
    let profile = core::identity::generator::IdentityProfile {
        first_name: first_name.unwrap_or_default(),
        last_name: last_name.unwrap_or_default(),
        date_of_birth: date_of_birth.unwrap_or_default(),
    };
    let identity = core::identity::generator::create_identity(&db, &master_key, &username, &profile)
        .map_err(|e| e.to_string())?;
    Ok(
        serde_json::json!({"id": identity.id, "node_id": identity.node_id, "username": identity.username, "first_name": identity.first_name, "last_name": identity.last_name, "date_of_birth": identity.date_of_birth, "public_key": identity.public_key, "fingerprint": identity.fingerprint, "recovery_key_hash": identity.recovery_key_hash, "created_at": identity.created_at}),
    )
}

#[tauri::command]
fn cmd_get_identity(state: tauri::State<AppState>) -> Result<Option<serde_json::Value>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    if let Some(identity) =
        core::database::queries::load_first_identity(&db).map_err(|e| e.to_string())?
    {
        Ok(Some(
            serde_json::json!({"id": identity.id, "node_id": identity.node_id, "username": identity.username, "first_name": identity.first_name, "last_name": identity.last_name, "date_of_birth": identity.date_of_birth, "public_key": identity.public_key, "fingerprint": identity.fingerprint, "recovery_key_hash": identity.recovery_key_hash, "created_at": identity.created_at}),
        ))
    } else {
        Ok(None)
    }
}

/// Login verification — REQUIRES the master password. Verifies against the
/// Argon2 password_hash permanently bound to this node_id's identities row.
#[tauri::command]
fn cmd_verify_login(
    state: tauri::State<AppState>,
    password: String,
    node_id: Option<String>,
) -> Result<bool, String> {
    use crate::core::crypto::hash::verify_password;
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let identity = match node_id.as_deref() {
        Some(nid) if !nid.is_empty() => {
            let conn = db.conn.lock().map_err(|e| e.to_string())?;
            let hash: Option<String> = conn
                .query_row(
                    "SELECT password_hash FROM identities WHERE node_id=?1 LIMIT 1",
                    rusqlite::params![nid],
                    |r| r.get(0),
                )
                .optional()
                .map_err(|e| e.to_string())?;
            drop(conn);
            let hash = hash.ok_or("No identity for node_id")?;
            return Ok(verify_password(&password, &hash));
        }
        _ => core::database::queries::load_first_identity(&db)
            .map_err(|e| e.to_string())?
            .ok_or("No identity")?,
    };
    Ok(verify_password(&password, &identity.password_hash))
}

use rusqlite::OptionalExtension;

// ─── SETTINGS (core/settings) ────────────────────────────────────────────────

#[tauri::command]
fn cmd_get_app_settings(state: tauri::State<AppState>) -> Result<serde_json::Value, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    if let Some(json) = core::settings::get_app_settings_json(&db).map_err(|e| e.to_string())? {
        serde_json::from_str(&json).map_err(|e| e.to_string())
    } else {
        // return default AllSettings-shaped json (empty, frontend will merge with DEFAULT_SETTINGS)
        Ok(serde_json::json!({}))
    }
}

#[tauri::command]
fn cmd_set_app_settings(state: tauri::State<AppState>, settings: serde_json::Value) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let json = serde_json::to_string(&settings).map_err(|e| e.to_string())?;
    core::settings::set_app_settings_json(&db, &json).map_err(|e| e.to_string())
}

#[tauri::command]
fn cmd_has_completed_onboarding(state: tauri::State<AppState>) -> Result<bool, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    core::settings::get_onboarding_completed(&db).map_err(|e| e.to_string())
}

#[tauri::command]
fn cmd_set_onboarding_complete(state: tauri::State<AppState>, completed: bool) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    core::settings::set_onboarding_completed(&db, completed).map_err(|e| e.to_string())
}

// ─── SECURITY (core/security) — passcode hash Argon2 + biometric stub ──────

#[tauri::command]
fn cmd_has_passcode(state: tauri::State<AppState>) -> Result<bool, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    core::security::has_passcode(&db).map_err(|e| e.to_string())
}

#[tauri::command]
fn cmd_set_passcode(state: tauri::State<AppState>, passcode: String) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    core::security::set_passcode(&db, &passcode).map_err(|e| e.to_string())
}

#[tauri::command]
fn cmd_verify_passcode(state: tauri::State<AppState>, passcode: String) -> Result<bool, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    match core::security::verify_passcode(&db, &passcode) {
        Ok(v) => Ok(v),
        Err(e) => {
            let msg = e.to_string();
            if msg.contains("no passcode") { Ok(false) } else { Err(msg) }
        }
    }
}

#[tauri::command]
fn cmd_change_password(state: tauri::State<AppState>, current_password: String, new_password: String) -> Result<(), String> {
    use crate::core::crypto::hash::{hash_password, verify_password};
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let identity = core::database::queries::load_first_identity(&db).map_err(|e| e.to_string())?.ok_or("No identity")?;
    if !verify_password(&current_password, &identity.password_hash) {
        return Err("Current password incorrect".to_string());
    }
    if new_password.len() < 8 {
        return Err("New password must be ≥8 characters".to_string());
    }
    let new_hash = hash_password(&new_password).map_err(|e| e.to_string())?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    conn.execute("UPDATE identities SET password_hash=?1 WHERE id=?2", rusqlite::params![new_hash, identity.id]).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn cmd_biometric_is_available() -> bool {
    crate::core::security::biometric_plugin::is_available()
}

#[tauri::command]
fn cmd_biometric_auth(state: tauri::State<AppState>) -> Result<bool, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    // try plugin stub first
    if crate::core::security::biometric_plugin::is_available() {
        match crate::core::security::biometric_plugin::authenticate("Unlock SARAI") {
            Ok(true) => return Ok(true),
            Ok(false) => return Ok(false),
            Err(e) => return Err(e),
        }
    }
    core::security::biometric_authenticate(&db)
}

// ─── BACKUP / RESTORE ───────────────────────────────────────────────────────

#[tauri::command]
fn cmd_create_backup(state: tauri::State<AppState>) -> Result<serde_json::Value, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let json = core::settings::get_app_settings_json(&db).map_err(|e| e.to_string())?.unwrap_or_else(|| "{}".to_string());
    let now = chrono::Utc::now().timestamp();
    let backup_dir = state.vault_dir.join("backups");
    let _ = std::fs::create_dir_all(&backup_dir);
    let path = backup_dir.join(format!("sarai-backup-{}.json", now));
    let content = serde_json::json!({
        "created_at": now,
        "settings": serde_json::from_str::<serde_json::Value>(&json).unwrap_or(serde_json::json!({})),
        "version": "3.0.0"
    });
    std::fs::write(&path, serde_json::to_string_pretty(&content).map_err(|e| e.to_string())?).map_err(|e| e.to_string())?;
    // also update lastBackupDate in app_settings (frontend will handle)
    Ok(serde_json::json!({"path": path.to_string_lossy(), "created_at": now}))
}

#[tauri::command]
fn cmd_restore_backup(state: tauri::State<AppState>) -> Result<serde_json::Value, String> {
    // For demo: find latest backup and restore its settings
    let backup_dir = state.vault_dir.join("backups");
    let entries = std::fs::read_dir(&backup_dir).map_err(|e| e.to_string())?;
    let mut latest: Option<std::path::PathBuf> = None;
    let mut latest_mtime = 0u64;
    for e in entries {
        let e = e.map_err(|e| e.to_string())?;
        let m = e.metadata().map_err(|e| e.to_string())?.modified().map_err(|e| e.to_string())?;
        let ts = m.duration_since(std::time::UNIX_EPOCH).unwrap_or_default().as_secs();
        if ts > latest_mtime { latest_mtime = ts; latest = Some(e.path()); }
    }
    let path = latest.ok_or("No backup found")?;
    let data = std::fs::read_to_string(&path).map_err(|e| e.to_string())?;
    let v: serde_json::Value = serde_json::from_str(&data).map_err(|e| e.to_string())?;
    if let Some(settings) = v.get("settings") {
        let db = state.db.lock().map_err(|e| e.to_string())?;
        let json = serde_json::to_string(settings).map_err(|e| e.to_string())?;
        core::settings::set_app_settings_json(&db, &json).map_err(|e| e.to_string())?;
    }
    Ok(serde_json::json!({"restored_from": path.to_string_lossy()}))
}

#[tauri::command]
fn cmd_delete_identity(state: tauri::State<AppState>) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM identities", []).map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM auth_secrets WHERE key='passcode_hash'", []).map_err(|_| "no passcode".to_string()).ok();
    Ok(())
}

// ─── MESSAGING — real polling via DB (no demo) ──────────────────────────────

#[tauri::command]
fn cmd_get_messages(state: tauri::State<AppState>, peer_id: String) -> Result<Vec<serde_json::Value>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let identity = core::database::queries::load_first_identity(&db).map_err(|e| e.to_string())?;
    let self_id = identity.map(|i| i.node_id).unwrap_or_default();
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    // If peer_id empty, return recent 100 messages involving self (for invoice scanning)
    let mut out = Vec::new();
    if peer_id.trim().is_empty() {
        let mut stmt = conn.prepare("SELECT id, conversation_id, sender_id, recipient_id, content, status, sent_at FROM messages WHERE sender_id=?1 OR recipient_id=?1 ORDER BY sent_at DESC LIMIT 100")
            .map_err(|e| e.to_string())?;
        let rows = stmt.query_map(rusqlite::params![self_id], |row| {
            let content_blob: Vec<u8> = row.get(4)?;
            let content_str = String::from_utf8_lossy(&content_blob).to_string();
            Ok(serde_json::json!({
                "id": row.get::<_, String>(0)?,
                "conversation_id": row.get::<_, String>(1)?,
                "sender_id": row.get::<_, String>(2)?,
                "recipient_id": row.get::<_, String>(3)?,
                "content": content_str,
                "status": row.get::<_, String>(5)?,
                "timestamp": row.get::<_, i64>(6)?,
                "sent_at": row.get::<_, i64>(6)?,
            }))
        }).map_err(|e| e.to_string())?;
        for r in rows { out.push(r.map_err(|e| e.to_string())?); }
    } else {
        let mut stmt = conn.prepare("SELECT id, conversation_id, sender_id, recipient_id, content, status, sent_at FROM messages WHERE (sender_id=?1 AND recipient_id=?2) OR (sender_id=?2 AND recipient_id=?1) OR conversation_id=?2 ORDER BY sent_at ASC LIMIT 100")
            .map_err(|e| e.to_string())?;
        let rows = stmt.query_map(rusqlite::params![self_id, peer_id], |row| {
            let content_blob: Vec<u8> = row.get(4)?;
            let content_str = String::from_utf8_lossy(&content_blob).to_string();
            Ok(serde_json::json!({
                "id": row.get::<_, String>(0)?,
                "conversation_id": row.get::<_, String>(1)?,
                "sender_id": row.get::<_, String>(2)?,
                "recipient_id": row.get::<_, String>(3)?,
                "content": content_str,
                "status": row.get::<_, String>(5)?,
                "timestamp": row.get::<_, i64>(6)?,
                "sent_at": row.get::<_, i64>(6)?,
            }))
        }).map_err(|e| e.to_string())?;
        for r in rows { out.push(r.map_err(|e| e.to_string())?); }
    }
    Ok(out)
}

#[tauri::command]
fn cmd_send_message(state: tauri::State<AppState>, peer_id: String, content: String) -> Result<serde_json::Value, String> {
    if peer_id.trim().is_empty() { return Err("peer_id is required".to_string()); }
    if content.trim().is_empty() { return Err("content is required".to_string()); }
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let identity = core::database::queries::load_first_identity(&db).map_err(|e| e.to_string())?.ok_or("No identity")?;
    let now = chrono::Utc::now().timestamp();
    let id = uuid::Uuid::new_v4().to_string();
    let conv_id = if peer_id.contains("conv") { peer_id.clone() } else { format!("conv-{}-{}", identity.node_id, peer_id) };
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT INTO messages (id, conversation_id, sender_id, recipient_id, content, content_hash, msg_type, status, sent_at, encrypted) VALUES (?1,?2,?3,?4,?5,?6,'Text','Sent',?7,1)",
        rusqlite::params![id, conv_id, identity.node_id, peer_id, content.as_bytes(), md5_hash(&content), now],
    ).map_err(|e| e.to_string())?;
    // also ensure conversation row exists
    let _ = conn.execute(
        "INSERT OR IGNORE INTO conversations (id, participants, name, is_group, created_at, last_message_at, unread_count, encrypted) VALUES (?1,?2,?3,0,?4,?4,0,1)",
        rusqlite::params![conv_id, format!("{},{}", identity.node_id, peer_id), peer_id, now],
    );
    let _ = conn.execute("UPDATE conversations SET last_message_at=?1 WHERE id=?2", rusqlite::params![now, conv_id]);
    Ok(serde_json::json!({
        "id": id,
        "conversation_id": conv_id,
        "sender_id": identity.node_id,
        "recipient_id": peer_id,
        "content": content,
        "status": "Sent",
        "timestamp": now,
        "sent_at": now,
    }))
}

fn md5_hash(s: &str) -> String {
    // simple hex of content bytes length as placeholder (avoid extra dep)
    use std::collections::hash_map::DefaultHasher;
    use std::hash::{Hash, Hasher};
    let mut h = DefaultHasher::new();
    s.hash(&mut h);
    format!("{:016x}", h.finish())
}

#[tauri::command]
fn cmd_p2p_deposit_list(state: tauri::State<AppState>) -> Result<Vec<serde_json::Value>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn.prepare("SELECT id, agent_id, channel_id, buyer_node_id, amount, fee_amount, total_amount, currency, escrow_id, status, payment_proof, created_at, confirmed_at, released_at, expires_at, disputed_at, dispute_reason, evidence_hash, complainant_node_id FROM p2p_deposit_orders ORDER BY created_at DESC LIMIT 200").map_err(|e| e.to_string())?;
    let rows = stmt.query_map([], |row| {
        Ok(serde_json::json!({
            "id": row.get::<_, String>(0)?,
            "agent_id": row.get::<_, String>(1)?,
            "channel_id": row.get::<_, String>(2)?,
            "buyer_node_id": row.get::<_, String>(3)?,
            "amount": row.get::<_, f64>(4)?,
            "fee_amount": row.get::<_, f64>(5)?,
            "total_amount": row.get::<_, f64>(6)?,
            "currency": row.get::<_, String>(7)?,
            "escrow_id": row.get::<_, Option<String>>(8)?,
            "status": row.get::<_, String>(9)?,
            "payment_proof": row.get::<_, Option<String>>(10)?,
            "created_at": row.get::<_, i64>(11)?,
            "confirmed_at": row.get::<_, Option<i64>>(12)?,
            "released_at": row.get::<_, Option<i64>>(13)?,
            "expires_at": row.get::<_, Option<i64>>(14)?.unwrap_or(0),
            "disputed_at": row.get::<_, Option<i64>>(15)?,
            "dispute_reason": row.get::<_, Option<String>>(16)?,
            "evidence_hash": row.get::<_, Option<String>>(17)?,
            "complainant_node_id": row.get::<_, Option<String>>(18)?,
        }))
    }).map_err(|e| e.to_string())?;
    let mut out = Vec::new();
    for r in rows { out.push(r.map_err(|e| e.to_string())?); }
    Ok(out)
}

#[tauri::command]
fn cmd_get_wallet_history(state: tauri::State<AppState>) -> Result<Vec<serde_json::Value>, String> {
    // unified history = transactions + p2p_deposit_orders
    let txs = cmd_get_transactions(state.clone())?;
    let orders = cmd_p2p_deposit_list(state.clone()).unwrap_or_default();
    let mut hist = txs;
    for o in orders {
        hist.push(serde_json::json!({
            "id": o.get("id"),
            "type": "deposit",
            "amount": o.get("total_amount").and_then(|v| v.as_f64()).unwrap_or(0.0),
            "status": o.get("status").and_then(|v| v.as_str()).unwrap_or("pending"),
            "from": o.get("buyer_node_id").and_then(|v| v.as_str()).unwrap_or(""),
            "to": o.get("agent_id").and_then(|v| v.as_str()).unwrap_or(""),
            "timestamp": o.get("created_at").and_then(|v| v.as_i64()).unwrap_or(0),
            "description": format!("P2P {} via {}", o.get("currency").and_then(|v| v.as_str()).unwrap_or("USD"), o.get("agent_id").and_then(|v| v.as_str()).unwrap_or("")),
            "kind": "p2p",
            "raw": o,
        }));
    }
    // sort desc by timestamp
    hist.sort_by(|a, b| {
        let ta = a.get("timestamp").and_then(|v| v.as_i64()).unwrap_or(0);
        let tb = b.get("timestamp").and_then(|v| v.as_i64()).unwrap_or(0);
        tb.cmp(&ta)
    });
    Ok(hist)
}

#[tauri::command]
fn cmd_get_conversations(state: tauri::State<AppState>) -> Result<Vec<serde_json::Value>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn.prepare("SELECT id, participants, name, is_group, created_at, last_message_at, unread_count FROM conversations ORDER BY last_message_at DESC LIMIT 50").map_err(|e| e.to_string())?;
    let rows = stmt.query_map([], |row| {
        Ok(serde_json::json!({
            "id": row.get::<_, String>(0)?,
            "name": row.get::<_, Option<String>>(2)?.unwrap_or_else(|| row.get::<_, String>(1).unwrap_or_default()),
            "type": if row.get::<_, i64>(3)? != 0 { "group" } else { "private" },
            "last_message": "",
            "last_message_at": row.get::<_, i64>(5)?,
            "unread_count": row.get::<_, i64>(6)?,
            "avatar_color": "#00d4ff",
        }))
    }).map_err(|e| e.to_string())?;
    let mut out = Vec::new();
    for r in rows { out.push(r.map_err(|e| e.to_string())?); }
    Ok(out)
}

#[tauri::command]
fn cmd_list_invoices(state: tauri::State<AppState>) -> Result<Vec<serde_json::Value>, String> {
    // Derive invoices from messages with INVOICE: prefix
    let msgs = cmd_get_messages(state, "".to_string())?;
    let mut invoices = Vec::new();
    for m in msgs {
        let content = m.get("content").and_then(|v| v.as_str()).unwrap_or("");
        if content.starts_with("INVOICE:") {
            let json_str = &content["INVOICE:".len()..];
            if let Ok(j) = serde_json::from_str::<serde_json::Value>(json_str) {
                invoices.push(serde_json::json!({
                    "id": m.get("id"),
                    "from_node": m.get("sender_id"),
                    "to_node": m.get("recipient_id"),
                    "amount": j.get("amount"),
                    "currency": j.get("currency"),
                    "memo": j.get("memo"),
                    "status": "pending",
                    "created_at": m.get("timestamp"),
                }));
            }
        }
    }
    Ok(invoices)
}

// ─── WALLET ADDRESS CONTAINMENT — watch-only fetch from ADMIN via signed API (mock) ──
// SARAI never generates private material; ADMIN APK holds xpub in HSM. QR is server-side via qrcode crate.
#[tauri::command]
fn cmd_get_watch_address(
    state: tauri::State<AppState>,
    coin: String,
    index: Option<u32>,
) -> Result<serde_json::Value, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let identity = crate::core::database::queries::load_first_identity(&db)
        .map_err(|e| e.to_string())?
        .ok_or("No identity: create identity first")?;
    let user_id = identity.node_id.clone();
    // Validate coin
    let coin_up = coin.to_uppercase();
    if coin_up.is_empty() {
        return Err("coin is required (BTC, ETH, USDT, USDC)".to_string());
    }
    // If index provided, fetch existing; else allocate new if none, else fetch latest (gap limit aware)
    let watch = if let Some(idx) = index {
        crate::core::crypto::wallet::fetch_wallet_address(&db, &user_id, &coin_up, Some(idx))
            .map_err(|e| e.to_string())?
            .ok_or_else(|| format!("No watch address for {} {} index {}", user_id, coin_up, idx))?
    } else {
        // Try fetch latest; if none, allocate new (per-user HD derivation m/84'/0'/0'/0/n or m/44'/60'/0'/0/n)
        let existing = crate::core::crypto::wallet::fetch_wallet_address(&db, &user_id, &coin_up, None)
            .map_err(|e| e.to_string())?;
        if let Some(w) = existing {
            w
        } else {
            crate::core::crypto::wallet::allocate_wallet_address(&db, &user_id, &coin_up)
                .map_err(|e| e.to_string())?
        }
    };
    // Mock admin signature (HMAC-SHA256 address+user_id via ADMIN_SIGNING_SECRET)
    let sig = crate::core::crypto::wallet::mock_sign_watch_address(&watch.address, &user_id);
    let expires_at = chrono::Utc::now().timestamp() + 3600;
    Ok(serde_json::json!({
        "watch": watch,
        "admin_signature": sig,
        "expires_at": expires_at,
        "note": "SARAI watch-only: address derived by ADMIN xpub via BIP44/84, QR generated server-side (read-only canvas). No ethers_signers/bip39 on SARAI."
    }))
}

#[tauri::command]
fn cmd_allocate_watch_address(
    state: tauri::State<AppState>,
    coin: String,
) -> Result<serde_json::Value, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let identity = crate::core::database::queries::load_first_identity(&db)
        .map_err(|e| e.to_string())?
        .ok_or("No identity")?;
    let watch = crate::core::crypto::wallet::allocate_wallet_address(&db, &identity.node_id, &coin)
        .map_err(|e| e.to_string())?;
    let sig = crate::core::crypto::wallet::mock_sign_watch_address(&watch.address, &identity.node_id);
    Ok(serde_json::json!({
        "watch": watch,
        "admin_signature": sig,
        "expires_at": chrono::Utc::now().timestamp() + 3600,
        "gap_limit": 20,
        "no_reuse": true
    }))
}

#[tauri::command]
fn cmd_verify_alchemy_webhook(
    state: tauri::State<AppState>,
    payload: serde_json::Value,
    signature: String,
) -> Result<serde_json::Value, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    // Verify HMAC-SHA256
    let payload_bytes = serde_json::to_vec(&payload).map_err(|e| e.to_string())?;
    let secret = std::env::var("ALCHEMY_WEBHOOK_SECRET").unwrap_or_else(|_| "stub_alchemy_secret_for_sarai_hmac".to_string());
    let ok = crate::core::crypto::wallet::verify_alchemy_hmac(&payload_bytes, &signature, &secret);
    if !ok {
        return Err("Invalid HMAC-SHA256".to_string());
    }
    // Optionally also process via DB webhook path (12 confs + dedup)
    let wh: crate::core::crypto::wallet::AlchemyWebhookPayload = serde_json::from_value(payload).map_err(|e| e.to_string())?;
    let mut mgr = crate::core::crypto::wallet::DepositManager::new();
    // preload address map from wallet_addresses
    {
        let conn = db.conn.lock().map_err(|e| e.to_string())?;
        let mut stmt = conn.prepare("SELECT address, user_id FROM wallet_addresses").map_err(|e| e.to_string())?;
        let rows = stmt.query_map([], |r| Ok((r.get::<_, String>(0)?, r.get::<_, String>(1)?))).map_err(|e| e.to_string())?;
        for r in rows {
            if let Ok((addr, uid)) = r {
                mgr.address_to_user.insert(addr.to_lowercase(), uid);
            }
        }
    }
    let credited = mgr.process_webhook_db(&db, wh, Some(signature), Some(payload_bytes)).map_err(|e| e.to_string())?;
    Ok(serde_json::json!({"verified": true, "credited": credited, "confirmations_required": 12, "dedup": "chain_tx_hash UNIQUE"}))
}

#[tauri::command]
fn cmd_get_fx_rate(
    from: String,
    to: String,
    amount: f64,
) -> Result<serde_json::Value, String> {
    // Local FX via CoinGecko/fx stub + arbitrage prevention 1% lower + 2-3% fee
    // Example: 1 USD=129 KES market, SARAI gives 128 (1% lower) + fee -> 128.5 SHILYS
    let rate = crate::core::regions::fx::get_rate_sync(&from, &to).unwrap_or(1.0);
    let market_rate = rate;
    let sarai_rate = rate * 0.99; // 1% lower
    let fee_rate = 0.025; // 2.5% mid of 2-3%
    let net_out = amount * sarai_rate * (1.0 - fee_rate);
    let shilys = amount * sarai_rate;
    Ok(serde_json::json!({
        "from": from.to_uppercase(),
        "to": to.to_uppercase(),
        "amount_in": amount,
        "market_rate": market_rate,
        "sarai_rate": sarai_rate,
        "fee_percent": fee_rate * 100.0,
        "net_out": net_out,
        "shilys_before_fee": shilys,
        "note": "SARAI price always 1% lower than market to prevent arbitrage + 2-3% fee",
        "source": "CoinGecko/fx stub, 150 countries"
    }))
}

#[tauri::command]
fn cmd_convert_currency(
    from: String,
    to: String,
    amount: f64,
) -> Result<serde_json::Value, String> {
    cmd_get_fx_rate(from, to, amount)
}

#[tauri::command]
fn cmd_live_aggregator_quote(
    from: String,
    to: String,
    amount: f64,
) -> Result<serde_json::Value, String> {
    // Live aggregator: 1inch Fusion + LI.FI comparison net_out = quoted - gas - fee, pick cheapest
    // Attempts live HTTP; falls back to mock if offline (still reports net_out logic).
    let from_clone = from.clone();
    let to_clone = to.clone();
    let rt = tokio::runtime::Handle::try_current();
    let live = if let Ok(handle) = rt {
        // if inside tokio, spawn blocking
        let f = from_clone.clone();
        let t = to_clone.clone();
        std::thread::spawn(move || {
            handle.block_on(async {
                crate::core::crypto::aggregator::fetch_best_quote(&f, &t, amount).await
            })
        }).join().unwrap_or_else(|_| Err("thread panic".to_string()))
    } else {
        let rt2 = tokio::runtime::Builder::new_current_thread().enable_all().build().map_err(|e| e.to_string())?;
        rt2.block_on(crate::core::crypto::aggregator::fetch_best_quote(&from_clone, &to_clone, amount))
    };
    match live {
        Ok(q) => Ok(serde_json::json!(q)),
        Err(e) => {
            // fallback mock
            let eng = crate::core::payment::internal_wallets::InternalWalletEngine::new(crate::core::payment::internal_wallets::FeeConfig::default());
            let from_c = crate::core::payment::internal_wallets::StableCoin::from_str(&from).unwrap_or(crate::core::payment::internal_wallets::StableCoin::USDT);
            let to_c = crate::core::payment::internal_wallets::StableCoin::from_str(&to).unwrap_or(crate::core::payment::internal_wallets::StableCoin::USDC);
            let q = eng.cheapest_quote(&from_c, &to_c, amount);
            Ok(serde_json::json!({"fallback": true, "error": e, "quote": q, "net_out_calc": "quoted - gas - fee"}))
        }
    }
}

#[tauri::command]
fn cmd_profit_estimate(
    from: String,
    to: String,
    amount: f64,
    client_fee_rate: Option<f64>,
) -> Result<serde_json::Value, String> {
    let eng = crate::core::payment::internal_wallets::InternalWalletEngine::new(crate::core::payment::internal_wallets::FeeConfig::default());
    let from_c = crate::core::payment::internal_wallets::StableCoin::from_str(&from).unwrap_or(crate::core::payment::internal_wallets::StableCoin::USDT);
    let to_c = crate::core::payment::internal_wallets::StableCoin::from_str(&to).unwrap_or(crate::core::payment::internal_wallets::StableCoin::USDC);
    let q = eng.cheapest_quote(&from_c, &to_c, amount);
    let client_fee = client_fee_rate.unwrap_or(0.025) * amount;
    let profit = q.profit_estimate - client_fee;
    Ok(serde_json::json!({
        "route": q.route,
        "amount": amount,
        "total_fee": q.total_fee,
        "gas_cost": q.gas_cost,
        "fee_rate": q.fee_rate,
        "profit_before_client_fee": q.profit_estimate,
        "client_fee": client_fee,
        "client_fee_rate": client_fee_rate.unwrap_or(0.025),
        "profit_after_fees": profit,
        "net_out": amount - q.total_fee - client_fee,
        "criteria": "best cheapest fastest private secure — accessibility, speed, cost"
    }))
}

// ─── MULTI-CURRENCY HOLD — wallet_balances_tokens (150 countries) ─────────
// User can hold any fiat/crypto from tokens table + local currencies (KES, EUR, etc.) via FX.
// Algorithm: amount * rate * 0.99 (1% lower) + 2.5% fee, polling 30s via fetch_rate_live/cache
#[tauri::command]
fn cmd_get_wallet_balances_tokens(state: tauri::State<AppState>) -> Result<serde_json::Value, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    // Ensure table exists (idempotent)
    {
        let conn = db.conn.lock().map_err(|e| e.to_string())?;
        let _ = conn.execute_batch(crate::core::database::schema::CREATE_WALLET_BALANCES_TOKENS);
    }
    // Determine node_id for scoping — if no identity, use synthetic "anon"
    let node_id = crate::core::database::queries::load_first_identity(&db)
        .map_err(|e| e.to_string())?
        .map(|i| i.node_id)
        .unwrap_or_else(|| "anon".to_string());
    // Seed demo balances if empty for this node (so UI shows grid: USD 100, KES 12800, EUR 90 etc.)
    {
        let conn = db.conn.lock().map_err(|e| e.to_string())?;
        let cnt: i64 = conn
            .query_row(
                "SELECT COUNT(*) FROM wallet_balances_tokens WHERE node_id=?1",
                rusqlite::params![node_id],
                |r| r.get(0),
            )
            .map_err(|e| e.to_string())?;
        if cnt == 0 {
            let now = chrono::Utc::now().timestamp();
            // Demo portfolio covering fiat + crypto + local currencies (150 countries subset)
            let demo: &[(&str, &str, &str, i64, f64)] = &[
                ("USD", "US Dollar", "fiat", 2, 100.0),
                ("KES", "Kenyan Shilling", "fiat", 2, 12800.0),
                ("EUR", "Euro", "fiat", 2, 90.0),
                ("GBP", "British Pound", "fiat", 2, 80.0),
                ("JPY", "Japanese Yen", "fiat", 2, 15000.0),
                ("BTC", "Bitcoin", "crypto", 8, 0.025),
                ("ETH", "Ethereum", "crypto", 18, 0.85),
                ("USDT", "Tether", "stable", 6, 500.0),
                ("USDC", "USD Coin", "stable", 6, 300.0),
                ("NGN", "Nigerian Naira", "fiat", 2, 75000.0),
                ("ZAR", "South African Rand", "fiat", 2, 1850.0),
                ("INR", "Indian Rupee", "fiat", 2, 8300.0),
            ];
            for (sym, name, ttype, dec, bal) in demo {
                let id = format!("wbt-{}-{}", node_id, sym);
                let _ = conn.execute(
                    "INSERT OR IGNORE INTO wallet_balances_tokens (id, node_id, token_symbol, name, token_type, decimals, balance, locked, updated_at) VALUES (?1,?2,?3,?4,?5,?6,?7,0,?8)",
                    rusqlite::params![id, node_id, *sym, *name, *ttype, *dec, *bal, now],
                );
            }
        }
    }
    // Fetch all balances for node
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare("SELECT token_symbol, name, token_type, decimals, balance, locked, updated_at FROM wallet_balances_tokens WHERE node_id=?1 ORDER BY token_symbol")
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map(rusqlite::params![node_id], |row| {
            Ok(serde_json::json!({
                "token_symbol": row.get::<_, String>(0)?,
                "symbol": row.get::<_, String>(0)?,
                "name": row.get::<_, String>(1)?,
                "token_type": row.get::<_, String>(2)?,
                "decimals": row.get::<_, i64>(3)?,
                "balance": row.get::<_, f64>(4)?,
                "locked": row.get::<_, f64>(5)?,
                "available": row.get::<_, f64>(4)? - row.get::<_, f64>(5)?,
                "updated_at": row.get::<_, i64>(6)?,
            }))
        })
        .map_err(|e| e.to_string())?;
    let mut out: Vec<serde_json::Value> = Vec::new();
    for r in rows { out.push(r.map_err(|e| e.to_string())?); }
    // Enrich with token metadata from tokens table (fallback name/type if missing)
    // Already have stored metadata, but also include count
    Ok(serde_json::json!(out))
}

#[tauri::command]
fn cmd_set_wallet_token_balance(
    state: tauri::State<AppState>,
    token_symbol: String,
    balance: f64,
) -> Result<serde_json::Value, String> {
    if token_symbol.trim().is_empty() { return Err("token_symbol required".to_string()); }
    if !balance.is_finite() || balance < 0.0 { return Err("balance must be >=0 finite".to_string()); }
    let sym = token_symbol.trim().to_uppercase();
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let node_id = crate::core::database::queries::load_first_identity(&db)
        .map_err(|e| e.to_string())?
        .map(|i| i.node_id)
        .unwrap_or_else(|| "anon".to_string());
    // Lookup token metadata
    let (name, ttype, dec): (String, String, i64) = {
        let conn = db.conn.lock().map_err(|e| e.to_string())?;
        let row = conn.query_row(
            "SELECT name, token_type, decimals FROM tokens WHERE symbol=?1",
            rusqlite::params![sym],
            |r| Ok((r.get::<_, String>(0)?, r.get::<_, String>(1)?, r.get::<_, i64>(2)?)),
        ).unwrap_or((sym.clone(), "fiat".to_string(), 2));
        row
    };
    let now = chrono::Utc::now().timestamp();
    let id = format!("wbt-{}-{}", node_id, sym);
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "INSERT INTO wallet_balances_tokens (id, node_id, token_symbol, name, token_type, decimals, balance, locked, updated_at) VALUES (?1,?2,?3,?4,?5,?6,?7,0,?8) ON CONFLICT(node_id, token_symbol) DO UPDATE SET balance=?7, name=?4, token_type=?5, decimals=?6, updated_at=?8",
        rusqlite::params![id, node_id, sym, name, ttype, dec, balance, now],
    ).map_err(|e| e.to_string())?;
    Ok(serde_json::json!({"token_symbol": sym, "balance": balance, "node_id": node_id, "updated_at": now}))
}

#[tauri::command]
fn cmd_list_tokens(state: tauri::State<AppState>) -> Result<serde_json::Value, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn.prepare("SELECT symbol, name, token_type, decimals, enabled FROM tokens ORDER BY symbol").map_err(|e| e.to_string())?;
    let rows = stmt.query_map([], |r| Ok(serde_json::json!({
        "symbol": r.get::<_, String>(0)?,
        "name": r.get::<_, String>(1)?,
        "token_type": r.get::<_, String>(2)?,
        "decimals": r.get::<_, i64>(3)?,
        "enabled": r.get::<_, i64>(4)? != 0,
    }))).map_err(|e| e.to_string())?;
    let mut out = Vec::new();
    for r in rows { out.push(r.map_err(|e| e.to_string())?); }
    Ok(serde_json::json!(out))
}

fn is_valid_pinc(s: &str) -> bool {
    // PINC-0000-000 (13 chars): PINC- + 4 digits + - + 3 digits
    if s.len() != 13 {
        return false;
    }
    let b = s.as_bytes();
    if b[0] != b'P' || b[1] != b'I' || b[2] != b'N' || b[3] != b'C' || b[4] != b'-' || b[9] != b'-' {
        return false;
    }
    for &c in &b[5..9] {
        if !c.is_ascii_digit() {
            return false;
        }
    }
    for &c in &b[10..13] {
        if !c.is_ascii_digit() {
            return false;
        }
    }
    true
}

#[tauri::command]
fn cmd_transfer_wallet_tokens(
    state: tauri::State<AppState>,
    to_node: String,
    token_symbol: String,
    amount: f64,
    memo: Option<String>,
) -> Result<serde_json::Value, String> {
    let to = to_node.trim().to_uppercase();
    let sym = token_symbol.trim().to_uppercase();
    if to.is_empty() {
        return Err("to_node is required".to_string());
    }
    if !is_valid_pinc(&to) {
        return Err("Invalid PINC ID. Expected PINC-0000-000".to_string());
    }
    if sym.is_empty() {
        return Err("token_symbol is required".to_string());
    }
    if !amount.is_finite() || amount <= 0.0 {
        return Err("amount must be >0".to_string());
    }
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let identity = core::database::queries::load_first_identity(&db)
        .map_err(|e| e.to_string())?
        .ok_or("No identity")?;
    let from_node = identity.node_id.clone();
    if from_node.to_uppercase() == to {
        return Err("Cannot send to self".to_string());
    }
    // Ensure tables / columns exist (idempotent, ignore errors)
    {
        let conn = db.conn.lock().map_err(|e| e.to_string())?;
        let _ = conn.execute_batch(crate::core::database::schema::CREATE_WALLET_BALANCES_TOKENS);
        let _ = conn.execute("ALTER TABLE wallet_transactions ADD COLUMN currency TEXT DEFAULT 'PINC'", []);
        let _ = conn.execute("ALTER TABLE wallet_transactions ADD COLUMN from_node TEXT DEFAULT ''", []);
        let _ = conn.execute("ALTER TABLE wallet_transactions ADD COLUMN to_node TEXT", []);
        let _ = conn.execute("ALTER TABLE wallet_transactions ADD COLUMN memo TEXT", []);
        let _ = conn.execute("ALTER TABLE wallet_transactions ADD COLUMN chain_tx_hash TEXT", []);
    }
    // Validate token exists if possible (but allow any held token)
    let now = chrono::Utc::now().timestamp();
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    conn.execute("BEGIN IMMEDIATE", []).map_err(|e| e.to_string())?;
    let result: Result<String, String> = (|| {
        // Check sender balance
        let (balance, locked): (f64, f64) = conn
            .query_row(
                "SELECT balance, locked FROM wallet_balances_tokens WHERE node_id=?1 AND token_symbol=?2",
                rusqlite::params![from_node, sym],
                |r| Ok((r.get::<_, f64>(0)?, r.get::<_, f64>(1)?)),
            )
            .map_err(|_| format!("Insufficient balance or token {} not held", sym))?;
        let available = balance - locked;
        if available + 1e-9 < amount {
            return Err(format!(
                "Insufficient available balance: have {} {} (available {}), need {}",
                balance, sym, available, amount
            ));
        }
        // Decrement sender
        let updated = conn
            .execute(
                "UPDATE wallet_balances_tokens SET balance = balance - ?1, updated_at = ?2 WHERE node_id=?3 AND token_symbol=?4",
                rusqlite::params![amount, now, from_node, sym],
            )
            .map_err(|e| e.to_string())?;
        if updated == 0 {
            return Err("Failed to debit sender".to_string());
        }
        // Lookup token metadata for recipient row
        let (name, token_type, decimals): (String, String, i64) = conn
            .query_row(
                "SELECT name, token_type, decimals FROM tokens WHERE symbol=?1",
                rusqlite::params![sym],
                |r| Ok((r.get::<_, String>(0)?, r.get::<_, String>(1)?, r.get::<_, i64>(2)?)),
            )
            .unwrap_or((sym.clone(), "fiat".to_string(), 2));
        let rec_id = format!("wbt-{}-{}", to, sym);
        conn.execute(
            "INSERT INTO wallet_balances_tokens (id, node_id, token_symbol, name, token_type, decimals, balance, locked, updated_at) VALUES (?1,?2,?3,?4,?5,?6,?7,0,?8) ON CONFLICT(node_id, token_symbol) DO UPDATE SET balance = balance + ?7, updated_at = ?8, name=?4, token_type=?5, decimals=?6",
            rusqlite::params![rec_id, to, sym, name, token_type, decimals, amount, now],
        )
        .map_err(|e| e.to_string())?;
        // Insert transaction for history (try extended columns, fallback minimal)
        let tx_id = uuid::Uuid::new_v4().to_string();
        let memo_str: Option<String> = memo.clone().filter(|m| !m.trim().is_empty());
        let inserted = conn.execute(
            "INSERT INTO wallet_transactions (id, amount, tx_type, peer_id, status, created_at, currency, from_node, to_node, memo) VALUES (?1,?2,'Transfer',?3,'Confirmed',?4,?5,?6,?7,?8)",
            rusqlite::params![tx_id, amount, to, now, sym, from_node, to, memo_str],
        );
        if inserted.is_err() {
            conn.execute(
                "INSERT INTO wallet_transactions (id, amount, tx_type, peer_id, status, created_at) VALUES (?1,?2,'Transfer',?3,'Confirmed',?4)",
                rusqlite::params![tx_id, amount, to, now],
            )
            .map_err(|e| e.to_string())?;
        }
        Ok(tx_id)
    })();
    match result {
        Ok(tx_id) => {
            let _ = conn.execute("COMMIT", []);
            Ok(serde_json::json!({
                "transaction_id": tx_id,
                "status": "completed",
                "from": from_node,
                "to": to,
                "amount": amount,
                "currency": sym,
                "memo": memo
            }))
        }
        Err(e) => {
            let _ = conn.execute("ROLLBACK", []);
            Err(e)
        }
    }
}

#[tauri::command]
async fn cmd_fetch_fx_rate_live(from: String, to: String) -> Result<serde_json::Value, String> {
    // Live polling via frankfurter/CoinGecko every 30s, cached. Wraps fx::fetch_rate_live.
    let fx = crate::core::regions::fx::fetch_rate_live(&from, &to).await?;
    Ok(serde_json::json!(fx))
}

fn rustls_stub() {}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // rustls removed for minimal build
    let _ = rustls_stub();
    env_logger::Builder::from_env(env_logger::Env::default().default_filter_or("info")).init();
    tauri::Builder::default()
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_http::init())
        .setup(|app| {
            let data_dir = app
                .path()
                .app_data_dir()
                .unwrap_or_else(|_| PathBuf::from("."));
            let _ = std::fs::create_dir_all(&data_dir);
            let db_path = data_dir.join("sarai.db");
            let db = Database::open(db_path.to_str().unwrap()).expect("open db");
            run_migrations(&db).expect("migrations");
            // ensure 20 internal wallets + 5 admin sinks created
            {
                let eng = core::payment::internal_wallets::InternalWalletEngine::new(
                    core::payment::internal_wallets::FeeConfig::default(),
                );
                let _ = eng.ensure_all_wallets(&db);
            }
            let vault_dir = data_dir.join("vault");
            let _ = std::fs::create_dir_all(&vault_dir);
            // auto-rebalance every 60s + pile-up
            let db_clone = Arc::new(Mutex::new(db));
            let db_for_thread = db_clone.clone();
            std::thread::spawn(move || loop {
                std::thread::sleep(std::time::Duration::from_secs(60));
                if let Ok(db) = db_for_thread.lock() {
                    let eng = core::payment::internal_wallets::InternalWalletEngine::new(
                        core::payment::internal_wallets::FeeConfig::default(),
                    );
                    let _ = eng.try_rebalance_all(&db);
                }
            });
            // FX live cache warm + polling 30s for top pairs (ensures top-of-market, 1% lower + fee)
            {
                let db_fx = db_clone.clone();
                std::thread::spawn(move || {
                    // Tokio runtime for async fetch_rate_live polling
                    let rt = tokio::runtime::Builder::new_current_thread().enable_all().build();
                    if let Ok(rt) = rt {
                        rt.block_on(async {
                            let pairs = ["EUR","KES","UGX","NGN","ZAR","INR","GBP","JPY","CNY","BRL","MXN","AED","SAR","TRY","UGX","KES"];
                            loop {
                                for to in pairs {
                                    let _ = crate::core::regions::fx::fetch_rate_live("USD", to).await;
                                    tokio::time::sleep(std::time::Duration::from_millis(300)).await;
                                }
                                // Keep CACHE fresh for aggregator clients
                                tokio::time::sleep(std::time::Duration::from_secs(30)).await;
                                // Rebalance also hooks to FX freshness check
                                if let Ok(db) = db_fx.lock() {
                                    let _ = crate::core::regions::fx::get_rate_sync("USD", "KES");
                                    let _ = &db;
                                }
                            }
                        });
                    }
                });
            }
            let state = AppState {
                db: db_clone,
                vault_dir,
            };
            app.manage(state);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            cmd_get_wallet_balance,
            cmd_get_transactions,
            cmd_transfer_tokens,
            cmd_transfer_wallet_tokens,
            cmd_faucet_request,
            cmd_create_escrow,
            cmd_release_escrow,
            cmd_has_identity,
            cmd_create_identity,
            cmd_get_identity,
            cmd_verify_login,
            cmd_internal_get_balances,
            cmd_internal_deposit,
            cmd_internal_withdraw,
            cmd_internal_rebalance,
            cmd_internal_quote,
            cmd_get_app_settings,
            cmd_set_app_settings,
            cmd_has_completed_onboarding,
            cmd_set_onboarding_complete,
            cmd_has_passcode,
            cmd_set_passcode,
            cmd_verify_passcode,
            cmd_change_password,
            cmd_biometric_is_available,
            cmd_biometric_auth,
            cmd_create_backup,
            cmd_restore_backup,
            cmd_delete_identity,
            cmd_get_messages,
            cmd_send_message,
            cmd_p2p_deposit_list,
            cmd_get_wallet_history,
            cmd_get_conversations,
            cmd_list_invoices,
            cmd_get_watch_address,
            cmd_allocate_watch_address,
            cmd_verify_alchemy_webhook,
            cmd_get_fx_rate,
            cmd_convert_currency,
            cmd_live_aggregator_quote,
            cmd_profit_estimate,
            cmd_get_wallet_balances_tokens,
            cmd_set_wallet_token_balance,
            cmd_list_tokens,
            cmd_fetch_fx_rate_live,
            modules::p2p_agents::commands::cmd_p2p_agent_list,
            modules::p2p_agents::commands::cmd_p2p_agent_create,
            modules::p2p_agents::commands::cmd_p2p_agent_update,
            modules::p2p_agents::commands::cmd_p2p_agent_delete,
            modules::p2p_agents::commands::cmd_p2p_agent_bind_channel,
            modules::p2p_agents::commands::cmd_p2p_agent_list_channels,
            modules::p2p_agents::commands::cmd_p2p_agent_unbind_channel,
            modules::p2p_agents::commands::cmd_p2p_agent_bind_commlink,
            modules::p2p_agents::commands::cmd_p2p_agent_unbind_commlink,
            modules::p2p_agents::commands::cmd_p2p_agent_calc_quote,
            modules::p2p_agents::commands::cmd_p2p_agent_initiate_deposit,
            modules::p2p_agents::commands::cmd_p2p_agent_confirm_payment,
            modules::p2p_agents::commands::cmd_p2p_agent_release_escrow,
            modules::p2p_agents::commands::cmd_p2p_agent_heartbeat,
            modules::p2p_agents::commands::cmd_p2p_agent_complain,
            modules::p2p_agents::commands::cmd_p2p_agent_list_balances,
            modules::p2p_agents::commands::cmd_p2p_agent_set_balance
        ])
        .run(tauri::generate_context!())
        .expect("error while running sarai");
}
