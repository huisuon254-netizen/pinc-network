#![allow(dead_code)]

pub mod evm_sync;
pub mod smart_contract_manager;
pub mod token_swap;
pub mod cross_chain_bridge;
pub mod defi_integration;
pub mod tauri_commands;

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
