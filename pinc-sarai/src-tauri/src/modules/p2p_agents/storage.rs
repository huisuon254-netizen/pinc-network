use crate::core::database::{connection::Database, errors::DatabaseError};
use crate::modules::p2p_agents::models::*;
use rusqlite::params;
use std::sync::Arc;
use uuid::Uuid;

pub fn insert_agent(db: &Database, agent: &Agent) -> Result<(), DatabaseError> {
    let conn = db.conn.lock().map_err(|_| DatabaseError::LockFailed)?;
    let languages_json = serde_json::to_string(&agent.languages)
        .map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;
    conn.execute(
        "INSERT INTO p2p_agents
         (id, name, country_iso2, languages, identity_verified, kyc_level,
          rating, commission_rate, volume_24h, created_at,
          node_id, is_online, last_seen, total_orders, completed_orders)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15)",
        params![
            agent.id,
            agent.name,
            agent.country_iso2,
            languages_json,
            agent.identity_verified as i64,
            agent.kyc_level as i64,
            agent.rating,
            agent.commission_rate,
            agent.volume_24h,
            agent.created_at,
            agent.node_id,
            agent.is_online as i64,
            agent.last_seen,
            agent.total_orders,
            agent.completed_orders
        ],
    )
    .map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;
    Ok(())
}

pub fn update_agent(db: &Database, agent: &Agent) -> Result<(), DatabaseError> {
    let conn = db.conn.lock().map_err(|_| DatabaseError::LockFailed)?;
    let languages_json = serde_json::to_string(&agent.languages)
        .map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;
    conn.execute(
        "UPDATE p2p_agents SET
         name = ?2, country_iso2 = ?3, languages = ?4, identity_verified = ?5,
         kyc_level = ?6, rating = ?7, commission_rate = ?8, volume_24h = ?9
         WHERE id = ?1",
        params![
            agent.id,
            agent.name,
            agent.country_iso2,
            languages_json,
            agent.identity_verified as i64,
            agent.kyc_level as i64,
            agent.rating,
            agent.commission_rate,
            agent.volume_24h,
        ],
    )
    .map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;
    Ok(())
}

pub fn delete_agent(db: &Database, agent_id: &str) -> Result<(), DatabaseError> {
    let conn = db.conn.lock().map_err(|_| DatabaseError::LockFailed)?;
    conn.execute("DELETE FROM p2p_agents WHERE id = ?1", params![agent_id])
        .map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;
    Ok(())
}

pub fn get_agent(db: &Database, agent_id: &str) -> Result<Option<Agent>, DatabaseError> {
    let conn = db.conn.lock().map_err(|_| DatabaseError::LockFailed)?;
    let mut stmt = conn
        .prepare(
            "SELECT id, name, country_iso2, languages, identity_verified, kyc_level,
                    rating, commission_rate, volume_24h, created_at,
                    node_id, is_online, last_seen, total_orders, completed_orders
             FROM p2p_agents WHERE id = ?1",
        )
        .map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;
    let mut rows = stmt
        .query_map(params![agent_id], |row| {
            let languages_str: String = row.get(3)?;
            let languages: Vec<String> = serde_json::from_str(&languages_str).unwrap_or_default();
            Ok(Agent {
                id: row.get(0)?,
                name: row.get(1)?,
                country_iso2: row.get(2)?,
                languages,
                identity_verified: row.get::<_, i64>(4)? != 0,
                kyc_level: row.get::<_, i64>(5)? as u8,
                rating: row.get(6)?,
                commission_rate: row.get(7)?,
                volume_24h: row.get(8)?,
                created_at: row.get(9)?,
                node_id: row.get(10)?,
                is_online: row.get::<_, i64>(11)? != 0,
                last_seen: row.get(12)?,
                total_orders: row.get(13)?,
                completed_orders: row.get(14)?,
            })
        })
        .map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;
    match rows.next() {
        Some(Ok(a)) => Ok(Some(a)),
        Some(Err(e)) => Err(DatabaseError::QueryFailed(e.to_string())),
        None => Ok(None),
    }
}

