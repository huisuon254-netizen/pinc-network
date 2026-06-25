use std::time::{SystemTime, UNIX_EPOCH};

use crate::core::database::connection::Database;
use crate::core::payment::errors::PaymentError;
use crate::core::payment::ledger;

pub const FAUCET_MAX_PER_REQUEST: f64 = 1000.0;
pub const FAUCET_DAILY_LIMIT: f64 = 5000.0;
pub const WELCOME_BONUS: f64 = 1000.0;

fn now_secs() -> i64 {
    SystemTime::now().duration_since(UNIX_EPOCH).unwrap_or_default().as_secs() as i64
}

pub fn faucet_request(
    db: &Database,
    node_id: &str,
    amount: f64,
) -> Result<ledger::Transaction, PaymentError> {
    if amount <= 0.0 {
        return Err(PaymentError::InvalidAmount(format!("{}", amount)));
    }
    if amount > FAUCET_MAX_PER_REQUEST {
        return Err(PaymentError::WithdrawalRejected(
            format!("Faucet limit is {} PINC per request", FAUCET_MAX_PER_REQUEST),
        ));
    }

    let conn = db.conn.lock().map_err(|e| PaymentError::RollbackFailed(e.to_string()))?;

    let today_start = {
        let now = now_secs();
        now - (now % 86400)
    };

    let daily_total: f64 = conn.query_row(
        "SELECT COALESCE(SUM(amount), 0.0) FROM faucet_claims WHERE node_id = ?1 AND claimed_at >= ?2",
        rusqlite::params![node_id, today_start],
        |r| r.get(0),
    ).map_err(|e| PaymentError::RollbackFailed(e.to_string()))?;

    drop(conn);

    if daily_total + amount > FAUCET_DAILY_LIMIT {
        return Err(PaymentError::WithdrawalRejected(
            format!("Daily faucet limit is {} PINC. Already claimed {:.2} today.",
                FAUCET_DAILY_LIMIT, daily_total),
        ));
    }

    let tx = ledger::create_transaction(
        db,
        "faucet",
        node_id,
        amount,
        crate::core::payment::types::TxType::Deposit,
        None,
        Some("faucet dispense"),
    )?;

    let conn = db.conn.lock().map_err(|e| PaymentError::RollbackFailed(e.to_string()))?;
    let now = now_secs();
    conn.execute(
        "INSERT INTO faucet_claims (node_id, amount, claimed_at) VALUES (?1, ?2, ?3)",
        rusqlite::params![node_id, amount, now],
    ).map_err(|e| PaymentError::RollbackFailed(e.to_string()))?;

    Ok(tx)
}

pub fn welcome_bonus(db: &Database, node_id: &str) -> Result<(), PaymentError> {
    ledger::ensure_wallet_exists(db, node_id, WELCOME_BONUS)?;

    ledger::create_transaction(
        db,
        "treasury",
        node_id,
        WELCOME_BONUS,
        crate::core::payment::types::TxType::Reward,
        None,
        Some("welcome bonus"),
    )?;

    Ok(())
}

pub fn get_treasury_info(db: &Database) -> Result<serde_json::Value, PaymentError> {
    let conn = db.conn.lock().map_err(|e| PaymentError::RollbackFailed(e.to_string()))?;

    let total_circulating: f64 = conn.query_row(
        "SELECT COALESCE(SUM(balance), 0.0) FROM wallet_balances",
        [],
        |r| r.get(0),
    ).unwrap_or(0.0);

    let total_escrowed: f64 = conn.query_row(
        "SELECT COALESCE(SUM(escrow_locked), 0.0) FROM wallet_balances",
        [],
        |r| r.get(0),
    ).unwrap_or(0.0);

    let total_wallets: i64 = conn.query_row(
        "SELECT COUNT(*) FROM wallet_balances",
        [],
        |r| r.get(0),
    ).unwrap_or(0);

    let today_start = {
        let now = now_secs();
        now - (now % 86400)
    };

    let today_faucet: f64 = conn.query_row(
        "SELECT COALESCE(SUM(amount), 0.0) FROM faucet_claims WHERE claimed_at >= ?1",
        rusqlite::params![today_start],
        |r| r.get(0),
    ).unwrap_or(0.0);

    Ok(serde_json::json!({
        "total_circulating": total_circulating,
        "total_escrowed": total_escrowed,
        "total_wallets": total_wallets,
        "today_faucet_dispensed": today_faucet,
        "faucet_max_per_request": FAUCET_MAX_PER_REQUEST,
        "faucet_daily_limit": FAUCET_DAILY_LIMIT,
        "welcome_bonus": WELCOME_BONUS,
    }))
}
