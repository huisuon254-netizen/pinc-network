use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum PaymentNetwork {
    Binance,
    PayPal,
    Sendwave,
    BankTransfer,
    USDT,
    MPesa,
    Skrill,
}

impl PaymentNetwork {
    pub fn as_str(&self) -> &'static str {
        match self {
            PaymentNetwork::Binance => "Binance",
            PaymentNetwork::PayPal => "PayPal",
            PaymentNetwork::Sendwave => "Sendwave",
            PaymentNetwork::BankTransfer => "BankTransfer",
            PaymentNetwork::USDT => "USDT",
            PaymentNetwork::MPesa => "MPesa",
            PaymentNetwork::Skrill => "Skrill",
        }
    }

    #[allow(clippy::should_implement_trait)]
    pub fn from_str(s: &str) -> Self {
        match s {
            "Binance" => PaymentNetwork::Binance,
            "PayPal" => PaymentNetwork::PayPal,
            "Sendwave" => PaymentNetwork::Sendwave,
            "BankTransfer" => PaymentNetwork::BankTransfer,
            "USDT" => PaymentNetwork::USDT,
            "MPesa" => PaymentNetwork::MPesa,
            "Skrill" => PaymentNetwork::Skrill,
            _ => PaymentNetwork::BankTransfer,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum CommPlatform {
    WhatsApp,
    Telegram,
    Signal,
    Discord,
    Email,
}

impl CommPlatform {
    pub fn as_str(&self) -> &'static str {
        match self {
            CommPlatform::WhatsApp => "WhatsApp",
            CommPlatform::Telegram => "Telegram",
            CommPlatform::Signal => "Signal",
            CommPlatform::Discord => "Discord",
            CommPlatform::Email => "Email",
        }
    }

    #[allow(clippy::should_implement_trait)]
    pub fn from_str(s: &str) -> Self {
        match s {
            "WhatsApp" => CommPlatform::WhatsApp,
            "Telegram" => CommPlatform::Telegram,
            "Signal" => CommPlatform::Signal,
            "Discord" => CommPlatform::Discord,
            "Email" => CommPlatform::Email,
            _ => CommPlatform::Email,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Agent {
    pub id: String,
    pub name: String,
    pub country_iso2: String,
    pub languages: Vec<String>,
    pub identity_verified: bool,
    pub kyc_level: u8,
    pub rating: f64,
    pub commission_rate: f64,
    pub volume_24h: f64,
    pub created_at: i64,
    pub node_id: Option<String>,
    pub is_online: bool,
    pub last_seen: i64,
    pub total_orders: i64,
    pub completed_orders: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PaymentChannel {
    pub id: String,
    pub agent_id: String,
    pub network: PaymentNetwork,
    pub account_identifier: String,
    pub credentials_encrypted: String,
    pub currency: String,
    pub min_amount: f64,
    pub max_amount: f64,
    pub daily_limit: f64,
    pub fee_percent: f64,
    pub enabled: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CommLink {
    pub id: String,
    pub agent_id: String,
    pub platform: CommPlatform,
    pub handle: String,
    pub verified: bool,
    pub preferred_for_escrow: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentFilter {
    pub country_iso2: Option<String>,
    pub network: Option<PaymentNetwork>,
    pub online_only: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QuoteResult {
    pub base_amount: f64,
    pub fee_amount: f64,
    pub total_amount: f64,
    pub currency: String,
    pub agent_id: String,
    pub channel_id: String,
    pub commission_included: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum DepositStatus {
    PendingPayment,
    PaymentConfirmed,
    EscrowHeld,
    Completed,
    Cancelled,
    Disputed,
}

impl DepositStatus {
    pub fn as_str(&self) -> &'static str {
        match self {
            DepositStatus::PendingPayment => "PendingPayment",
            DepositStatus::PaymentConfirmed => "PaymentConfirmed",
            DepositStatus::EscrowHeld => "EscrowHeld",
            DepositStatus::Completed => "Completed",
            DepositStatus::Cancelled => "Cancelled",
            DepositStatus::Disputed => "Disputed",
        }
    }

    #[allow(clippy::should_implement_trait)]
    pub fn from_str(s: &str) -> Self {
        match s {
            "PendingPayment" => DepositStatus::PendingPayment,
            "PaymentConfirmed" => DepositStatus::PaymentConfirmed,
            "EscrowHeld" => DepositStatus::EscrowHeld,
            "Completed" => DepositStatus::Completed,
            "Cancelled" => DepositStatus::Cancelled,
            "Disputed" => DepositStatus::Disputed,
            _ => DepositStatus::PendingPayment,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DepositOrder {
    pub id: String,
    pub agent_id: String,
    pub channel_id: String,
    pub buyer_node_id: String,
    pub amount: f64,
    pub fee_amount: f64,
    pub total_amount: f64,
    pub currency: String,
    pub escrow_id: Option<String>,
    pub status: DepositStatus,
    pub payment_proof: Option<String>,
    pub created_at: i64,
    pub confirmed_at: Option<i64>,
    pub released_at: Option<i64>,
    pub expires_at: i64,
    pub disputed_at: Option<i64>,
    pub dispute_reason: Option<String>,
    pub evidence_hash: Option<String>,
    pub complainant_node_id: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentBalance {
    pub agent_id: String,
    pub token_symbol: String,
    pub balance: f64,
    pub escrow_locked: f64,
    pub updated_at: i64,
}