pub fn list_agents(db: &Database, filter: &AgentFilter) -> Result<Vec<Agent>, DatabaseError> {
    let conn = db.conn.lock().map_err(|_| DatabaseError::LockFailed)?;

    let mut sql = String::from(
        "SELECT DISTINCT a.id, a.name, a.country_iso2, a.languages, a.identity_verified,
                a.kyc_level, a.rating, a.commission_rate, a.volume_24h, a.created_at,
                a.node_id, a.is_online, a.last_seen, a.total_orders, a.completed_orders
         FROM p2p_agents a",
    );

    let mut where_clauses: Vec<String> = Vec::new();
    let mut params_vec: Vec<Box<dyn rusqlite::ToSql>> = Vec::new();

    if let Some(network) = &filter.network {
        sql.push_str(" LEFT JOIN p2p_payment_channels c ON a.id = c.agent_id");
        where_clauses.push("c.network = ?".to_string());
        params_vec.push(Box::new(network.as_str().to_string()));
    }

    if let Some(country) = &filter.country_iso2 {
        where_clauses.push("a.country_iso2 = ?".to_string());
        params_vec.push(Box::new(country.clone()));
    }

    if filter.online_only.unwrap_or(false) {
        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs() as i64;
        let cutoff = now - 300;
        where_clauses.push("a.is_online = 1".to_string());
        where_clauses.push("a.last_seen >= ?".to_string());
        params_vec.push(Box::new(cutoff));
    }

    if !where_clauses.is_empty() {
        sql.push_str(" WHERE ");
        sql.push_str(&where_clauses.join(" AND "));
    }

    sql.push_str(
        " ORDER BY (CASE WHEN a.total_orders = 0 THEN 0 ELSE a.completed_orders * 1.0 / a.total_orders END) DESC,
                  a.rating DESC, a.volume_24h DESC",
    );

    let mut stmt = conn
        .prepare(&sql)
        .map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;

    let param_refs: Vec<&dyn rusqlite::ToSql> = params_vec.iter().map(|p| p.as_ref()).collect();

    let rows = stmt
        .query_map(param_refs.as_slice(), |row| {
            let languages_str: String = row.get(3)?;
            let languages: Vec<String> = serde_json::from_str(&languages_str).unwrap_or_default();
            Ok(Agent {
                id: row.get(0)?,
                name: row.get(1)?,
                country_iso2: row.get(2)?,
                languages,
                identity_verified: row.get::<_, i64>(4)? != 0,
                kyc_level: row.get::<_, i64>(5)? as u8,
                rating: row.get(6)?,
                commission_rate: row.get(7)?,
                volume_24h: row.get(8)?,
                created_at: row.get(9)?,
                node_id: row.get(10)?,
                is_online: row.get::<_, i64>(11)? != 0,
                last_seen: row.get(12)?,
                total_orders: row.get(13)?,
                completed_orders: row.get(14)?,
            })
        })
        .map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;

    rows.map(|r| r.map_err(|e| DatabaseError::QueryFailed(e.to_string())))
        .collect()
}

pub fn insert_payment_channel(
    db: &Database,
    channel: &PaymentChannel,
) -> Result<(), DatabaseError> {
    let conn = db.conn.lock().map_err(|_| DatabaseError::LockFailed)?;
    conn.execute(
        "INSERT INTO p2p_payment_channels
         (id, agent_id, network, account_identifier, credentials_encrypted,
          currency, min_amount, max_amount, daily_limit, fee_percent, enabled)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)",
        params![
            channel.id,
            channel.agent_id,
            channel.network.as_str(),
            channel.account_identifier,
            channel.credentials_encrypted,
            channel.currency,
            channel.min_amount,
            channel.max_amount,
            channel.daily_limit,
            channel.fee_percent,
            channel.enabled as i64,
        ],
    )
    .map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;
    Ok(())
}

pub fn unbind_payment_channel(db: &Database, channel_id: &str) -> Result<(), DatabaseError> {
    let conn = db.conn.lock().map_err(|_| DatabaseError::LockFailed)?;
    conn.execute(
        "DELETE FROM p2p_payment_channels WHERE id = ?1",
        params![channel_id],
    )
    .map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;
    Ok(())
}

