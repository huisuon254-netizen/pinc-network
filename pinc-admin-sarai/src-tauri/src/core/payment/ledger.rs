use crate::core::payment::{
    errors::PaymentError,
    types::{Transaction, TxStatus, TxType, Wallet},
};
use std::time::{SystemTime, UNIX_EPOCH};
use uuid::Uuid;

pub fn transfer(
    from: &mut Wallet,
    to: &mut Wallet,
    amount: f64,
    memo: Option<String>,
) -> Result<Transaction, PaymentError> {
    if amount <= 0.0 {
        return Err(PaymentError::InvalidAmount(format!("{}", amount)));
    }
    if from.currency != to.currency {
        return Err(PaymentError::CurrencyMismatch);
    }
    if from.available_balance() < amount {
        return Err(PaymentError::InsufficientBalance {
            need: amount,
            have: from.available_balance(),
        });
    }
    from.balance -= amount;
    to.balance += amount;
    let now = now_secs();
    Ok(Transaction {
        id: Uuid::new_v4().to_string(),
        from_node: from.node_id.clone(),
        to_node: Some(to.node_id.clone()),
        amount,
        currency: from.currency.clone(),
        tx_type: TxType::Transfer,
        status: TxStatus::Confirmed,
        reference: None,
        memo,
        created_at: now,
        confirmed_at: Some(now),
        chain_tx_hash: None,
    })
}

pub fn deposit(
    wallet: &mut Wallet,
    amount: f64,
    chain_hash: &str,
) -> Result<Transaction, PaymentError> {
    if amount <= 0.0 {
        return Err(PaymentError::InvalidAmount(format!("{}", amount)));
    }
    wallet.balance += amount;
    let now = now_secs();
    Ok(Transaction {
        id: Uuid::new_v4().to_string(),
        from_node: "external".to_string(),
        to_node: Some(wallet.node_id.clone()),
        amount,
        currency: wallet.currency.clone(),
        tx_type: TxType::Deposit,
        status: TxStatus::Confirmed,
        reference: None,
        memo: None,
        created_at: now,
        confirmed_at: Some(now),
        chain_tx_hash: Some(chain_hash.to_string()),
    })
}

pub fn new_wallet(node_id: &str) -> Wallet {
    Wallet {
        node_id: node_id.to_string(),
        balance: 0.0,
        escrow_locked: 0.0,
        pending_in: 0.0,
        pending_out: 0.0,
        currency: "PINC".to_string(),
        last_updated: now_secs(),
    }
}

fn now_secs() -> i64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs() as i64
}

pub fn create_transaction(
    db: &crate::core::database::connection::Database,
    from_node: &str,
    to_node: &str,
    amount: f64,
    tx_type: TxType,
    _reference: Option<String>,
    memo: Option<String>,
) -> Result<Transaction, PaymentError> {
    let now = now_secs();
    let tx = Transaction {
        id: uuid::Uuid::new_v4().to_string(),
        from_node: from_node.to_string(),
        to_node: Some(to_node.to_string()),
        amount,
        currency: "PINC".to_string(),
        tx_type,
        status: TxStatus::Confirmed,
        reference: _reference,
        memo,
        created_at: now,
        confirmed_at: Some(now),
        chain_tx_hash: None,
    };
    crate::core::database::queries::insert_transaction(db, &tx)
        .map_err(|e| PaymentError::RollbackFailed(e.to_string()))?;
    // also upsert balances
    if from_node != "faucet" && from_node != "treasury" && from_node != "external" {
        if let Some((bal, esc, pin, pout)) =
            crate::core::database::queries::get_wallet_balance(db, from_node)
                .map_err(|e| PaymentError::RollbackFailed(e.to_string()))?
        {
            let _ = crate::core::database::queries::upsert_wallet_balance(
                db,
                from_node,
                bal - amount,
                esc,
                pin,
                pout,
            );
        }
    }
    if let Some((bal, esc, pin, pout)) =
        crate::core::database::queries::get_wallet_balance(db, to_node)
            .map_err(|e| PaymentError::RollbackFailed(e.to_string()))?
    {
        let _ = crate::core::database::queries::upsert_wallet_balance(
            db,
            to_node,
            bal + amount,
            esc,
            pin,
            pout,
        );
    } else {
        let _ = crate::core::database::queries::upsert_wallet_balance(
            db, to_node, amount, 0.0, 0.0, 0.0,
        );
    }
    Ok(tx)
}

pub fn ensure_wallet_exists(
    db: &crate::core::database::connection::Database,
    node_id: &str,
    initial: f64,
) -> Result<(), PaymentError> {
    if crate::core::database::queries::get_wallet_balance(db, node_id)
        .map_err(|e| PaymentError::RollbackFailed(e.to_string()))?
        .is_none()
    {
        crate::core::database::queries::upsert_wallet_balance(db, node_id, initial, 0.0, 0.0, 0.0)
            .map_err(|e| PaymentError::RollbackFailed(e.to_string()))?;
    }
    Ok(())
}
