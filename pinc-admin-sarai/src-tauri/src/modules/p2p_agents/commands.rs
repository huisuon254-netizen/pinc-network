use crate::core::database::connection::Database;
use crate::core::database::errors::DatabaseError;
use crate::core::database::queries::load_first_identity;
use crate::modules::p2p_agents::models::*;
use crate::modules::p2p_agents::storage::*;
use crate::AppState;
use tauri::State;
use uuid::Uuid;

fn append_audit_log(
    db: &Database,
    actor_id: &str,
    action: &str,
    target: &str,
    status: &str,
    trace_id: &str,
    fields: serde_json::Value,
) -> Result<(), DatabaseError> {
    let conn = db.conn.lock().map_err(|_| DatabaseError::LockFailed)?;
    let ts = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs_f64();
    conn.execute(
        "INSERT INTO audit_logs (ts, level, domain, actor_id, action, target, status, trace_id, fields)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
        rusqlite::params![
            ts,
            "Audit",
            "Payment",
            actor_id,
            action,
            target,
            status,
            trace_id,
            fields.to_string(),
        ],
    )
    .map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;
    Ok(())
}

#[tauri::command]
pub fn cmd_p2p_agent_list(
    state: State<'_, AppState>,
    country_iso2: Option<String>,
    network: Option<String>,
    online_only: Option<bool>,
) -> Result<Vec<Agent>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let filter = AgentFilter {
        country_iso2,
        network: network.map(|n| PaymentNetwork::from_str(&n)),
        online_only,
    };
    list_agents(&db, &filter).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn cmd_p2p_agent_create(
    state: State<'_, AppState>,
    name: String,
    country_iso2: String,
    languages: Vec<String>,
    commission_rate: f64,
) -> Result<Agent, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    if name.trim().is_empty() {
        return Err("Agent name is required".to_string());
    }
    let country = country_iso2.trim().to_uppercase();
    if country.len() != 2 || !country.chars().all(|c| c.is_ascii_uppercase()) {
        return Err("country_iso2 must be 2 uppercase letters".to_string());
    }
    let langs: Vec<String> = languages
        .iter()
        .map(|l| l.trim().to_lowercase())
        .filter(|l| !l.is_empty())
        .collect();
    if langs.is_empty() || langs.len() > 5 {
        return Err("languages must contain between 1 and 5 entries".to_string());
    }
    let commission_rate = commission_rate.clamp(0.0, 10.0);
    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs() as i64;
    let agent = Agent {
        id: generate_id("agt"),
        name: name.trim().to_string(),
        country_iso2: country,
        languages: langs,
        identity_verified: false,
        kyc_level: 0,
        rating: 0.0,
        commission_rate,
        volume_24h: 0.0,
        created_at: now,
        node_id: None,
        is_online: false,
        last_seen: now,
        total_orders: 0,
        completed_orders: 0,
    };
    insert_agent(&db, &agent).map_err(|e| e.to_string())?;
    Ok(agent)
}

#[tauri::command]
pub fn cmd_p2p_agent_update(state: State<'_, AppState>, agent: Agent) -> Result<Agent, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let existing = get_agent(&db, &agent.id)
        .map_err(|e| e.to_string())?
        .ok_or_else(|| format!("Agent '{}' not found", agent.id))?;
    if agent.name.trim().is_empty() {
        return Err("Agent name is required".to_string());
    }
    let country = agent.country_iso2.trim().to_uppercase();
    if country.len() != 2 || !country.chars().all(|c| c.is_ascii_uppercase()) {
        return Err("country_iso2 must be 2 uppercase letters".to_string());
    }
    let updated = Agent {
        id: existing.id.clone(),
        country_iso2: country,
        created_at: existing.created_at,
        node_id: existing.node_id,
        is_online: existing.is_online,
        last_seen: existing.last_seen,
        total_orders: existing.total_orders,
        completed_orders: existing.completed_orders,
        ..agent
    };
    update_agent(&db, &updated).map_err(|e| e.to_string())?;
    Ok(updated)
}

