use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum TxType { Deposit, Withdrawal, EscrowLock, EscrowRelease, EscrowReturn, Transfer, Fee, Reward }

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum TxStatus { Pending, Confirmed, Failed, Cancelled, Disputed }

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Transaction {
    pub id: String,
    pub from_node: String,
    pub to_node: Option<String>,
    pub amount: f64,
    pub currency: String,
    pub tx_type: TxType,
    pub status: TxStatus,
    pub reference: Option<String>, // job_id, wager_id, etc
    pub memo: Option<String>,
    pub created_at: i64,
    pub confirmed_at: Option<i64>,
    pub chain_tx_hash: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Wallet {
    pub node_id: String,
    pub balance: f64,
    pub escrow_locked: f64,
    pub pending_in: f64,
    pub pending_out: f64,
    pub currency: String,
    pub last_updated: i64,
}

impl Wallet {
    pub fn available_balance(&self) -> f64 {
        (self.balance - self.escrow_locked).max(0.0)
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Escrow {
    pub id: String,
    pub payer_id: String,
    pub payee_id: String,
    pub amount: f64,
    pub currency: String,
    pub reference: String,
    pub locked_at: i64,
    pub releases_at: Option<i64>,
    pub released: bool,
    pub returned: bool,
    pub conditions: Vec<EscrowCondition>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EscrowCondition {
    pub description: String,
    pub met: bool,
    pub verified_at: Option<i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WithdrawalRequest {
    pub id: String,
    pub node_id: String,
    pub amount: f64,
    pub destination_address: String,
    pub chain: String,
    pub status: TxStatus,
    pub created_at: i64,
    pub recipient_confirmed: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PaymentProof {
    pub tx_id: String,
    pub amount: f64,
    pub timestamp: i64,
    pub signature: Vec<u8>,
}
