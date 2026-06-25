use serde::{Serialize, Deserialize};
use std::collections::HashMap;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Bridge {
    pub id: String,
    pub name: String,
    pub source_chain: String,
    pub target_chain: String,
    pub bridge_type: BridgeType,
    pub token: Token,
    pub bridge_address: String,
    pub min_amount: f64,
    pub max_amount: f64,
    pub fee_rate: f64,
    pub estimated_time: u32,
    pub status: BridgeStatus,
    pub total_locked: f64,
    pub total_transferred: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum BridgeType {
    Relay,
    Hop,
    Hashlock,
    Inbound,
    Outbound,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum BridgeStatus {
    Active,
    Maintenance,
    Closed,
    EmergencyStop,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BridgeTransaction {
    pub id: String,
    pub bridge_id: String,
    pub user: String,
    pub source_chain: String,
    pub target_chain: String,
    pub token: Token,
    pub amount: f64,
    pub fee: f64,
    pub recipient_address: String,
    pub status: BridgeTransactionStatus,
    pub source_tx_hash: String,
    pub target_tx_hash: String,
    pub created_at: i64,
    pub completed_at: Option<i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum BridgeTransactionStatus {
    Pending,
    Bridging,
    Completed,
    Failed,
    Cancelled,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BridgeQuote {
    pub bridge_id: String,
    pub token: Token,
    pub amount: f64,
    pub fee: f64,
    pub amount_out: f64,
    pub estimated_time: u32,
}

pub struct BridgeManager {
    pub bridges: HashMap<String, Bridge>,
    pub transactions: HashMap<String, BridgeTransaction>,
    pub supported_chains: Vec<String>,
}

impl BridgeManager {
    pub fn new() -> Self {
        let mut bridges: HashMap<String, Bridge> = HashMap::new();
        bridges.insert(
            "eth-poly".to_string(),
            Bridge {
                id: "bridge-eth-poly".to_string(),
                name: "ETH -> Polygon Bridge".to_string(),
                source_chain: "ethereum".to_string(),
                target_chain: "polygon".to_string(),
                bridge_type: BridgeType::Hop,
                token: Token {
                    symbol: "ETH".to_string(),
                    name: "Ethereum".to_string(),
                    address: "0xEeeeeEeeeEeEeeEeEeEeEeEeEeeeeEeeEeEeEeE".to_string(),
                    decimals: 18,
                    chain: "ethereum".to_string(),
                    price: 1800.0,
                    volume_24h: 0.0,
                    liquidity: 0.0,
                },
                bridge_address: "0x8e592B8d8aE5D7B5e2F5c3A6F7B9c1D4E2F3a5B7".to_string(),
                min_amount: 0.01,
                max_amount: 1000.0,
                fee_rate: 0.001,
                estimated_time: 300,
                status: BridgeStatus::Active,
                total_locked: 0.0,
                total_transferred: 0.0,
            },
        );
        bridges.insert(
            "poly-bsc".to_string(),
            Bridge {
                id: "bridge-poly-bsc".to_string(),
                name: "Polygon -> BSC Bridge".to_string(),
                source_chain: "polygon".to_string(),
                target_chain: "bsc".to_string(),
                bridge_type: BridgeType::Relay,
                token: Token {
                    symbol: "MATIC".to_string(),
                    name: "Polygon".to_string(),
                    address: "0x0000000000000000000000000000000000001010".to_string(),
                    decimals: 18,
                    chain: "polygon".to_string(),
                    price: 0.5,
                    volume_24h: 0.0,
                    liquidity: 0.0,
                },
                bridge_address: "0xC9Bc05689Ba42d8f9e5c734C371e2b6E77e88e6d".to_string(),
                min_amount: 0.1,
                max_amount: 100.0,
                fee_rate: 0.001,
                estimated_time: 180,
                status: BridgeStatus::Active,
                total_locked: 0.0,
                total_transferred: 0.0,
            },
        );
        bridges.insert(
            "bsc-base".to_string(),
            Bridge {
                id: "bridge-bsc-base".to_string(),
                name: "BSC -> Base Bridge".to_string(),
                source_chain: "bsc".to_string(),
                target_chain: "base".to_string(),
                bridge_type: BridgeType::Hashlock,
                token: Token {
                    symbol: "BNB".to_string(),
                    name: "Binance Smart Chain".to_string(),
                    address: "0xbb4Cd9CaccbN63b2e3d2d6d19D4f02b9502908b4".to_string(),
                    decimals: 18,
                    chain: "bsc".to_string(),
                    price: 300.0,
                    volume_24h: 0.0,
                    liquidity: 0.0,
                },
                bridge_address: "0x3Fa2953e5a4a7a2c8e5b2a1d4f6b8c9E1A3D7F5".to_string(),
                min_amount: 0.01,
                max_amount: 500.0,
                fee_rate: 0.001,
                estimated_time: 240,
                status: BridgeStatus::Active,
                total_locked: 0.0,
                total_transferred: 0.0,
            },
        );

        Self {
            bridges,
            transactions: HashMap::new(),
            supported_chains: vec!["ethereum".to_string(), "polygon".to_string(), "bsc".to_string(), "base".to_string()],
        }
    }

    pub fn get_bridge(&self, bridge_id: &str) -> Option<&Bridge> {
        self.bridges.get(bridge_id)
    }

    pub fn get_all_bridges(&self) -> Vec<Bridge> {
        self.bridges.values().cloned().collect()
    }

    pub fn quote_bridge(&self, bridge_id: &str, token: &Token, amount: f64) -> Result<BridgeQuote, String> {
        let bridge = self.get_bridge(bridge_id)
            .ok_or_else(|| "Bridge not found".to_string())?;

        if amount < bridge.min_amount || amount > bridge.max_amount {
            return Err(format!("Amount must be between {} and {}", bridge.min_amount, bridge.max_amount));
        }

        let fee = amount * bridge.fee_rate;
        let amount_out = amount - fee;
        let estimated_time = bridge.estimated_time;

        Ok(BridgeQuote {
            bridge_id: bridge.id.clone(),
            token: token.clone(),
            amount,
            fee,
            amount_out,
            estimated_time,
        })
    }

    pub fn create_bridge_transaction(
        &mut self,
        bridge_id: &str,
        user: String,
        token: Token,
        amount: f64,
        recipient_address: String,
    ) -> Result<BridgeTransaction, String> {
        let bridge = self.get_bridge(bridge_id)
            .ok_or_else(|| "Bridge not found".to_string())?;

        if amount < bridge.min_amount || amount > bridge.max_amount {
            return Err(format!("Amount must be between {} and {}", bridge.min_amount, bridge.max_amount));
        }

        let quote = self.quote_bridge(bridge_id, &token, amount)?;

        let mut transaction = BridgeTransaction {
            id: format!("bridge-{}", Uuid::new_v4()),
            bridge_id: bridge.id.clone(),
            user: user.clone(),
            source_chain: bridge.source_chain.clone(),
            target_chain: bridge.target_chain.clone(),
            token,
            amount,
            fee: quote.fee,
            recipient_address,
            status: BridgeTransactionStatus::Pending,
            source_tx_hash: String::new(),
            target_tx_hash: String::new(),
            created_at: Self::now_secs(),
            completed_at: None,
        };

        bridge.total_locked += amount;

        self.transactions.insert(transaction.id.clone(), transaction.clone());
        Ok(transaction)
    }

    pub fn get_transaction(&self, transaction_id: &str) -> Option<&BridgeTransaction> {
        self.transactions.get(transaction_id)
    }

    pub fn get_user_transactions(&self, user: &str) -> Vec<BridgeTransaction> {
        self.transactions
            .values()
            .filter(|t| t.user == user)
            .cloned()
            .collect()
    }

    pub fn complete_transaction(&mut self, transaction_id: &str, source_tx_hash: String) -> Result<(), String> {
        let transaction = self.transactions.get_mut(transaction_id)
            .ok_or_else(|| "Transaction not found".to_string())?;

        let bridge = self.bridges.get_mut(&transaction.bridge_id)
            .ok_or_else(|| "Bridge not found".to_string())?;

        transaction.source_tx_hash = source_tx_hash;
        transaction.status = BridgeTransactionStatus::Bridging;
        transaction.completed_at = Some(Self::now_secs());

        bridge.total_transferred += transaction.amount;
        bridge.total_locked -= transaction.amount;

        Ok(())
    }

    fn now_secs() -> i64 {
        SystemTime::now()
            .duration_since(SystemTime::UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs() as i64
    }
}
