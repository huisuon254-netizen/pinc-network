use std::collections::HashMap;
use std::time::{SystemTime, UNIX_EPOCH};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EvmChain {
    pub name: String,
    pub rpc_url: String,
    pub chain_id: u64,
    pub native_token: String,
    pub explorer_url: String,
    pub last_block: u64,
    pub sync_height: u64,
    pub is_synced: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EvmBlock {
    pub hash: String,
    pub number: u64,
    pub timestamp: i64,
    pub transactions: Vec<EvmTransaction>,
    pub gas_used: u64,
    pub gas_limit: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EvmTransaction {
    pub hash: String,
    pub from: String,
    pub to: String,
    pub value: f64,
    pub gas: u64,
    pub gas_price: u64,
    pub nonce: u64,
    pub input: String,
    pub status: TransactionStatus,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum TransactionStatus {
    Pending,
    Confirmed,
    Failed,
    PendingError,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EvmEvent {
    pub transaction_hash: String,
    pub event_type: String,
    pub timestamp: i64,
    pub data: String,
    pub topics: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SyncResult {
    pub blocks_processed: u64,
    pub transactions_processed: u64,
    pub events_emitted: u64,
    pub started_at: i64,
    pub completed_at: Option<i64>,
}

pub struct EvmSyncEngine {
    pub chains: HashMap<String, EvmChain>,
    pub last_sync_times: HashMap<String, i64>,
    pub is_running: bool,
}

impl EvmSyncEngine {
    pub fn new() -> Self {
        let mut chains: HashMap<String, EvmChain> = HashMap::new();
        chains.insert(
            "ethereum".to_string(),
            EvmChain {
                name: "Ethereum".to_string(),
                rpc_url: "https://eth.llamarpc.com".to_string(),
                chain_id: 1,
                native_token: "ETH".to_string(),
                explorer_url: "https://etherscan.io".to_string(),
                last_block: 0,
                sync_height: 0,
                is_synced: false,
            },
        );
        chains.insert(
            "polygon".to_string(),
            EvmChain {
                name: "Polygon".to_string(),
                rpc_url: "https://polygon-rpc.com".to_string(),
                chain_id: 137,
                native_token: "MATIC".to_string(),
                explorer_url: "https://polygonscan.com".to_string(),
                last_block: 0,
                sync_height: 0,
                is_synced: false,
            },
        );
        chains.insert(
            "bsc".to_string(),
            EvmChain {
                name: "BSC".to_string(),
                rpc_url: "https://bsc-dataseed1.binance.org".to_string(),
                chain_id: 56,
                native_token: "BNB".to_string(),
                explorer_url: "https://bscscan.com".to_string(),
                last_block: 0,
                sync_height: 0,
                is_synced: false,
            },
        );
        chains.insert(
            "base".to_string(),
            EvmChain {
                name: "Base".to_string(),
                rpc_url: "https://mainnet.base.org".to_string(),
                chain_id: 8453,
                native_token: "ETH".to_string(),
                explorer_url: "https://basescan.org".to_string(),
                last_block: 0,
                sync_height: 0,
                is_synced: false,
            },
        );

        Self {
            chains,
            last_sync_times: HashMap::new(),
            is_running: false,
        }
    }

    pub fn get_chain(&self, chain_name: &str) -> Option<&EvmChain> {
        self.chains.get(chain_name)
    }

    pub fn get_mut_chain(&mut self, chain_name: &str) -> Option<&mut EvmChain> {
        self.chains.get_mut(chain_name)
    }

    pub fn add_chain(&mut self, chain: EvmChain) {
        self.chains.insert(chain.name.clone(), chain);
    }

    pub fn get_supported_chains(&self) -> Vec<String> {
        self.chains.keys().cloned().collect()
    }

    pub fn start_sync(&mut self) -> Result<SyncResult, String> {
        let mut total_blocks_processed = 0u64;
        let mut total_transactions_processed = 0u64;
        let mut total_events_emitted = 0u64;
        let now = Self::now_secs();

        for (name, chain) in &mut self.chains {
            match self.sync_chain(chain, now) {
                Ok((blocks, transactions, events)) => {
                    total_blocks_processed += blocks;
                    total_transactions_processed += transactions;
                    total_events_emitted += events;
                    self.last_sync_times.insert(name.clone(), now);
                }
                Err(e) => {
                    return Err(format!("Failed to sync chain {}: {}", name, e));
                }
            }
        }

        let sync_result = SyncResult {
            blocks_processed: total_blocks_processed,
            transactions_processed: total_transactions_processed,
            events_emitted: total_events_emitted,
            started_at: now,
            completed_at: Some(now),
        };

        self.is_running = true;
        Ok(sync_result)
    }

    fn sync_chain(&mut self, chain: &mut EvmChain, now: i64) -> Result<(u64, u64, u64), String> {
        let blocks_to_process = 10;
        let mut blocks_processed = 0u64;
        let mut transactions_processed = 0u64;
        let mut events_emitted = 0u64;

        for i in 0..blocks_to_process {
            let block = self.fetch_block(chain.chain_id, chain.last_block + i + 1)?;
            chain.last_block = block.number;
            transactions_processed += block.transactions.len() as u64;
            
            for tx in &block.transactions {
                if tx.status == TransactionStatus::Confirmed {
                    if let Some(events) = self.process_transaction_events(tx) {
                        events_emitted += events.len() as u64;
                    }
                }
            }
            blocks_processed += 1;
        }

        chain.sync_height = chain.last_block;
        chain.is_synced = chain.sync_height >= 19500000;

        Ok((blocks_processed, transactions_processed, events_emitted))
    }

    fn fetch_block(&self, chain_id: u64, block_number: u64) -> Result<EvmBlock, String> {
        let mut block = EvmBlock {
            hash: format!("0x{:x}", block_number),
            number: block_number,
            timestamp: Self::now_secs(),
            transactions: Vec::new(),
            gas_used: block_number * 21000,
            gas_limit: 15000000,
        };

        for i in 0..5 {
            let tx = EvmTransaction {
                hash: format!("0x{:x}{:x}", chain_id, i),
                from: format!("0x{:040x}", i * 1234567890),
                to: format!("0x{:040x}", (i + 1) * 1234567890),
                value: (i as f64 + 1.0) * 0.1,
                gas: 21000,
                gas_price: 2000000000,
                nonce: i as u64,
                input: "0x".to_string(),
                status: TransactionStatus::Confirmed,
            };
            block.transactions.push(tx);
        }

        Ok(block)
    }

    fn process_transaction_events(&self, tx: &EvmTransaction) -> Option<Vec<EvmEvent>> {
        let mut events = Vec::new();
        
        if tx.value > 0.0 {
            let event = EvmEvent {
                transaction_hash: tx.hash.clone(),
                event_type: "Transfer".to_string(),
                timestamp: Self::now_secs(),
                data: format!("{}", tx.value),
                topics: vec![
                    "0xddf252ad1be2c89b69c2b4e0d27029c6654e5a00".to_string(),
                    format!("0x{:040x}", tx.from.parse::<u128>().unwrap_or(0)),
                    format!("0x{:040x}", tx.to.parse::<u128>().unwrap_or(0)),
                ],
            };
            events.push(event);
        }

        if !events.is_empty() {
            Some(events)
        } else {
            None
        }
    }

    pub fn get_sync_status(&self) -> HashMap<String, bool> {
        self.chains
            .iter()
            .map(|(name, chain)| (name.clone(), chain.is_synced))
            .collect()
    }

    fn now_secs() -> i64 {
        SystemTime::now().duration_since(UNIX_EPOCH).unwrap_or_default().as_secs() as i64
    }
}
