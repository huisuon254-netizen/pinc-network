# SARAI Internal 20-Wallet Engine — Design Spec
**Date:** 2026-08-24 | **Stables:** 5 | **Wallets per stable:** 4 | **Total:** 20 internal + 5 admin fee sinks

## 0. 10-Source Triple-Check — Best Platforms to Integrate
**Sources checked:** 10+ independent 2026 benchmarks:
- eco.com/support (Stargate 0.06% vs Across 0.04% vs LayerZero gas-only), bridgefees.com/blog (Across 0.04-0.12% cheapest 60% < $5k, Stargate best >$10k), cleansky.io/tools/bridges-comparator (Across 0.04-0.15% 2-30s, CCTP gas-only, Stargate 0.06% 1s), stablecoininsider.org (CCTP V2 native USDC, Stargate 80 chains, Across intent), eco.com 13314092 (1inch 0% +22bps vs Uniswap, Jupiter Solana, CowSwap MEV-proof), steyble.com, xoomar.com, coincodecap.com $300K tests (1inch 9.4/10 350 sources, 0x RFQ), defillama.com/protocols/lending (Aave $19.4B 3.8-6.2% USDC, Morpho $4.9B 4-8.5%, Compound $2.7B 3.5-5.8%), eco.com/support 14800882, spark.money, stablesafe.fyi, theledgermind.com (Aave 6.8-9.2% stable)
- **Verdict triple-checked:** No single cheapest — pick cheapest per quote live.

**Recommended stack for SARAI (cheapest near-zero, automated):**
- **Bridge primary:** `CCTP V2` (Circle burn-mint, gas only $0.24-0.50, ~20s, USDC-native, issuer-secured) for USDC everywhere; fallback `Across Protocol` (0.04% 2-30s, cheapest EVM L2 60% of routes) for USDT/DAI to Arbitrum/Base/Optimism/Polygon; `Stargate` (0.06% flat unified liquidity, 1s) for large >$10k or exotic chains (BNB, Aptos, Solana); `LayerZero OFT` (gas only) if token is OFT-enabled; `Hyperlane Warp` (0.08% 20-60s) as extra. **Rule:** always quote Across vs CCTP vs Stargate via aggregator (LI.FI/Eco Routes) and pick `min(fee+gas)`.
- **Swap primary:** `1inch Fusion` (0% router, Pathfinder 350+ sources, Fusion+ intent MEV-shielded, +22bps vs direct, $700B vol) for EVM; `Curve` stable pools (0.04% fee) for same-peg USDT↔USDC↔DAI tightest spread; `CowSwap` batch auction (MEV-proof, coincidence-of-wants) when available; `Jupiter` for Solana leg if needed. Use `1inch API` + `Curve` as fallback, compare `net_out = quoted_out - gas - protocol_fee`.
- **DeFi for idle swap wallet yield:** `Aave V3` default (3.8-6.2% USDC, $19.4B deepest, most audited) for hot excess parking; `Compound V3` isolated (3.5-5.8%) containment alternative; `Morpho Blue` vaults (4-8.5% curated) only if curator trusted. For auto, park excess swap funds in Aave v3 USDC supply (instant withdraw) to earn while idle.

## 1. Stable Coins — 5
Chosen top-5 by liquidity + CCTP coverage (triple-checked via DefiLlama TVL + bridge coverage):
- `USDT` (Tether, `0xdAC17F...` ERC20 6dec, TRC20 `TR7NH...` for TRON leg)
- `USDC` (Circle, `0xA0b869...` 6dec, CCTP native — flagship)
- `DAI` (Maker/Sky USDS, 18dec, `0x6B17...`)
- `FDUSD` (First Digital, `0xc5f0...` 18dec, BNB/ETH high liquidity)
- `PYUSD` (PayPal USD, `0x6c3ea...` 6dec, rising 2026)

All 1:1 USD peg, internal representation `I-USDT` etc as SARAI token (user balance stored as `wallet_balances` per `node_id` but now per stable).

## 2. Wallets — 20 Internal + 5 Admin Sinks
Per stable `S in {USDT,USDC,DAI,FDUSD,PYUSD}` × 4 = 20:

- **W1 Fee (Extract) Wallet** `fee_S` — collects platform haircut 2-3% + 0.5% admin slice of agent fees. In-memory `f64` → DB `wallet_balances` row `node_id = "sarai:fee:USDT"` etc. Pile up, threshold $10 → atomic transfer to **Admin Fee Wallet** `admin_fee_S` (5 sinks, off-app, cold). Not counted in hot/cold limits.
- **W2 Hot Wallet** `hot_S` — ready for withdrawals, low latency, funds in `wallet_balances` + hot signer. Limit `HOT_LIMIT_S` per stable (config e.g., $50k USDT, $30k USDC). Must stay ≥ `HOT_MIN_S` (e.g., $10k) for instant.
- **W3 Cold Wallet** `cold_S` — vault, hardware/HSM, high security, limit `COLD_LIMIT_S` (e.g., $500k). Excess above limit → `→ Swap`.
- **W4 Swap Wallet** `swap_S` — rebalancing buffer, parked in Aave/Compound for yield, used to top-up hot when hot < withdrawal need. No upper limit, but alerts if > `$1M`.

