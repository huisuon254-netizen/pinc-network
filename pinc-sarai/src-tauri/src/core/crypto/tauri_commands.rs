#![allow(dead_code)]
use serde::{Serialize, Deserialize};
use std::sync::{Arc, Mutex};
use tokio::sync::Mutex as AsyncMutex;
use tauri::State;

use crate::{
    core::{
        crypto::{
            evm_sync::{EvmSyncEngine, SyncResult, EvmChain},
            smart_contract_manager::{
                SmartContractTemplate, ContractType, DeployedContract, 
                ContractStatus, SmartContractManager
            },
            token_swap::{TokenSwapEngine, QuoteRequest, QuoteResponse, SwapTransaction, SwapStatus, Token},
            cross_chain_bridge::{BridgeManager, Bridge, BridgeTransaction, BridgeTransactionStatus, BridgeQuote},
            defi_integration::{DefiHub, LiquidityFarm, YieldPosition, LendingPool, Loan, StakingPool, StakingPosition, PositionStatus},
        },
        crypto::phase12::{CryptoEngine},
    },
    commands::AppState,
};

// ─── EVM SYNC ──────────────────────────────────────────────────────────────

#[tauri::command]
pub async fn crypto_sync_evm(state: State<'_, AppState>) -> Result<serde_json::Value, String> {
    let crypto_engine = state.crypto_engine.lock().await;
    let sync_result = crypto_engine.evm_sync.start_sync()
        .map_err(|e| format!("Failed to start sync: {}", e))?;
    
    Ok(serde_json::json!({
        "success": true,
        "message": "EVM sync started",
        "data": sync_result
    }))
}

#[tauri::command]
pub async fn crypto_get_chain_status(state: State<'_, AppState>) -> Result<serde_json::Value, String> {
    let crypto_engine = state.crypto_engine.lock().await;
    let status = crypto_engine.evm_sync.get_sync_status();
    Ok(serde_json::json!(status))
}

#[tauri::command]
pub async fn crypto_add_evm_chain(state: State<'_, AppState>, chain: EvmChain) -> Result<serde_json::Value, String> {
    let mut crypto_engine = state.crypto_engine.lock().await;
    crypto_engine.evm_sync.add_chain(chain);
    Ok(serde_json::json!({
        "success": true,
        "message": "Chain added successfully"
    }))
}

// ─── SMART CONTRACT MANAGER ───────────────────────────────────────────────

#[tauri::command]
pub async fn crypto_create_contract_template(
    state: State<'_, AppState>,
    name: String,
    description: String,
    contract_type: ContractType,
    bytecode: String,
    abi: String,
    creator: String,
    is_official: bool,
) -> Result<serde_json::Value, String> {
    let mut crypto_engine = state.crypto_engine.lock().await;
    let template = crypto_engine.contract_manager.create_template(
        name, description, contract_type, bytecode, abi, creator, is_official
    )?;
    crypto_engine.contract_manager.add_template(template.clone());
    
    Ok(serde_json::json!({
        "success": true,
        "message": "Template created successfully",
        "data": template
    }))
}

#[tauri::command]
pub async fn crypto_get_contract_templates(state: State<'_, AppState>) -> Result<serde_json::json::Value, String> {
    let crypto_engine = state.crypto_engine.lock().await;
    let templates = crypto_engine.contract_manager.get_templates();
    Ok(serde_json::json!(templates))
}

#[tauri::command]
pub async fn crypto_deploy_contract(
    state: State<'_, AppState>,
    template_id: String,
    name: String,
    chain: String,
    owner: String,
) -> Result<serde_json::Value, String> {
    let mut crypto_engine = state.crypto_engine.lock().await;
    let contract = crypto_engine.contract_manager.deploy_contract(
        &template_id, name, chain, owner
    )?;
    
    Ok(serde_json::json!({
        "success": true,
        "message": "Contract deployed successfully",
        "data": contract
    }))
}

#[tauri::command]
pub async fn crypto_get_deployed_contracts(state: State<'_, AppState>) -> Result<serde_json::Value, String> {
    let crypto_engine = state.crypto_engine.lock().await;
    let contracts = crypto_engine.contract_manager.get_deployed_contracts();
    Ok(serde_json::json!(contracts))
}

