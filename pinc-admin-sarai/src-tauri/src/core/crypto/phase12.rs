#![allow(dead_code)]
// Re-export phase12 engines from sibling modules (containment: SARAI watch-only, ADMIN holds keys)
use crate::core::crypto::{
    cross_chain_bridge, defi_integration, evm_sync, smart_contract_manager, token_swap,
};

pub struct CryptoEngine {
    pub evm_sync: evm_sync::EvmSyncEngine,
    pub contract_manager: smart_contract_manager::SmartContractManager,
    pub token_swap_engine: token_swap::TokenSwapEngine,
    pub bridge_manager: cross_chain_bridge::BridgeManager,
    pub defi_hub: defi_integration::DefiHub,
}

impl CryptoEngine {
    pub fn new() -> Self {
        Self {
            evm_sync: evm_sync::EvmSyncEngine::new(),
            contract_manager: smart_contract_manager::SmartContractManager::new(),
            token_swap_engine: token_swap::TokenSwapEngine::new(),
            bridge_manager: cross_chain_bridge::BridgeManager::new(),
            defi_hub: defi_integration::DefiHub::new(),
        }
    }
}