#[tauri::command]
pub fn cmd_p2p_agent_delete(state: State<'_, AppState>, agent_id: String) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    delete_agent(&db, &agent_id).map_err(|e| e.to_string())
}

#[tauri::command]
#[allow(clippy::too_many_arguments)]
pub fn cmd_p2p_agent_bind_channel(
    state: State<'_, AppState>,
    agent_id: String,
    network: String,
    account_identifier: String,
    credentials_encrypted: String,
    currency: String,
    min_amount: f64,
    max_amount: f64,
    daily_limit: f64,
    fee_percent: f64,
) -> Result<PaymentChannel, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let _ = get_agent(&db, &agent_id)
        .map_err(|e| e.to_string())?
        .ok_or_else(|| format!("Agent '{}' not found", agent_id))?;
    if account_identifier.trim().is_empty() {
        return Err("account_identifier is required".to_string());
    }
    // P2P LIMITS: deposit limit max $1000 via p2p_payment_channels.max_amount, no withdraw limit (withdraw is separate)
    // Enforce per-agent deposit cap $1000 to meet spec: "Agent can set deposit limit max $1000 ... no withdraw limit"
    if max_amount > 1000.0 {
        return Err("Deposit max_amount cannot exceed $1000 (agent deposit limit max $1000 per spec; withdraw uncapped)".to_string());
    }
    if min_amount > max_amount && max_amount > 0.0 {
        return Err("min_amount cannot exceed max_amount".to_string());
    }
    let channel = PaymentChannel {
        id: generate_id("ch"),
        agent_id: agent_id.clone(),
        network: PaymentNetwork::from_str(&network),
        account_identifier: account_identifier.trim().to_string(),
        credentials_encrypted,
        currency: currency.to_uppercase(),
        min_amount: min_amount.max(0.0),
        max_amount: max_amount.max(0.0).min(1000.0), // clamp to 1000 hard cap
        daily_limit: daily_limit.max(0.0),
        fee_percent: fee_percent.clamp(0.0, 10.0),
        enabled: true,
    };
    insert_payment_channel(&db, &channel).map_err(|e| e.to_string())?;
    Ok(channel)
}

#[tauri::command]
pub fn cmd_p2p_agent_list_channels(
    state: State<'_, AppState>,
    agent_id: String,
) -> Result<Vec<PaymentChannel>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let channels = list_payment_channels(&db, &agent_id).map_err(|e| e.to_string())?;
    Ok(channels.into_iter().filter(|c| c.enabled).collect())
}

#[tauri::command]
pub fn cmd_p2p_agent_unbind_channel(
    state: State<'_, AppState>,
    channel_id: String,
) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    unbind_payment_channel(&db, &channel_id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn cmd_p2p_agent_bind_commlink(
    state: State<'_, AppState>,
    agent_id: String,
    platform: String,
    handle: String,
    preferred_for_escrow: bool,
) -> Result<CommLink, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let _ = get_agent(&db, &agent_id)
        .map_err(|e| e.to_string())?
        .ok_or_else(|| format!("Agent '{}' not found", agent_id))?;
    if handle.trim().is_empty() {
        return Err("handle is required".to_string());
    }
    let link = CommLink {
        id: generate_id("cm"),
        agent_id: agent_id.clone(),
        platform: CommPlatform::from_str(&platform),
        handle: handle.trim().to_string(),
        verified: false,
        preferred_for_escrow,
    };
    insert_comm_link(&db, &link).map_err(|e| e.to_string())?;
    Ok(link)
}

