use crate::core::database::{connection::Database, errors::DatabaseError};
use crate::core::payment::{
    errors::PaymentError,
    types::{Escrow, EscrowCondition, Wallet},
};
use std::time::{SystemTime, UNIX_EPOCH};
use uuid::Uuid;

pub fn lock_escrow(
    payer: &mut Wallet,
    amount: f64,
    payee_id: &str,
    reference: &str,
    conditions: Vec<EscrowCondition>,
) -> Result<Escrow, PaymentError> {
    if amount <= 0.0 {
        return Err(PaymentError::InvalidAmount(format!("{}", amount)));
    }
    if payer.available_balance() < amount {
        return Err(PaymentError::InsufficientBalance {
            need: amount,
            have: payer.available_balance(),
        });
    }
    payer.escrow_locked += amount;
    Ok(Escrow {
        id: Uuid::new_v4().to_string(),
        payer_id: payer.node_id.clone(),
        payee_id: payee_id.to_string(),
        amount,
        currency: payer.currency.clone(),
        reference: reference.to_string(),
        locked_at: now_secs(),
        releases_at: None,
        released: false,
        returned: false,
        conditions,
    })
}

pub fn release_escrow(
    escrow: &mut Escrow,
    payer: &mut Wallet,
    payee: &mut Wallet,
) -> Result<(), PaymentError> {
    if escrow.released {
        return Err(PaymentError::AlreadyReleased);
    }
    let all_met = escrow.conditions.iter().all(|c| c.met);
    if !all_met {
        return Err(PaymentError::ConditionsNotMet);
    }
    payer.escrow_locked -= escrow.amount;
    payer.balance -= escrow.amount;
    payee.balance += escrow.amount;
    escrow.released = true;
    Ok(())
}

pub fn return_escrow(escrow: &mut Escrow, payer: &mut Wallet) -> Result<(), PaymentError> {
    if escrow.released || escrow.returned {
        return Err(PaymentError::AlreadyReleased);
    }
    payer.escrow_locked -= escrow.amount;
    escrow.returned = true;
    Ok(())
}

pub fn mark_condition_met(escrow: &mut Escrow, condition_index: usize) -> Result<(), PaymentError> {
    let c = escrow
        .conditions
        .get_mut(condition_index)
        .ok_or(PaymentError::ConditionsNotMet)?;
    c.met = true;
    c.verified_at = Some(now_secs());
    Ok(())
}

fn now_secs() -> i64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs() as i64
}

pub fn refund_escrow_db(
    db: &Database,
    escrow_id: &str,
    _refund_to_node_id: &str,
    _amount: f64,
) -> Result<(), DatabaseError> {
    let conn = db.conn.lock().map_err(|_| DatabaseError::LockFailed)?;
    let now = now_secs();
    conn.execute(
        "UPDATE escrow_holds SET status = 'refunded', released_at = ?1 WHERE id = ?2",
        rusqlite::params![now, escrow_id],
    )
    .map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;
    Ok(())
}