Total internal addresses: 20 `sarai:{fee|hot|cold|swap}:{USDT|USDC|DAI|FDUSD|PYUSD}`. Admin sinks: `admin:fee:{S}` (5).

DB: `wallet_balances` already exists `schema.rs:255` — extend with `wallet_type TEXT CHECK (hot,cold,swap,fee,admin)` and `stable TEXT`. Or new table `internal_wallets(id PK, stable TEXT, wallet_type TEXT, address TEXT, balance REAL, limit REAL, updated_at)`. For minimal, reuse `wallet_balances.node_id = sarai:hot:USDT`.

## 3. Fee Algorithm — The 2-3% Haircut + Agent ±10% + 0.5% Platform

### Definitions
- `P = deposit/withdraw principal in USD` (e.g., $1 or $1000)
- `haircut = 0.02 to 0.03` (platform base, configurable per stable, default 0.02) → user receives `P * (1 - haircut)` token if no agent. Example: `P=1 USD, haircut 0.02 → user gets 0.98 I-USDT`, platform fee wallet `+0.02`.
- `agent_markup ∈ [-0.10, +0.10]` (−10% to +10% allowed, `storage.rs` currently fee_percent 0-100 but new clamp ±10). Positive = agent charges extra, negative = agent subsidizes (better rate). Example deposit 3% = +0.03 → user gets `P*(1 - haircut - agent_fee)`? Actually earlier: agent 3% where user gets 0.97 and agent gets 2.5% after 0.5% platform. Need unified formula.
- `platform_agent_slice = 0.005` (0.5% of agent fee amount, not of principal — but spec says 0.5% of what they earn; with agent 3% on $1, agent earn $0.03, platform slice $0.03*0.005=$0.00015? But spec example says 3% → 2.5% net agent, 0.5% to platform of principal $1 → $0.005. So ambiguous. Implement both as `platform_take = amount * agent_markup * 0.005 / agent_markup?` Simpler: platform takes 0.5% of principal when agent present, i.e., `0.005*P` flat. But spec: "I take 0.5% of what they earn so if user deposit 1 dollar I take 0.05% the other cut..." 0.5% of 3% = 0.015% of principal $0.00015 not $0.005. Might be typo 0.05% of principal. Implement: `platform_agent_fee = P * 0.005` when agent_markup>0, remainder to agent. For generic, `platform_agent_fee = agent_fee_amount * 0.005 / 0.03?` Let's implement spec literal: `platform_share = P * 0.005` (0.5% of principal) when agent used, regardless of agent markup, and `agent_net = P*agent_markup - platform_share`. Example: P=1, haircut 0.02, agent_markup 0.03 → haircut fee 0.02 → fee wallet, agent gross 0.03, platform agent slice 0.005 → fee wallet +0.005, agent net 0.025, user gets 1 -0.02 -0.03 =0.95? But spec says user gets 0.97 with 3% agent alone (implies haircut not applied when agent present, or haircut is already agent's). Let's assume haircut is platform's own price when no agent (direct). When agent present, haircut disabled, only agent_markup applies (plus platform slice). So user gets `P*(1 - agent_markup)` if agent else `P*(1 - haircut)`. Then split agent_markup: platform 0.5% of principal, agent rest.

Provide formal:

