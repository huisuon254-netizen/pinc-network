# Agent 1 — WALLET CORE Exhaustive Report
**Files:** `src-tauri/src/core/payment/*`, `src-tauri/src/core/crypto/wallet.rs:1`, `src-tauri/src/core/database/schema.rs:181`, `src-tauri/src/commands.rs:1052`, `src/types/index.ts:160`, `src/store/appStore.ts:177`

## 1. payment/mod.rs:1 — Missing treasury export
`pub mod treasury;` absent → `treasury.rs` orphaned, `crate::core::payment::treasury::faucet_request` unreachable.

## 2. payment/types.rs:1 — 97L
- TxType: Deposit,Withdrawal,EscrowLock,EscrowRelease,EscrowReturn,Transfer,Fee,Reward
- TxStatus: Pending,Confirmed,Failed,Cancelled,Disputed
- Transaction {id,from_node,to_node?,amount f64,currency,tx_type,status,reference?,memo?,created_at,confirmed_at?,chain_tx_hash?}
- Wallet {node_id,balance f64,escrow_locked,pending_in/out,currency,last_updated, available()=max(0,balance-escrow)}
- Escrow {id,payer,payee,amount,currency,reference,locked_at,releases_at?,released,returned,conditions[]}
- EscrowCondition {description,met,verified_at?}
- WithdrawalRequest {id,node_id,amount,destination,chain,status,created_at,recipient_confirmed}
- PaymentProof {tx_id,amount,timestamp,signature Vec<u8>}
**Flaws:** f64 money (rounding), available ignores pending_out, Escrow booleans both true possible, conditions not persisted, currency per-wallet but check only ==, WithdrawalRequest dead, signature no verify.

## 3. ledger.rs:1 — 88L
- transfer(&mut Wallet,&mut Wallet,amount,memo) checks >0, currency==, available, then balances move, returns Transfer Confirmed
- deposit(&mut Wallet,amount,chain_hash) balance+=
- new_wallet(node_id) 0 PINC
**Flaws:** Missing create_transaction/ensure_wallet_exists (called by treasury), in-memory only no DB, deposit no dedup, immediate Confirmed.

## 4. escrow.rs:1 — 100L
- lock_escrow payer escrow_locked+=, release checks all met then payer.balance-= payee.balance+= released=true, return unlock, mark_condition_met, refund_escrow_db UPDATE escrow_holds refunded
**Flaws:** Two universes (mem vs DB), lock never INSERT, release never UPDATE balances, underflow no max(0), no timeout, refund ignores amount, no dispute.

## 5. treasury.rs:1 — 128L orphaned
- FAUCET_MAX 1000, DAILY 5000, WELCOME 1000, faucet_request sums faucet_claims today_start=now%86400 vs midnight UTC drift, TOCTOU race, welcome double-claim, get_treasury_info sums.

## 6. wallet.rs:1 — 156L
- Wallet {mnemonic String plaintext, eth_address,bnb_address,tron_address}, new_random thread_rng BIP39, from_mnemonic BIP44 m/44'/60'/0'/0/0 ETH same BNB, m/44'/195'/0'/0/0 TRON hex not Base58, ERC20_ABI unused, USDT/USDC mainnet only, DepositManager HashMap<String,f64> in-memory discard mnemonic, process_webhook no HMAC no hash dedup, value f64.

## 7. schema.rs wallet tables
- wallet_transactions(id,amount,tx_type,peer_id,status,created_at) missing 7 cols vs struct, peer_id overloaded to_node, from_node lost
- wallet_balances(node_id PK,balance,escrow_locked,pending_in/out,currency PINC,updated_at)
- escrow_holds(id,payer,payee,amount,reason,status held|locked|released|refunded,created_at,released_at) no currency/conditions, 4 status strings typo-prone
- billing_transactions orphan, faucet_claims integer PK no unique, missing wallet_addresses, withdrawal_requests.

## 8. queries.rs:630 — get_wallet_balance, upsert_wallet_balance UPSERT, insert_transaction drops 6 fields, list_transactions fabricates from_node "", currency PINC, no get_transaction, no pagination, no escrow helpers.

## 9. commands.rs wallet
- cmd_get_wallet_balance 1052 returns balance/currency/escrow/pending_in/out vs TS expects balance/pending/total_earned mismatch
- cmd_transfer_tokens 1984 never checks balance/upsert, direct insert allow overdraft, memo ignored in send_payment
- cmd_faucet_request 2028 hardcode 1000 no limit no faucet_claims no wallet_balances, spamable
- cmd_create_escrow 2053 INSERT locked no available check, cmd_release_escrow 2073 UPDATE released no fund move, refund no credit.

## 10. types/index.ts:160 WalletBalance{pending ambiguous}, Transaction type deposit|withdrawal|transfer|earning vs TxType 8 variants, status completed vs Confirmed case mismatch, from/to vs from_node/to_node undefined, missing Escrow interfaces.

## 11. appStore.ts:177 refreshWallet silent catch{}, pending sum deposits+withdrawals loses direction, total_earned=balance not cumulative, no polling, persist skips wallet, invoke<any> no types.

## 12. i18n dual systems: index.ts 12 langs wallet.* 8 keys vs locales.json 20 locales payment.* nested, Sarai not wired to both, missing 10 keys, localStorage not Android.

## 13. Critical blockers: f64 money, missing ledger funcs, mem vs DB split, faucet bypass, transfer no check, escrow no funds, TRON hex, mnemonic plaintext, type mismatch, webhook no auth, schema truncation, no withdrawal, i18n dual.