#[tauri::command]
pub fn cmd_p2p_agent_unbind_commlink(
    state: State<'_, AppState>,
    link_id: String,
) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    unbind_comm_link(&db, &link_id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn cmd_p2p_agent_calc_quote(
    state: State<'_, AppState>,
    agent_id: String,
    channel_id: String,
    base_amount: f64,
) -> Result<QuoteResult, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    if base_amount <= 0.0 {
        return Err("base_amount must be greater than 0".to_string());
    }
    let agent = get_agent(&db, &agent_id)
        .map_err(|e| e.to_string())?
        .ok_or_else(|| format!("Agent '{}' not found", agent_id))?;
    let channel = get_payment_channel(&db, &channel_id)
        .map_err(|e| e.to_string())?
        .ok_or_else(|| format!("PaymentChannel '{}' not found", channel_id))?;
    if channel.agent_id != agent.id {
        return Err("Channel does not belong to agent".to_string());
    }
    if !channel.enabled {
        return Err("Payment channel is disabled".to_string());
    }
    if base_amount < channel.min_amount {
        return Err(format!(
            "Amount below minimum (min: {})",
            channel.min_amount
        ));
    }
    if channel.max_amount > 0.0 && base_amount > channel.max_amount {
        return Err(format!(
            "Amount above maximum (max: {})",
            channel.max_amount
        ));
    }
    Ok(calculate_quote(&agent, &channel, base_amount))
}

#[tauri::command]
pub async fn cmd_p2p_agent_initiate_deposit(
    state: State<'_, AppState>,
    agent_id: String,
    channel_id: String,
    base_amount: f64,
) -> Result<DepositOrder, String> {
    let (order, agent_id_clone, maybe_link) = {
        let db = state.db.lock().map_err(|e| e.to_string())?;
        let identity = load_first_identity(&db)
            .map_err(|e| e.to_string())?
            .ok_or_else(|| "No identity found - create identity first".to_string())?;
        let agent = get_agent(&db, &agent_id)
            .map_err(|e| e.to_string())?
            .ok_or_else(|| format!("Agent '{}' not found", agent_id))?;
        let channel = get_payment_channel(&db, &channel_id)
            .map_err(|e| e.to_string())?
            .ok_or_else(|| format!("PaymentChannel '{}' not found", channel_id))?;
        if channel.agent_id != agent.id {
            return Err("Channel does not belong to agent".to_string());
        }
        if !channel.enabled {
            return Err("Payment channel is disabled".to_string());
        }
        let quote = calculate_quote(&agent, &channel, base_amount);
        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs() as i64;
        let escrow_id = Some(format!("esc-{}", Uuid::new_v4()));
        let order_id = generate_id("dep");
        let escrow_amount = quote.total_amount;
        let escrow_id_clone = escrow_id.clone();
        let identity_node = identity.node_id.clone();
        let expires_at = now + 1800;
        {
            let conn = db.conn.lock().map_err(|_| "Lock failed".to_string())?;
            conn.execute(
                "INSERT INTO escrow_holds
                 (id, payer_node_id, payee_node_id, amount, reason, status, created_at, expires_at)
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
                rusqlite::params![
                    escrow_id_clone.as_deref(),
                    identity_node,
                    agent_id.clone(),
                    escrow_amount,
                    format!("p2p deposit: {}", order_id),
                    "held",
                    now,
                    expires_at,
                ],
            )
            .map_err(|e| e.to_string())?;
        }
        let order = DepositOrder {
            id: order_id,
            agent_id: agent.id.clone(),
            channel_id: channel.id.clone(),
            buyer_node_id: identity.node_id.clone(),
            amount: quote.base_amount,
            fee_amount: quote.fee_amount,
            total_amount: quote.total_amount,
            currency: quote.currency.clone(),
            escrow_id: escrow_id.clone(),
            status: DepositStatus::EscrowHeld,
            payment_proof: None,
            created_at: now,
            confirmed_at: None,
            released_at: None,
            expires_at,
            disputed_at: None,
            dispute_reason: None,
            evidence_hash: None,
            complainant_node_id: None,
        };
        insert_deposit_order(&db, &order).map_err(|e| e.to_string())?;
        {
            let fields = serde_json::json!({
                "agent_id": order.agent_id,
                "channel_id": order.channel_id,
                "base_amount": order.amount,
                "fee_amount": order.fee_amount,
                "total_amount": order.total_amount,
                "currency": order.currency,
                "escrow_id": order.escrow_id,
            });
            let _ = append_audit_log(
                &db,
                &order.buyer_node_id,
                "deposit_initiated",
                &order.id,
                order.status.as_str(),
                &order.id,
                fields,
            );
        }
        let link = get_preferred_escrow_link(&db, &agent_id).ok();
        (order, agent_id, link.flatten())
    };
    let sender = HttpSender::from_env();
    if let Some(link) = maybe_link {
        let msg = format!(
            "New deposit order {}: {:.2} {} from buyer. Please confirm receipt.",
            order.id, order.total_amount, order.currency
        );
        let _ = sender
            .send_message(&link.platform, &link.handle, &msg)
            .await;
    }
    let _ = agent_id_clone;
    Ok(order)
}