#[tauri::command]
pub async fn crypto_execute_contract_interaction(
    state: State<'_, AppState>,
    contract_id: String,
    function_name: String,
    caller: String,
    parameters: String,
    value: f64,
    gas_limit: u64,
) -> Result<serde_json::Value, String> {
    let mut crypto_engine = state.crypto_engine.lock().await;
    let interaction = crypto_engine.contract_manager.execute_interaction(
        &contract_id, function_name, caller, parameters, value, gas_limit
    )?;
    
    Ok(serde_json::json!({
        "success": true,
        "message": "Interaction executed successfully",
        "data": interaction
    }))
}

// ─── TOKEN SWAP ───────────────────────────────────────────────────────────

#[tauri::command]
pub async fn crypto_quote_swap(
    state: State<'_, AppState>,
    token_in: String,
    token_out: String,
    amount_in: f64,
    slippage_bps: u16,
    chains: Vec<String>,
    protocols: Vec<String>,
) -> Result<serde_json::Value, String> {
    let crypto_engine = state.crypto_engine.lock().await;
    let quote_request = QuoteRequest {
        token_in,
        token_out,
        amount_in,
        slippage_bps,
        chains,
        protocols,
    };
    let quote = crypto_engine.token_swap_engine.quote(quote_request)?;
    
    Ok(serde_json::json!({
        "success": true,
        "message": "Quote retrieved successfully",
        "data": quote
    }))
}

#[tauri::command]
pub async fn crypto_execute_swap(
    state: State<'_, AppState>,
    token_in: String,
    token_out: String,
    amount_in: f64,
    slippage_bps: u16,
    user: String,
    deadline: i64,
) -> Result<serde_json::Value, String> {
    let crypto_engine = state.crypto_engine.lock().await;
    let quote_request = QuoteRequest {
        token_in,
        token_out,
        amount_in,
        slippage_bps,
        chains: vec![],
        protocols: vec![],
    };
    let swap = crypto_engine.token_swap_engine.execute_swap(
        quote_request, user, slippage_bps, deadline
    )?;
    
    Ok(serde_json::json!({
        "success": true,
        "message": "Swap executed successfully",
        "data": swap
    }))
}

#[tauri::command]
pub async fn crypto_get_supported_tokens(state: State<'_, AppState>) -> Result<serde_json::Value, String> {
    let crypto_engine = state.crypto_engine.lock().await;
    let tokens = crypto_engine.token_swap_engine.get_all_tokens();
    Ok(serde_json::json!(tokens))
}

#[tauri::command]
pub async fn crypto_get_all_pools(state: State<'_, AppState>) -> Result<serde_json::Value, String> {
    let crypto_engine = state.crypto_engine.lock().await;
    let pools = crypto_engine.token_swap_engine.get_all_pools();
    Ok(serde_json::json!(pools))
}

// ─── CROSS CHAIN BRIDGE ───────────────────────────────────────────────────

#[tauri::command]
pub async fn crypto_quote_bridge(
    state: State<'_, AppState>,
    bridge_id: String,
    token: Token,
    amount: f64,
) -> Result<serde_json::Value, String> {
    let crypto_engine = state.crypto_engine.lock().await;
    let quote = crypto_engine.bridge_manager.quote_bridge(&bridge_id, &token, amount)?;
    
    Ok(serde_json::json!({
        "success": true,
        "message": "Bridge quote retrieved successfully",
        "data": quote
    }))
}

#[tauri::command]
pub async fn crypto_create_bridge_transaction(
    state: State<'_, AppState>,
    bridge_id: String,
    user: String,
    token: Token,
    amount: f64,
    recipient_address: String,
) -> Result<serde_json::Value, String> {
    let crypto_engine = state.crypto_engine.lock().await;
    let transaction = crypto_engine.bridge_manager.create_bridge_transaction(
        &bridge_id, user, token, amount, recipient_address
    )?;
    
    Ok(serde_json::json!({
        "success": true,
        "message": "Bridge transaction created successfully",
        "data": transaction
    }))
}

