# SARAI P2P Agents — IMPLEMENTED (15-Agent Synthesis)
Date: 2026-08-24 | All checks PASS

## Flow Implemented (spec-complete)
1. **Account → ID:** `pinc_id_from_node_id` `queries.rs:9` + `SaraiPage.tsx:17` → `PINC-0000-000` (4-3 uppercase)
2. **Deposit page:** `P2PAgentTab` `SaraiPage.tsx:660` — country dropdown (32 countries) → `invoke cmd_p2p_agent_list {countryIso2, onlineOnly:true}`
3. **Agent list:** ranked by completion_rate DESC (completed_orders/total_orders), rating DESC, volume DESC — `storage.rs list_agents` Bayesian-ready
4. **Online only:** `WHERE is_online=1 AND last_seen >= now-300` — empty state: "No available local agent at this moment. Try other method or try again later." + Retry
5. **Token balances:** `p2p_agent_balances` table (max 5 tokens/agent) + `cmd_p2p_agent_list_balances` / `_set_balance`
6. **Click agent → amount → quote:** `cmd_p2p_agent_calc_quote` (fallback 3% estimate)
7. **Escrow silver:** `cmd_p2p_agent_initiate_deposit` → `expires_at = now+1800` on escrow_holds + DepositOrder → status badge `#C0C0C0 silver` for EscrowHeld/PaymentConfirmed `statusBadge` map
8. **Instruction panel:** agent name, amount, reference order.id, live mm:ss countdown (1s tick)
9. **I HAVE SENT:** `cmd_p2p_agent_confirm_payment` → PaymentConfirmed (silver persists)
10. **30-min timeout + complaint:** after `now >= expires_at` → "Complain with evidence" textarea → `cmd_p2p_agent_complain {orderId, disputeReason, evidenceHash}` → status Disputed + disputed_at + audit_logs

## Backend (pinc-sarai/src-tauri)
- `models.rs`: Agent +node_id/is_online/last_seen/total_orders/completed_orders; DepositOrder +expires_at/disputed_at/dispute_reason/evidence_hash/complainant_node_id; new AgentBalance
- `storage.rs`: list_agents online filter + completion rank; heartbeat_agent, mark_stale_offline, increment_agent_order_counters, list/upsert_agent_balances (max-5)
- `commands.rs`: 14 cmds — create (validated country/languages/commission 0-10), initiate (expires+1800), confirm, release (counters++), **heartbeat**, **complain**, **list_balances**, **set_balance**
- `schema.rs` + `migrations.rs`: p2p_agent_balances, tokens (10 seeded USDT/USDC/DAI/FDUSD/PYUSD/USD/EUR/BTC/ETH/PINC), 16 add_column_if_missing
- `lib.rs`: 16 p2p commands registered

## Countries — 150
`core/regions/countries.rs` 151 matches (150 + struct): +28 added (BF BJ ML NE GM GN GQ GW SL SO ST SZ TD CF DJ ER LS MG MR MW KZ UZ AZ GE AM BY MD BO) synced to pinc-sarai. Sanctions fixed BY=2 SO=1 DJ=1 ER=1.

## i18n — 33 Languages + RTL
`src/i18n/index.ts`: 33 SUPPORTED_LANGUAGES {code,label,nativeLabel,dir}. RTL=5: ar-SA ar-EG ur-PK fa-IR he-IL → setLanguage syncs document.documentElement.lang/dir. globals.css RTL rules + Noto font fallback stack.

## Verification
- cargo check: PASS (0 errors, 4 warnings)
- cargo test internal_wallets: 7/7 PASS
- tsc --noEmit: 0 errors
- vite build: 335kB OK
- Countries: 151 ✓ | p2p cmds: 14 ✓ | i18n SUPPORTED: 33 ✓

## Remaining (next phase)
- Live agent heartbeat from agent app (60s interval invoke cmd_p2p_agent_heartbeat)
- Real token balance funding flow (deposit credits p2p_agent_balances)
- Withdraw reverse flow (cmd_p2p_agent_initiate_withdraw)
- 150-country payment method map → payment_regions.rs sync
- Crowdin/TMS for 33-language translation completion (21 new blocks are core-keys only)