pub fn list_payment_channels(
    db: &Database,
    agent_id: &str,
) -> Result<Vec<PaymentChannel>, DatabaseError> {
    let conn = db.conn.lock().map_err(|_| DatabaseError::LockFailed)?;
    let mut stmt = conn
        .prepare(
            "SELECT id, agent_id, network, account_identifier, credentials_encrypted,
                    currency, min_amount, max_amount, daily_limit, fee_percent, enabled
             FROM p2p_payment_channels WHERE agent_id = ?1 ORDER BY enabled DESC, network ASC",
        )
        .map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;
    let rows = stmt
        .query_map(params![agent_id], |row| {
            Ok(PaymentChannel {
                id: row.get(0)?,
                agent_id: row.get(1)?,
                network: PaymentNetwork::from_str(&row.get::<_, String>(2)?),
                account_identifier: row.get(3)?,
                credentials_encrypted: row.get(4)?,
                currency: row.get(5)?,
                min_amount: row.get(6)?,
                max_amount: row.get(7)?,
                daily_limit: row.get(8)?,
                fee_percent: row.get(9)?,
                enabled: row.get::<_, i64>(10)? != 0,
            })
        })
        .map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;
    rows.map(|r| r.map_err(|e| DatabaseError::QueryFailed(e.to_string())))
        .collect()
}

pub fn get_payment_channel(
    db: &Database,
    channel_id: &str,
) -> Result<Option<PaymentChannel>, DatabaseError> {
    let conn = db.conn.lock().map_err(|_| DatabaseError::LockFailed)?;
    let mut stmt = conn
        .prepare(
            "SELECT id, agent_id, network, account_identifier, credentials_encrypted,
                    currency, min_amount, max_amount, daily_limit, fee_percent, enabled
             FROM p2p_payment_channels WHERE id = ?1",
        )
        .map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;
    let mut rows = stmt
        .query_map(params![channel_id], |row| {
            Ok(PaymentChannel {
                id: row.get(0)?,
                agent_id: row.get(1)?,
                network: PaymentNetwork::from_str(&row.get::<_, String>(2)?),
                account_identifier: row.get(3)?,
                credentials_encrypted: row.get(4)?,
                currency: row.get(5)?,
                min_amount: row.get(6)?,
                max_amount: row.get(7)?,
                daily_limit: row.get(8)?,
                fee_percent: row.get(9)?,
                enabled: row.get::<_, i64>(10)? != 0,
            })
        })
        .map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;
    match rows.next() {
        Some(Ok(c)) => Ok(Some(c)),
        Some(Err(e)) => Err(DatabaseError::QueryFailed(e.to_string())),
        None => Ok(None),
    }
}

pub fn insert_comm_link(db: &Database, link: &CommLink) -> Result<(), DatabaseError> {
    let conn = db.conn.lock().map_err(|_| DatabaseError::LockFailed)?;
    conn.execute(
        "INSERT INTO p2p_comm_links
         (id, agent_id, platform, handle, verified, preferred_for_escrow)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        params![
            link.id,
            link.agent_id,
            link.platform.as_str(),
            link.handle,
            link.verified as i64,
            link.preferred_for_escrow as i64,
        ],
    )
    .map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;
    Ok(())
}

pub fn unbind_comm_link(db: &Database, link_id: &str) -> Result<(), DatabaseError> {
    let conn = db.conn.lock().map_err(|_| DatabaseError::LockFailed)?;
    conn.execute("DELETE FROM p2p_comm_links WHERE id = ?1", params![link_id])
        .map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;
    Ok(())
}

pub fn list_comm_links(db: &Database, agent_id: &str) -> Result<Vec<CommLink>, DatabaseError> {
    let conn = db.conn.lock().map_err(|_| DatabaseError::LockFailed)?;
    let mut stmt = conn
        .prepare(
            "SELECT id, agent_id, platform, handle, verified, preferred_for_escrow
             FROM p2p_comm_links WHERE agent_id = ?1 ORDER BY preferred_for_escrow DESC, platform ASC",
        )
        .map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;
    let rows = stmt
        .query_map(params![agent_id], |row| {
            Ok(CommLink {
                id: row.get(0)?,
                agent_id: row.get(1)?,
                platform: CommPlatform::from_str(&row.get::<_, String>(2)?),
                handle: row.get(3)?,
                verified: row.get::<_, i64>(4)? != 0,
                preferred_for_escrow: row.get::<_, i64>(5)? != 0,
            })
        })
        .map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;
    rows.map(|r| r.map_err(|e| DatabaseError::QueryFailed(e.to_string())))
        .collect()
}

