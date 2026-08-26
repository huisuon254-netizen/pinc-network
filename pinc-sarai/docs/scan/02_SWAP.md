# Agent 2 — SWAP Exhaustive Report
**File:** `src-tauri/src/core/crypto/token_swap.rs:1` 353L, `tauri_commands.rs:138`, `phase12.rs:1`, `SaraiPage.tsx:371`, `WALLET_RESEARCH.md`

## Tokens 5 hardcoded
- eth 0xEeee... price 1800 vol 2.5B liq 15B 18 dec
- usdc 0xA0b8... 1.0 3B 2B 6 dec
- usdt 0xdAC... 1.0 4B 3B 6 dec
- btc WBTC 0x2260... 45000 1B 800M 8 dec chain bitcoin but supported_chains [ethereum,polygon,bsc] mismatch
- matic 0x000...1010 0.5 800M 1.2B 18 dec
All pools fee 0.003 (30bps): eth-usdc 500k/1M, eth-btc 100k/4.5, usdc-matic 2M/5M. USDT no pool, bsc no pool.

## Engine
- structs: Token, LiquidityPool {reserve_a/b f64, fee 0.003}, SwapRoute {path,rate,estimated_out,gas 0.001}, SwapTransaction {id,swap_id duplicate uuid, user, token_in/out, amount_in/out, route, slippage 0-1, deadline not enforced, status Pending|Confirmed|Failed|Cancelled|Complete, hash deterministic 0x, timestamp}, QuoteRequest {token_in,out,amount,slippage_bps,chains,protocols ignored}, QuoteResponse {amount_out,rate,price_impact 0.001 hardcoded, gas 0.001, time 30}
- new() seeds tokens/pools, supported_chains [ethereum,polygon,bsc] protocols [uniswap,sushiswap,curve] advisory only.
- quote(): pool_id=format!("{}",token_in) BUG ignores token_out → Pool not found for eth→usdc, directionality ignored, decimals misapplied amount*10^dec vs reserve human, chains/protocols ignored, hardcoded gas/impact/time, no reserve/slippage/deadline/active check.
- execute_swap(): re-quote, case-sensitive token lookup fails ETH vs eth, duplicate slippage, no deadline check, no balance/liquidity check, immediate Confirmed, tx hash static "swap_salt" identical every time, reserves not mutated → infinite liquidity.
- calculate_amount_out: Uniswap v2 formula correct but f64 precision inadequate U256 needed, generate_tx_hash uses Hash::hash not existing blake3_hex, now_secs missing import.

## Tauri commands (not registered)
- crypto_quote_swap(state,token_in,out,amount,slippage_bps,chains,protocols) expects state.crypto_engine nonexistent in AppState, allow(dead_code) hidden, hold lock.
- crypto_execute_swap mut bug let crypto_engine immutable cannot &mut execute, empty chains, user spoofable, no idempotency.
- crypto_get_supported_tokens / get_all_pools leak reserves without auth.
- All 4 not in lib.rs invoke_handler → command not found.

## crypto/mod.rs:1 10L — phase12/token_swap not exported, split module tree unreachable.
## phase12.rs:1 28L — CryptoEngine aggregate 5 engines new() zero persistence never instantiated in setup, zero imports.

## Frontend SaraiPage CryptoTab 371-485
- 3 coins BTC/ETH/USDT static addresses bc1q5... / 0x742d... shared ETH==USDT, fee strings static 0.0005/0.003/5, no invoke quote/execute, handleCryptoSubmit invoke cmd_crypto_transaction missing, destination input uncontrolled, no validation no slippage UI, QR placeholder icon not qrcode crate, grep swap 0 matches.

## WALLET_RESEARCH.md & PROJECT_DOCS.md — zero swap spec, no pool/fee docs, Sarai table 5 tabs no swap.

## Build failures: SystemTime missing, Hash::hash API no exist, &mut borrow, AppState field missing, handler missing, f64 money, not persisted, impersonation, deterministic hash, pool wrong, reserves not updated, decimals error, deadline not enforced, fee not accounted, frontend not wired, silent catch, no validation, token/chain mismatch, unvalidated slippage_bps 0-65535, duplicate IDs, defunct module split.