#[tauri::command]
pub async fn crypto_complete_bridge_transaction(
    state: State<'_, AppState>,
    transaction_id: String,
    source_tx_hash: String,
) -> Result<serde_json::Value, String> {
    let crypto_engine = state.crypto_engine.lock().await;
    crypto_engine.bridge_manager.complete_transaction(&transaction_id, source_tx_hash)?;
    
    Ok(serde_json::json!({
        "success": true,
        "message": "Bridge transaction completed successfully"
    }))
}

#[tauri::command]
pub async fn crypto_get_all_bridges(state: State<'_, AppState>) -> Result<serde_json::Value, String> {
    let crypto_engine = state.crypto_engine.lock().await;
    let bridges = crypto_engine.bridge_manager.get_all_bridges();
    Ok(serde_json::json!(bridges))
}

// ─── DEFI INTEGRATION ──────────────────────────────────────────────────────

#[tauri::command]
pub async fn crypto_get_all_farms(state: State<'_, AppState>) -> Result<serde_json::Value, String> {
    let crypto_engine = state.crypto_engine.lock().await;
    let farms = crypto_engine.defi_hub.get_all_farms();
    Ok(serde_json::json!(farms))
}

#[tauri::command]
pub async fn crypto_create_yield_position(
    state: State<'_, AppState>,
    farm_id: String,
    user: String,
    amount: f64,
) -> Result<serde_json::Value, String> {
    let crypto_engine = state.crypto_engine.lock().await;
    let position = crypto_engine.defi_hub.create_yield_position(farm_id, user, amount)?;
    
    Ok(serde_json::json!({
        "success": true,
        "message": "Yield position created successfully",
        "data": position
    }))
}

#[tauri::command]
pub async fn crypto_get_user_positions(state: State<'_, AppState>, user: String) -> Result<serde_json::Value, String> {
    let crypto_engine = state.crypto_engine.lock().await;
    let positions = crypto_engine.defi_hub.get_user_positions(user);
    Ok(serde_json::json!(positions))
}

#[tauri::command]
pub async fn crypto_get_all_lending_pools(state: State<'_, AppState>) -> Result<serde_json::Value, String> {
    let crypto_engine = state.crypto_engine.lock().await;
    let pools = crypto_engine.defi_hub.get_all_lending_pools();
    Ok(serde_json::json!(pools))
}

#[tauri::command]
pub async fn crypto_get_all_staking_pools(state: State<'_, AppState>) -> Result<serde_json::Value, String> {
    let crypto_engine = state.crypto_engine.lock().await;
    let pools = crypto_engine.defi_hub.get_all_staking_pools();
    Ok(serde_json::json!(pools))
}

#[tauri::command]
pub async fn crypto_create_staking_position(
    state: State<'_, AppState>,
    pool_id: String,
    user: String,
    amount: f64,
) -> Result<serde_json::Value, String> {
    let crypto_engine = state.crypto_engine.lock().await;
    let position = crypto_engine.defi_hub.create_staking_position(pool_id, user, amount)?;
    
    Ok(serde_json::json!({
        "success": true,
        "message": "Staking position created successfully",
        "data": position
    }))
}

// ─── CRYPTO ENGINE UTILITIES ───────────────────────────────────────────────

#[tauri::command]
pub async fn crypto_get_engine_status(state: State<'_, AppState>) -> Result<serde_json::Value, String> {
    let crypto_engine = state.crypto_engine.lock().await;
    
    let status = serde_json::json!({
        "evm_sync_running": crypto_engine.evm_sync.is_running,
        "evm_chains_count": crypto_engine.evm_sync.chains.len(),
        "templates_count": crypto_engine.contract_manager.templates.len(),
        "deployed_contracts_count": crypto_engine.contract_manager.deployed_contracts.len(),
        "pools_count": crypto_engine.token_swap_engine.pools.len(),
        "bridges_count": crypto_engine.bridge_manager.bridges.len(),
        "farms_count": crypto_engine.defi_hub.farms.len(),
        "lending_pools_count": crypto_engine.defi_hub.lending_pools.len(),
        "staking_pools_count": crypto_engine.defi_hub.staking_pools.len(),
    });
    
    Ok(status)
}