pub fn get_preferred_escrow_link(
    db: &Database,
    agent_id: &str,
) -> Result<Option<CommLink>, DatabaseError> {
    let conn = db.conn.lock().map_err(|_| DatabaseError::LockFailed)?;
    let mut stmt = conn
        .prepare(
            "SELECT id, agent_id, platform, handle, verified, preferred_for_escrow
             FROM p2p_comm_links WHERE agent_id = ?1 AND preferred_for_escrow = 1 LIMIT 1",
        )
        .map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;
    let mut rows = stmt
        .query_map(params![agent_id], |row| {
            Ok(CommLink {
                id: row.get(0)?,
                agent_id: row.get(1)?,
                platform: CommPlatform::from_str(&row.get::<_, String>(2)?),
                handle: row.get(3)?,
                verified: row.get::<_, i64>(4)? != 0,
                preferred_for_escrow: row.get::<_, i64>(5)? != 0,
            })
        })
        .map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;
    match rows.next() {
        Some(Ok(l)) => Ok(Some(l)),
        Some(Err(e)) => Err(DatabaseError::QueryFailed(e.to_string())),
        None => Ok(None),
    }
}

pub fn insert_deposit_order(db: &Database, order: &DepositOrder) -> Result<(), DatabaseError> {
    let conn = db.conn.lock().map_err(|_| DatabaseError::LockFailed)?;
    conn.execute(
        "INSERT INTO p2p_deposit_orders
         (id, agent_id, channel_id, buyer_node_id, amount, fee_amount, total_amount,
          currency, escrow_id, status, payment_proof, created_at, confirmed_at, released_at,
          expires_at, disputed_at, dispute_reason, evidence_hash, complainant_node_id)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17, ?18, ?19)",
        params![
            order.id,
            order.agent_id,
            order.channel_id,
            order.buyer_node_id,
            order.amount,
            order.fee_amount,
            order.total_amount,
            order.currency,
            order.escrow_id,
            order.status.as_str(),
            order.payment_proof,
            order.created_at,
            order.confirmed_at,
            order.released_at,
            order.expires_at,
            order.disputed_at,
            order.dispute_reason,
            order.evidence_hash,
            order.complainant_node_id,
        ],
    )
    .map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;
    Ok(())
}

pub fn update_deposit_order(db: &Database, order: &DepositOrder) -> Result<(), DatabaseError> {
    let conn = db.conn.lock().map_err(|_| DatabaseError::LockFailed)?;
    conn.execute(
        "UPDATE p2p_deposit_orders SET
         status = ?2, escrow_id = ?3, payment_proof = ?4,
         confirmed_at = ?5, released_at = ?6,
         expires_at = ?7, disputed_at = ?8, dispute_reason = ?9,
         evidence_hash = ?10, complainant_node_id = ?11
         WHERE id = ?1",
        params![
            order.id,
            order.status.as_str(),
            order.escrow_id,
            order.payment_proof,
            order.confirmed_at,
            order.released_at,
            order.expires_at,
            order.disputed_at,
            order.dispute_reason,
            order.evidence_hash,
            order.complainant_node_id,
        ],
    )
    .map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;
    Ok(())
}

