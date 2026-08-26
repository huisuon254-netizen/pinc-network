use crate::core::{
    database::{connection::Database, errors::DatabaseError},
    identity::types::Identity,
    payment::types::Transaction,
};
use rusqlite::params;

pub fn pinc_id_from_node_id(node_id: &str) -> String {
    let digits: String = node_id.chars().filter(|c| c.is_ascii_digit()).collect();
    if digits.len() >= 7 {
        format!("PINC-{}-{}", &digits[0..4], &digits[4..7])
    } else if !digits.is_empty() {
        format!("PINC-{}", digits)
    } else {
        format!("PINC-{}", node_id)
    }
}

pub fn insert_identity(db: &Database, id: &Identity) -> Result<(), DatabaseError> {
    let conn = db.conn.lock().map_err(|_| DatabaseError::LockFailed)?;
    conn.execute(
        "INSERT INTO identities (id, node_id, username, first_name, last_name, date_of_birth, public_key, private_key_encrypted, fingerprint, recovery_key_hash, recovery_phrase_hash, password_hash, pin_hash, created_at) VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,?13,?14)",
        params![id.id, id.node_id, id.username, id.first_name, id.last_name, id.date_of_birth, id.public_key, id.private_key_encrypted, id.fingerprint, id.recovery_key_hash, id.recovery_phrase_hash, id.password_hash, id.pin_hash, id.created_at],
    ).map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;
    let _ = conn.execute("INSERT INTO peers (id, address, public_key, last_seen, trust_score, relay_score, online) VALUES (?1,'127.0.0.1:14029',?2,?3,100.0,100.0,1) ON CONFLICT(id) DO UPDATE SET online=1, last_seen=?3", params![id.node_id, id.public_key, id.created_at]);
    Ok(())
}

pub fn load_first_identity(db: &Database) -> Result<Option<Identity>, DatabaseError> {
    let conn = db.conn.lock().map_err(|_| DatabaseError::LockFailed)?;
    let mut stmt = conn.prepare("SELECT id, node_id, username, first_name, last_name, date_of_birth, public_key, private_key_encrypted, fingerprint, recovery_key_hash, recovery_phrase_hash, password_hash, pin_hash, created_at FROM identities LIMIT 1").map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;
    let mut rows = stmt
        .query([])
        .map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;
    if let Some(row) = rows
        .next()
        .map_err(|e| DatabaseError::QueryFailed(e.to_string()))?
    {
        Ok(Some(Identity {
            id: row
                .get(0)
                .map_err(|e| DatabaseError::QueryFailed(e.to_string()))?,
            node_id: row
                .get(1)
                .map_err(|e| DatabaseError::QueryFailed(e.to_string()))?,
            username: row
                .get(2)
                .map_err(|e| DatabaseError::QueryFailed(e.to_string()))?,
            first_name: row
                .get(3)
                .map_err(|e| DatabaseError::QueryFailed(e.to_string()))?,
            last_name: row
                .get(4)
                .map_err(|e| DatabaseError::QueryFailed(e.to_string()))?,
            date_of_birth: row
                .get(5)
                .map_err(|e| DatabaseError::QueryFailed(e.to_string()))?,
            public_key: row
                .get(6)
                .map_err(|e| DatabaseError::QueryFailed(e.to_string()))?,
            private_key_encrypted: row
                .get(7)
                .map_err(|e| DatabaseError::QueryFailed(e.to_string()))?,
            fingerprint: row
                .get(8)
                .map_err(|e| DatabaseError::QueryFailed(e.to_string()))?,
            recovery_key_hash: row
                .get(9)
                .map_err(|e| DatabaseError::QueryFailed(e.to_string()))?,
            recovery_phrase_hash: row
                .get(10)
                .map_err(|e| DatabaseError::QueryFailed(e.to_string()))?,
            password_hash: row
                .get(11)
                .map_err(|e| DatabaseError::QueryFailed(e.to_string()))?,
            pin_hash: row
                .get(12)
                .map_err(|e| DatabaseError::QueryFailed(e.to_string()))?,
            created_at: row
                .get(13)
                .map_err(|e| DatabaseError::QueryFailed(e.to_string()))?,
        }))
    } else {
        Ok(None)
    }
}

