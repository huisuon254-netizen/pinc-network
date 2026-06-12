use std::time::{SystemTime, UNIX_EPOCH};
use uuid::Uuid;
use crate::core::payment::{errors::PaymentError, types::{Transaction, TxStatus, TxType, Wallet}};

pub fn transfer(
    from: &mut Wallet, to: &mut Wallet, amount: f64, memo: Option<String>,
) -> Result<Transaction, PaymentError> {
    if amount <= 0.0 { return Err(PaymentError::InvalidAmount(format!("{}", amount))); }
    if from.currency != to.currency { return Err(PaymentError::CurrencyMismatch); }
    if from.available_balance() < amount {
        return Err(PaymentError::InsufficientBalance { need: amount, have: from.available_balance() });
    }
    from.balance -= amount;
    to.balance += amount;
    let now = now_secs();
    Ok(Transaction {
        id: Uuid::new_v4().to_string(), from_node: from.node_id.clone(),
        to_node: Some(to.node_id.clone()), amount, currency: from.currency.clone(),
        tx_type: TxType::Transfer, status: TxStatus::Confirmed,
        reference: None, memo, created_at: now, confirmed_at: Some(now),
        chain_tx_hash: None,
    })
}

pub fn deposit(wallet: &mut Wallet, amount: f64, chain_hash: &str) -> Result<Transaction, PaymentError> {
    if amount <= 0.0 { return Err(PaymentError::InvalidAmount(format!("{}", amount))); }
    wallet.balance += amount;
    let now = now_secs();
    Ok(Transaction {
        id: Uuid::new_v4().to_string(), from_node: "external".to_string(),
        to_node: Some(wallet.node_id.clone()), amount, currency: wallet.currency.clone(),
        tx_type: TxType::Deposit, status: TxStatus::Confirmed,
        reference: None, memo: None, created_at: now, confirmed_at: Some(now),
        chain_tx_hash: Some(chain_hash.to_string()),
    })
}

pub fn new_wallet(node_id: &str) -> Wallet {
    Wallet {
        node_id: node_id.to_string(), balance: 0.0, escrow_locked: 0.0,
        pending_in: 0.0, pending_out: 0.0, currency: "PINC".to_string(),
        last_updated: now_secs(),
    }
}

fn now_secs() -> i64 {
    SystemTime::now().duration_since(UNIX_EPOCH).unwrap_or_default().as_secs() as i64
}