pub fn get_deposit_order(
    db: &Database,
    order_id: &str,
) -> Result<Option<DepositOrder>, DatabaseError> {
    let conn = db.conn.lock().map_err(|_| DatabaseError::LockFailed)?;
    let mut stmt = conn
        .prepare(
            "SELECT id, agent_id, channel_id, buyer_node_id, amount, fee_amount, total_amount,
                    currency, escrow_id, status, payment_proof, created_at, confirmed_at, released_at,
                    expires_at, disputed_at, dispute_reason, evidence_hash, complainant_node_id
             FROM p2p_deposit_orders WHERE id = ?1",
        )
        .map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;
    let mut rows = stmt
        .query_map(params![order_id], |row| {
            Ok(DepositOrder {
                id: row.get(0)?,
                agent_id: row.get(1)?,
                channel_id: row.get(2)?,
                buyer_node_id: row.get(3)?,
                amount: row.get(4)?,
                fee_amount: row.get(5)?,
                total_amount: row.get(6)?,
                currency: row.get(7)?,
                escrow_id: row.get(8)?,
                status: DepositStatus::from_str(&row.get::<_, String>(9)?),
                payment_proof: row.get(10)?,
                created_at: row.get(11)?,
                confirmed_at: row.get(12)?,
                released_at: row.get(13)?,
                expires_at: row.get::<_, Option<i64>>(14)?.unwrap_or(0),
                disputed_at: row.get(15)?,
                dispute_reason: row.get(16)?,
                evidence_hash: row.get(17)?,
                complainant_node_id: row.get(18)?,
            })
        })
        .map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;
    match rows.next() {
        Some(Ok(o)) => Ok(Some(o)),
        Some(Err(e)) => Err(DatabaseError::QueryFailed(e.to_string())),
        None => Ok(None),
    }
}

pub fn heartbeat_agent(db: &Database, agent_id: &str) -> Result<(), DatabaseError> {
    let conn = db.conn.lock().map_err(|_| DatabaseError::LockFailed)?;
    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs() as i64;
    conn.execute(
        "UPDATE p2p_agents SET is_online = 1, last_seen = ?2 WHERE id = ?1",
        params![agent_id, now],
    )
    .map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;
    Ok(())
}

pub fn mark_stale_offline(db: &Database) -> Result<usize, DatabaseError> {
    let conn = db.conn.lock().map_err(|_| DatabaseError::LockFailed)?;
    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs() as i64;
    let cutoff = now - 300;
    let affected = conn
        .execute(
            "UPDATE p2p_agents SET is_online = 0 WHERE is_online = 1 AND last_seen < ?1",
            params![cutoff],
        )
        .map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;
    Ok(affected)
}

pub fn increment_agent_order_counters(
    db: &Database,
    agent_id: &str,
    was_completed: bool,
) -> Result<(), DatabaseError> {
    let conn = db.conn.lock().map_err(|_| DatabaseError::LockFailed)?;
    if was_completed {
        conn.execute(
            "UPDATE p2p_agents SET total_orders = total_orders + 1, completed_orders = completed_orders + 1 WHERE id = ?1",
            params![agent_id],
        )
        .map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;
    } else {
        conn.execute(
            "UPDATE p2p_agents SET total_orders = total_orders + 1 WHERE id = ?1",
            params![agent_id],
        )
        .map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;
    }
    Ok(())
}

pub fn list_agent_balances(
    db: &Database,
    agent_id: &str,
) -> Result<Vec<AgentBalance>, DatabaseError> {
    let conn = db.conn.lock().map_err(|_| DatabaseError::LockFailed)?;
    let mut stmt = conn
        .prepare(
            "SELECT agent_id, token_symbol, balance, escrow_locked, updated_at
             FROM p2p_agent_balances WHERE agent_id = ?1 ORDER BY token_symbol ASC",
        )
        .map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;
    let rows = stmt
        .query_map(params![agent_id], |row| {
            Ok(AgentBalance {
                agent_id: row.get(0)?,
                token_symbol: row.get(1)?,
                balance: row.get(2)?,
                escrow_locked: row.get(3)?,
                updated_at: row.get(4)?,
            })
        })
        .map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;
    rows.map(|r| r.map_err(|e| DatabaseError::QueryFailed(e.to_string())))
        .collect()
}