pub fn get_wallet_balance(
    db: &Database,
    node_id: &str,
) -> Result<Option<(f64, f64, f64, f64)>, DatabaseError> {
    let conn = db.conn.lock().map_err(|_| DatabaseError::LockFailed)?;
    let mut stmt = conn.prepare("SELECT balance, escrow_locked, pending_in, pending_out FROM wallet_balances WHERE node_id=?1").map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;
    let mut rows = stmt
        .query(params![node_id])
        .map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;
    if let Some(row) = rows
        .next()
        .map_err(|e| DatabaseError::QueryFailed(e.to_string()))?
    {
        Ok(Some((
            row.get(0)
                .map_err(|e| DatabaseError::QueryFailed(e.to_string()))?,
            row.get(1)
                .map_err(|e| DatabaseError::QueryFailed(e.to_string()))?,
            row.get(2)
                .map_err(|e| DatabaseError::QueryFailed(e.to_string()))?,
            row.get(3)
                .map_err(|e| DatabaseError::QueryFailed(e.to_string()))?,
        )))
    } else {
        Ok(None)
    }
}

pub fn upsert_wallet_balance(
    db: &Database,
    node_id: &str,
    balance: f64,
    escrow_locked: f64,
    pending_in: f64,
    pending_out: f64,
) -> Result<(), DatabaseError> {
    let conn = db.conn.lock().map_err(|_| DatabaseError::LockFailed)?;
    let now = chrono::Utc::now().timestamp();
    conn.execute("INSERT INTO wallet_balances (node_id, balance, escrow_locked, pending_in, pending_out, currency, updated_at) VALUES (?1,?2,?3,?4,?5,'PINC',?6) ON CONFLICT(node_id) DO UPDATE SET balance=?2, escrow_locked=?3, pending_in=?4, pending_out=?5, updated_at=?6", params![node_id, balance, escrow_locked, pending_in, pending_out, now]).map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;
    Ok(())
}

pub fn insert_transaction(db: &Database, tx: &Transaction) -> Result<(), DatabaseError> {
    let conn = db.conn.lock().map_err(|_| DatabaseError::LockFailed)?;
    conn.execute("INSERT INTO wallet_transactions (id, amount, tx_type, peer_id, status, created_at) VALUES (?1,?2,?3,?4,?5,?6)",
        params![tx.id, tx.amount, format!("{:?}", tx.tx_type), tx.to_node, format!("{:?}", tx.status), tx.created_at]).map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;
    Ok(())
}

pub fn list_transactions(db: &Database) -> Result<Vec<Transaction>, DatabaseError> {
    let conn = db.conn.lock().map_err(|_| DatabaseError::LockFailed)?;
    let mut stmt = conn.prepare("SELECT id, amount, tx_type, peer_id, status, created_at FROM wallet_transactions ORDER BY created_at DESC").map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;
    let rows = stmt
        .query_map([], |row| {
            let id: String = row.get(0)?;
            let amount: f64 = row.get(1)?;
            let tx_type_str: String = row.get(2)?;
            let peer_id: Option<String> = row.get(3)?;
            let status_str: String = row.get(4)?;
            let created_at: i64 = row.get(5)?;
            let tx_type = match tx_type_str.as_str() {
                "Deposit" => crate::core::payment::types::TxType::Deposit,
                "Withdrawal" => crate::core::payment::types::TxType::Withdrawal,
                "Transfer" => crate::core::payment::types::TxType::Transfer,
                _ => crate::core::payment::types::TxType::Transfer,
            };
            let status = match status_str.as_str() {
                "Confirmed" => crate::core::payment::types::TxStatus::Confirmed,
                "Pending" => crate::core::payment::types::TxStatus::Pending,
                _ => crate::core::payment::types::TxStatus::Pending,
            };
            Ok(Transaction {
                id,
                from_node: String::new(),
                to_node: peer_id,
                amount,
                currency: "PINC".to_string(),
                tx_type,
                status,
                reference: None,
                memo: None,
                created_at,
                confirmed_at: None,
                chain_tx_hash: None,
            })
        })
        .map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;
    let mut out = Vec::new();
    for r in rows {
        out.push(r.map_err(|e| DatabaseError::QueryFailed(e.to_string()))?);
    }
    Ok(out)
}

