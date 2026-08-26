pub mod aggregator;
pub mod cipher;
pub mod errors;
pub mod hash;
pub mod keys;
pub mod nonce;
#[cfg(test)]
mod tests;
pub mod types;
pub mod validator;
pub mod wallet;
// Phase12 modules — now enabled for bridge/swap/defi integrations (wired via aggregator)
pub mod cross_chain_bridge;
pub mod defi_integration;
pub mod evm_sync;
pub mod smart_contract_manager;
pub mod token_swap;
pub mod phase12;
// tauri_commands disabled for SARAI minimal AppState (watch-only containment uses lib.rs commands instead)
// pub mod tauri_commands;