pub fn upsert_agent_balance(db: &Database, balance: &AgentBalance) -> Result<(), DatabaseError> {
    let conn = db.conn.lock().map_err(|_| DatabaseError::LockFailed)?;
    let existing: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM p2p_agent_balances WHERE agent_id = ?1",
            params![balance.agent_id],
            |row| row.get(0),
        )
        .map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;
    let already_has_token: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM p2p_agent_balances WHERE agent_id = ?1 AND token_symbol = ?2",
            params![balance.agent_id, balance.token_symbol],
            |row| row.get(0),
        )
        .map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;
    if already_has_token == 0 && existing >= 5 {
        return Err(DatabaseError::QueryFailed(format!(
            "Agent '{}' already has the maximum of 5 token balances",
            balance.agent_id
        )));
    }
    conn.execute(
        "INSERT INTO p2p_agent_balances (agent_id, token_symbol, balance, escrow_locked, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5)
         ON CONFLICT(agent_id, token_symbol) DO UPDATE SET
           balance = excluded.balance,
           escrow_locked = excluded.escrow_locked,
           updated_at = excluded.updated_at",
        params![
            balance.agent_id,
            balance.token_symbol,
            balance.balance,
            balance.escrow_locked,
            balance.updated_at
        ],
    )
    .map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;
    Ok(())
}

pub fn generate_id(prefix: &str) -> String {
    format!("{}-{}", prefix, Uuid::new_v4())
}

pub fn calculate_quote(agent: &Agent, channel: &PaymentChannel, base_amount: f64) -> QuoteResult {
    let channel_fee = base_amount * (channel.fee_percent / 100.0);
    let commission = base_amount * (agent.commission_rate / 100.0);
    let total_fee = channel_fee + commission;

    QuoteResult {
        base_amount,
        fee_amount: total_fee,
        total_amount: base_amount + total_fee,
        currency: channel.currency.clone(),
        agent_id: agent.id.clone(),
        channel_id: channel.id.clone(),
        commission_included: true,
    }
}

// ─── CommLink Sender Trait ────────────────────────────────────────────────────

#[async_trait::async_trait]
pub trait CommLinkSender: Send + Sync {
    async fn send_message(
        &self,
        platform: &CommPlatform,
        handle: &str,
        message: &str,
    ) -> Result<(), String>;
}

pub struct HttpSender {
    pub whatsapp_gateway_url: String,
    pub telegram_bot_token: String,
}

impl HttpSender {
    pub fn from_env() -> Self {
        let whatsapp_gateway_url = std::env::var("PINC_WHATSAPP_GATEWAY_URL")
            .unwrap_or_else(|_| "http://localhost:3001/whatsapp/send".to_string());
        let telegram_bot_token = std::env::var("PINC_TELEGRAM_BOT_TOKEN")
            .unwrap_or_else(|_| "stub-telegram-bot-token".to_string());
        HttpSender {
            whatsapp_gateway_url,
            telegram_bot_token,
        }
    }
}

impl Default for HttpSender {
    fn default() -> Self {
        Self::from_env()
    }
}

#[async_trait::async_trait]
impl CommLinkSender for HttpSender {
    async fn send_message(
        &self,
        platform: &CommPlatform,
        handle: &str,
        message: &str,
    ) -> Result<(), String> {
        let client = reqwest::Client::builder()
            .timeout(std::time::Duration::from_secs(15))
            .build()
            .map_err(|e| e.to_string())?;

        match platform {
            CommPlatform::WhatsApp => {
                let payload = serde_json::json!({
                    "to": handle,
                    "message": message,
                });
                let _ = client
                    .post(&self.whatsapp_gateway_url)
                    .json(&payload)
                    .send()
                    .await;
                Ok(())
            }
            CommPlatform::Telegram => {
                let url = format!(
                    "https://api.telegram.org/bot{}/sendMessage",
                    self.telegram_bot_token
                );
                let payload = serde_json::json!({
                    "chat_id": handle,
                    "text": message,
                });
                let _ = client.post(&url).json(&payload).send().await;
                Ok(())
            }
            CommPlatform::Signal | CommPlatform::Discord | CommPlatform::Email => {
                log::warn!(
                    "CommLinkSender: stub HTTP call for {:?} to {} (not implemented)",
                    platform,
                    handle
                );
                Ok(())
            }
        }
    }
}

pub fn new_http_sender_arc() -> Arc<dyn CommLinkSender> {
    Arc::new(HttpSender::from_env())
}