- No agent: `user_token = P * (1 - haircut)` (0.98), `fee_wallet[stable] += P*haircut` (0.02)
- With agent markup `m`: `user_token = P * (1 - m)` clamped `m ∈ [-0.10,0.10]`, `gross_fee = P*m` if m>0 else 0 (if m negative, platform subsidizes, no fee), `platform_fee = P * 0.005` (0.5% of P) if m>0, `agent_net = gross_fee - platform_fee`, `fee_wallet += platform_fee`, `agent_balance += agent_net` (agent's external). Negative m: `user_token = P*(1 - m) > P` (user gets bonus), agent deficit covered by agent's own funds + platform fee not charged.

- Pile-up: `fee_S` accumulates per stable. When `fee_S.balance >= 10.0` → atomic `TRANSFER fee_S → admin_fee_S 10.0` + `audit_logs` Payment domain + reset. 5 admin wallets.

### Examples
- Example A (spec): User withdraw 1 USD, haircut 0.02 → gets 0.98 WORTH, fee wallet +0.02.
- Example B: Agent 3% on $1 deposit, haircut disabled → user 0.97, fee wallet +0.005 (platform), agent +0.025. Pile after 334 deposits ($0.005*334≈$1.67) actually 200 deposits to reach $1? Wait 0.005*2000=10. Need 2000 $1 deposits to reach $10. If $100 deposits, 20 deposits.
- Example C: Agent -5% (better rate) on $100 → user gets $105, no platform fee, agent pays $5 from own.

### Limits
- `agent_markup` must be set per channel `storage.rs:channel.fee_percent` currently 0-100; new clamp `[-0.10,0.10]` and `commission_rate` repurposed as platform slice? But spec separates. Add `agent_markup REAL` column and `platform_fee_rate 0.005` constant.

## 4. Hot/Cold/Swap Rebalancing & Auto Top-Up

### Limits (config per stable, example)
- `HOT_LIMIT = 50000` (max hot), `HOT_MIN = 10000` (min for instant), `COLD_LIMIT = 500000` (max cold) — tunable via `system_config` `sarai_hot_limit_USDT`.

### Excess drain:
- Every `rebalance()` tick (1 min or on deposit/withdraw): if `hot_S.balance > HOT_LIMIT` → `excess = hot - HOT_LIMIT` → `TRANSFER hot_S → swap_S excess` (no fee, internal). Similarly `cold_S > COLD_LIMIT` → `cold → swap`.
- If `swap_S` idle and `swap_S.balance > 0`, auto park in `Aave V3` supply (off-chain yield) — track `swap_yield_position`.

### Shortfall top-up (the DAI $1000 with $300 hot case):
- Request withdraw `amount W = 1000 DAI` on `hot_DAI.balance = 300`.
- `deficit = W - hot balance = 700`.
- Algorithm `top_up_hot(S, deficit)`:
  1. Snapshot all `swap_{T}` for `T != S` where `swap_T.balance > 500` (threshold to avoid dust).
  2. Sort descending by excess (`swap_T.balance - reserve 500`).
  3. For each `T` in order, compute `cheapest_quote = min(CCTP, Across, Stargate, 1inch+Curve)` fee% via aggregator mock `cheapest_fee(S,T,amount)` — pick `min(fee%)`. In spec, prefer near-zero: CCTP 0.05% ($0.24 gas) vs Across 0.04% vs Stargate 0.06%. Choose min.
  4. `take = min(deficit, swap_T.balance - 500)`.
  5. Execute internal `swap_T → swap_S` via cheapest route: `bridge_or_swap(T→S, take)` which calls `TokenSwapEngine::quote` or `BridgeManager::quote_bridge` and checks `profit = haircut*take - fee - gas > 0` (always profit). If profit negative, skip that source (ensure profit).
  6. Update `swap_T.balance -= take+fee`, `hot_S.balance += take` (after bridge).
  7. Continue until deficit 0 or no donors. If still deficit, fallback `cold_DAI → hot_DAI` internal, or `cold_T → swap_T → hot` chain, or reject withdrawal with `InsufficientLiquidity`.

- Profit guarantee: every top-up charges haircut 2% on withdrawn amount *plus* agent markup if via agent, so `profit = W * 0.02 - total_bridge_fees - gas`. With bridge fee 0.04% (~$0.40 on $1000) vs haircut $20, profit $19.60 always positive. Algorithm verifies `profit>0` before executing, otherwise uses cheapest.

- Automation: `tokio::spawn` rebalance every 60s + on every `cmd_transfer`/`initiate_deposit` hook; secure: all transfers via `upsert_wallet_balance` in `Mutex` + `BEGIN IMMEDIATE`, audit log `payment` domain, signer with `x25519` + `blake3` hash, rate-limit.

## 5. Security & Speed
- **Automated:** `reasoning::span` + `tokio::time::interval` + `watch` channel; no manual.
- **Fast:** Quotes cached 30s (`estimated_time 30`), bridge fill 2-30s Across, 20s CCTP V2 fast-path, swap 1inch Fusion instant intent.
- **Secure:** `Argon2` password, `XChaCha24` private_key_encrypted, `memo` HMAC, `chain_tx_hash` dedup, `faucet_claims` daily limit, `agent_markup` clamped ±10, `platform_fee` atomic, `audit_logs` trace_id per transfer, `op_trails` fingerprint, `cold` HSM, `HOT_MIN` prevents drain, `MAX_SLIPPAGE 0.5%` check.

## 6. Implementation Files
- `src-tauri/src/core/payment/internal_wallets.rs` — new engine (20 wallets, fees, rebalance, top-up, pile-up)
- `src-tauri/src/core/database/schema.rs: + CREATE_INTERNAL_WALLETS`
- `src-tauri/src/core/payment/mod.rs + lib.rs AppState::internal_wallets`
- Tauri commands: `cmd_internal_deposit`, `cmd_internal_withdraw`, `cmd_internal_quote`, `cmd_internal_rebalance`, `cmd_internal_top_up`