#[tauri::command]
pub async fn cmd_p2p_agent_confirm_payment(
    state: State<'_, AppState>,
    order_id: String,
    payment_proof: String,
) -> Result<DepositOrder, String> {
    let (order, maybe_link) = {
        let db = state.db.lock().map_err(|e| e.to_string())?;
        let mut order = get_deposit_order(&db, &order_id)
            .map_err(|e| e.to_string())?
            .ok_or_else(|| format!("DepositOrder '{}' not found", order_id))?;
        if order.status != DepositStatus::EscrowHeld
            && order.status != DepositStatus::PendingPayment
        {
            return Err(format!(
                "Cannot confirm payment from status {:?}",
                order.status
            ));
        }
        if payment_proof.trim().is_empty() {
            return Err("payment_proof is required".to_string());
        }
        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs() as i64;
        order.payment_proof = Some(payment_proof.trim().to_string());
        order.status = DepositStatus::PaymentConfirmed;
        order.confirmed_at = Some(now);
        let agent_id = order.agent_id.clone();
        update_deposit_order(&db, &order).map_err(|e| e.to_string())?;
        {
            let fields = serde_json::json!({
                "payment_proof": order.payment_proof,
                "confirmed_at": order.confirmed_at,
                "base_amount": order.amount,
                "fee_amount": order.fee_amount,
                "total_amount": order.total_amount,
                "currency": order.currency,
            });
            let _ = append_audit_log(
                &db,
                &order.agent_id,
                "payment_confirmed",
                &order.id,
                order.status.as_str(),
                &order.id,
                fields,
            );
        }
        let link = get_preferred_escrow_link(&db, &agent_id).ok().flatten();
        (order, link)
    };
    let sender = HttpSender::from_env();
    if let Some(link) = maybe_link {
        let msg = format!(
            "Payment confirmed for order {} with proof: {}. Ready to release escrow.",
            order.id,
            order.payment_proof.as_deref().unwrap_or("")
        );
        let _ = sender
            .send_message(&link.platform, &link.handle, &msg)
            .await;
    }
    Ok(order)
}

#[tauri::command]
pub fn cmd_p2p_agent_release_escrow(
    state: State<'_, AppState>,
    order_id: String,
) -> Result<DepositOrder, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let mut order = get_deposit_order(&db, &order_id)
        .map_err(|e| e.to_string())?
        .ok_or_else(|| format!("DepositOrder '{}' not found", order_id))?;
    if order.status != DepositStatus::PaymentConfirmed {
        return Err(format!(
            "Cannot release escrow from status {:?}",
            order.status
        ));
    }
    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs() as i64;
    order.status = DepositStatus::Completed;
    order.released_at = Some(now);
    if let Some(escrow_id) = order.escrow_id.clone() {
        let conn = db.conn.lock().map_err(|_| "Lock failed".to_string())?;
        conn.execute(
            "UPDATE escrow_holds SET status = 'released', released_at = ?1 WHERE id = ?2",
            rusqlite::params![now, escrow_id],
        )
        .map_err(|e| e.to_string())?;
    }
    update_deposit_order(&db, &order).map_err(|e| e.to_string())?;
    increment_agent_order_counters(&db, &order.agent_id, true).map_err(|e| e.to_string())?;
    {
        let fields = serde_json::json!({
            "released_at": order.released_at,
            "escrow_id": order.escrow_id,
            "base_amount": order.amount,
            "fee_amount": order.fee_amount,
            "total_amount": order.total_amount,
            "currency": order.currency,
            "buyer_node_id": order.buyer_node_id,
        });
        let _ = append_audit_log(
            &db,
            &order.agent_id,
            "escrow_released",
            &order.id,
            order.status.as_str(),
            &order.id,
            fields,
        );
    }
    Ok(order)
}