pub fn get_escrow(
    db: &Database,
    escrow_id: &str,
) -> Result<Option<crate::core::database::types::DbEscrowHold>, DatabaseError> {
    let conn = db.conn.lock().map_err(|_| DatabaseError::LockFailed)?;
    let mut stmt = conn.prepare("SELECT id, payer_node_id, payee_node_id, amount, reason, status, created_at, released_at FROM escrow_holds WHERE id=?1").map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;
    let mut rows = stmt
        .query(params![escrow_id])
        .map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;
    if let Some(row) = rows
        .next()
        .map_err(|e| DatabaseError::QueryFailed(e.to_string()))?
    {
        Ok(Some(crate::core::database::types::DbEscrowHold {
            id: row
                .get(0)
                .map_err(|e| DatabaseError::QueryFailed(e.to_string()))?,
            payer_node_id: row
                .get(1)
                .map_err(|e| DatabaseError::QueryFailed(e.to_string()))?,
            payee_node_id: row
                .get(2)
                .map_err(|e| DatabaseError::QueryFailed(e.to_string()))?,
            amount: row
                .get(3)
                .map_err(|e| DatabaseError::QueryFailed(e.to_string()))?,
            reason: row
                .get(4)
                .map_err(|e| DatabaseError::QueryFailed(e.to_string()))?,
            status: row
                .get(5)
                .map_err(|e| DatabaseError::QueryFailed(e.to_string()))?,
            created_at: row
                .get(6)
                .map_err(|e| DatabaseError::QueryFailed(e.to_string()))?,
            released_at: row
                .get(7)
                .map_err(|e| DatabaseError::QueryFailed(e.to_string()))?,
        }))
    } else {
        Ok(None)
    }
}

pub fn load_identity(
    db: &Database,
    id: &str,
) -> Result<crate::core::identity::types::Identity, DatabaseError> {
    let conn = db.conn.lock().map_err(|_| DatabaseError::LockFailed)?;
    let mut stmt = conn.prepare("SELECT id, node_id, username, first_name, last_name, date_of_birth, public_key, private_key_encrypted, fingerprint, recovery_key_hash, recovery_phrase_hash, password_hash, pin_hash, created_at FROM identities WHERE id=?1").map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;
    let mut rows = stmt
        .query(rusqlite::params![id])
        .map_err(|e| DatabaseError::QueryFailed(e.to_string()))?;
    if let Some(row) = rows
        .next()
        .map_err(|e| DatabaseError::QueryFailed(e.to_string()))?
    {
        Ok(crate::core::identity::types::Identity {
            id: row
                .get(0)
                .map_err(|e| DatabaseError::QueryFailed(e.to_string()))?,
            node_id: row
                .get(1)
                .map_err(|e| DatabaseError::QueryFailed(e.to_string()))?,
            username: row
                .get(2)
                .map_err(|e| DatabaseError::QueryFailed(e.to_string()))?,
            first_name: row
                .get(3)
                .map_err(|e| DatabaseError::QueryFailed(e.to_string()))?,
            last_name: row
                .get(4)
                .map_err(|e| DatabaseError::QueryFailed(e.to_string()))?,
            date_of_birth: row
                .get(5)
                .map_err(|e| DatabaseError::QueryFailed(e.to_string()))?,
            public_key: row
                .get(6)
                .map_err(|e| DatabaseError::QueryFailed(e.to_string()))?,
            private_key_encrypted: row
                .get(7)
                .map_err(|e| DatabaseError::QueryFailed(e.to_string()))?,
            fingerprint: row
                .get(8)
                .map_err(|e| DatabaseError::QueryFailed(e.to_string()))?,
            recovery_key_hash: row
                .get(9)
                .map_err(|e| DatabaseError::QueryFailed(e.to_string()))?,
            recovery_phrase_hash: row
                .get(10)
                .map_err(|e| DatabaseError::QueryFailed(e.to_string()))?,
            password_hash: row
                .get(11)
                .map_err(|e| DatabaseError::QueryFailed(e.to_string()))?,
            pin_hash: row
                .get(12)
                .map_err(|e| DatabaseError::QueryFailed(e.to_string()))?,
            created_at: row
                .get(13)
                .map_err(|e| DatabaseError::QueryFailed(e.to_string()))?,
        })
    } else {
        Err(DatabaseError::QueryFailed("not found".to_string()))
    }
}
