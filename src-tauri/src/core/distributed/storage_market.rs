use crate::core::distributed::{
    errors::DistributedError,
    types::{StorageContract, StorageNode},
};
use std::time::{SystemTime, UNIX_EPOCH};
use uuid::Uuid;

pub const MIN_CONTRACT_DAYS: i64 = 1;
pub const MAX_CONTRACT_DAYS: i64 = 365;
pub const DEFAULT_PRICE_PER_GB_PER_DAY: f64 = 0.001; // in PINC tokens

/// Create a storage contract between provider and consumer
pub fn create_contract(
    provider_node_id: &str,
    consumer_node_id: &str,
    bytes_allocated: u64,
    price_per_gb: f64,
    duration_days: i64,
) -> Result<StorageContract, DistributedError> {
    if duration_days < MIN_CONTRACT_DAYS || duration_days > MAX_CONTRACT_DAYS {
        return Err(DistributedError::ContractError(format!(
            "duration must be between {} and {} days",
            MIN_CONTRACT_DAYS, MAX_CONTRACT_DAYS
        )));
    }
    if bytes_allocated == 0 {
        return Err(DistributedError::ContractError(
            "bytes_allocated must be > 0".to_string(),
        ));
    }
    let now = now_secs();
    Ok(StorageContract {
        id: Uuid::new_v4().to_string(),
        provider_node_id: provider_node_id.to_string(),
        consumer_node_id: consumer_node_id.to_string(),
        bytes_allocated,
        price_per_gb_per_day: price_per_gb,
        expires_at: now + (duration_days * 86400),
        active: true,
    })
}

/// Calculate the cost of a storage contract
pub fn contract_cost(bytes: u64, price_per_gb: f64, days: i64) -> f64 {
    let gb = bytes as f64 / (1024.0 * 1024.0 * 1024.0);
    gb * price_per_gb * days as f64
}

/// Check if a contract is still valid
pub fn is_contract_valid(contract: &StorageContract) -> bool {
    contract.active && contract.expires_at > now_secs()
}

/// Find best provider nodes for a storage allocation
pub fn find_providers(
    nodes: &[StorageNode],
    bytes_needed: u64,
    max_price: f64,
) -> Vec<&StorageNode> {
    nodes
        .iter()
        .filter(|n| n.online && n.free_space_bytes >= bytes_needed && n.reputation >= 0.5)
        .collect()
}

fn now_secs() -> i64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs() as i64
}