#[tauri::command]
pub fn cmd_p2p_agent_heartbeat(state: State<'_, AppState>, agent_id: String) -> Result<(), String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let _ = get_agent(&db, &agent_id)
        .map_err(|e| e.to_string())?
        .ok_or_else(|| format!("Agent '{}' not found", agent_id))?;
    heartbeat_agent(&db, &agent_id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn cmd_p2p_agent_complain(
    state: State<'_, AppState>,
    order_id: String,
    dispute_reason: String,
    evidence_hash: Option<String>,
) -> Result<DepositOrder, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    if dispute_reason.trim().is_empty() {
        return Err("dispute_reason is required".to_string());
    }
    let identity = load_first_identity(&db)
        .map_err(|e| e.to_string())?
        .ok_or_else(|| "No identity found - create identity first".to_string())?;
    let mut order = get_deposit_order(&db, &order_id)
        .map_err(|e| e.to_string())?
        .ok_or_else(|| format!("DepositOrder '{}' not found", order_id))?;
    if order.status == DepositStatus::Disputed || order.status == DepositStatus::Completed {
        return Err(format!("Cannot dispute order in status {:?}", order.status));
    }
    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs() as i64;
    if now < order.expires_at {
        return Err(format!(
            "Dispute window not reached: expires_at is {}, now is {}",
            order.expires_at, now
        ));
    }
    order.status = DepositStatus::Disputed;
    order.disputed_at = Some(now);
    order.dispute_reason = Some(dispute_reason.trim().to_string());
    order.evidence_hash = evidence_hash;
    order.complainant_node_id = Some(identity.node_id.clone());
    update_deposit_order(&db, &order).map_err(|e| e.to_string())?;
    increment_agent_order_counters(&db, &order.agent_id, false).map_err(|e| e.to_string())?;
    {
        let fields = serde_json::json!({
            "agent_id": order.agent_id,
            "disputed_at": order.disputed_at,
            "dispute_reason": order.dispute_reason,
            "evidence_hash": order.evidence_hash,
            "complainant_node_id": order.complainant_node_id,
        });
        let _ = append_audit_log(
            &db,
            &identity.node_id,
            "dispute_opened",
            &order.id,
            order.status.as_str(),
            &order.id,
            fields,
        );
    }
    Ok(order)
}

#[tauri::command]
pub fn cmd_p2p_agent_list_balances(
    state: State<'_, AppState>,
    agent_id: String,
) -> Result<Vec<AgentBalance>, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    list_agent_balances(&db, &agent_id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn cmd_p2p_agent_set_balance(
    state: State<'_, AppState>,
    agent_id: String,
    token_symbol: String,
    balance: f64,
) -> Result<AgentBalance, String> {
    let db = state.db.lock().map_err(|e| e.to_string())?;
    let _ = get_agent(&db, &agent_id)
        .map_err(|e| e.to_string())?
        .ok_or_else(|| format!("Agent '{}' not found", agent_id))?;
    let symbol = token_symbol.trim().to_uppercase();
    if symbol.is_empty() {
        return Err("token_symbol is required".to_string());
    }
    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs() as i64;
    let agent_balance = AgentBalance {
        agent_id,
        token_symbol: symbol,
        balance: balance.max(0.0),
        escrow_locked: 0.0,
        updated_at: now,
    };
    upsert_agent_balance(&db, &agent_balance).map_err(|e| e.to_string())?;
    Ok(agent_balance)
}

pub struct P2PAgentsEngine {
    _private: (),
}

impl P2PAgentsEngine {
    pub fn new() -> Self {
        P2PAgentsEngine { _private: () }
    }
}

impl Default for P2PAgentsEngine {
    fn default() -> Self {
        Self::new()
    }
}
