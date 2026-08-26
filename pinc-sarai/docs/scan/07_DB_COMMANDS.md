# Agent 7 — DB + COMMANDS Exhaustive Report
**Files:** `src-tauri/src/core/database/schema.rs:1` 858L 71 tables, `migrations.rs:491`, `connection.rs:32`, `queries.rs:1743`, `commands.rs:3645 150 cmds`, `core/commands/mod.rs:1388 52 cmds`, `modules/p2p_agents/*`, `lib.rs:161 handler 278`, `core/crypto/tauri_commands.rs:357 23 orphan`

## schema.rs 71 CREATE TABLE (claimed 42)
- tables 1-71: schema_version, identities, contacts, forum_posts/comments/profiles/communities (MIGRATE_CONTACTS misnamed), vault_files, peers, settings, activity_log, file_chunks orphan, node_status, distributed_chunks orphan, messages + indexes, marketplace_jobs (budget_min/max etc migration), wallet_transactions (id,amount,tx_type,peer_id,status,created_at missing 7 cols), reputation, wagers, social_posts, ai_agents, storage_contracts, wallet_balances (node PK balance escrow pending_in/out currency PINC updated_at), rift_listings/rentals/metrics/payments, shared_connections, peer_bandwidth_usage orphan, net_store_purchases/listings (bandwidth_mbps drift), net_share_codes, messaging_keys (x25519_private plaintext), hotspot orphan, escrow_holds (payer/payee amount reason status held created released), conversations, billing_transactions orphan, game_sessions/progress drift, p2p_agents/channels/comm_links/deposit_orders (EscrowHeld etc), audit_logs/payment_links/op_trails indexes, channels, call_history, sessions, faucet_claims, tournaments, web_games, admin_users, admin_logs, system_config, local_users, recovery_codes, job_applications, social_comments, follows, challenges (autoincrement), problems, duels, products, resources, resource_requests/bug TEXT, allocations TEXT, usage, marketplace_listings TEXT, build_telemetry 71 + recovery_attempts ad-hoc.

## migrations.rs run_migrations 60 execute_batch sequential, migrate_messages/conversations/messaging_keys/contacts_schema handle legacy peer_id renames, add_column_if_missing for wagers.data 7 marketplace cols identities.username/password_hash, INSERT SCHEMA_VERSION if empty, FK only p2p channels/links.

## connection.rs Database {conn Arc<Mutex<Connection>>} PRAGMA WAL foreign_keys synchronous NORMAL single connection bottleneck, open_test_db in-memory + migrations.

## queries.rs 1743L — coverage: identities insert/load/count/search, vault, marketplace_jobs partial insert 7 cols, settings, peers, reputation, wallet_balances get/upsert, wallet_transactions insert lossy from_node "", currency PINC, list clone fabricated, escrow get only read, game sessions tournaments admin system local recovery contacts full, billing file_chunks orphan raw SQL.

## identity/* generator 32 entropy BIP39 build_identity SHA256(master) XChaCha24 node 07%10M 23 bits, recovery rebuild random keys mismatch, fingerprint FP- low, session uuid.

## p2p_agents/models 183L PaymentNetwork Binance PayPal Sendwave BankTransfer USDT MPesa Skrill, CommPlatform WhatsApp Telegram Signal Discord Email, Agent etc, PaymentChannel, CommLink, AgentFilter, QuoteResult, DepositStatus PendingPayment EscrowHeld etc, DepositOrder.

## p2p storage 540L insert_agent/update/delete/get/list LEFT JOIN network filter, insert_channel/unbind/list/get, comm_link, deposit_order, generate_id uuid, calculate_quote fee=base*fee%+commission% total, HttpSender whatsapp gateway http://localhost:3001 + telegram bot stub.

## p2p commands 452L 12 cmds list/create/update/delete bind_channel/unbind bind_commlink/unbind calc_quote enabled min/max initiate_deposit async lock escrow held INSERT DepositOrder EscrowHeld audit HttpSender, confirm PaymentConfirmed, release Completed UPDATE released.

## treasury.rs 128L orphan not mod, FAUCET_MAX 1000 DAILY 5000 WELCOME 1000 faucet_request daily sum + create_transaction INSERT faucet_claims (ledger funcs undefined not compile).

## marketplace types Job etc engine not scanned.

## commands.rs AppState 148-168 19 fields db nexus rift kingsman ghost localization peer_registry bandwidth discovery relay message_router metrics net_share p2p_network web_socket_server vault audit starteran treific NO crypto_engine despite phase12 needing it.

## commands.rs 150 signatures startup 3, localization 6, nexus 2, rift 7, marketplace 3, identity 5, vault/network etc 214 listed full inventory 3645L.

## core/commands/mod.rs 52 stubs: starteran status REAL, rentbit status real sysinfo, device_scan real network Mbps blocking, get_conversations REAL, call_history REAL, get_communities STUB vec![], status_updates stub, challenges stub, rankings stub, jobs SELECT REAL partial, my_jobs stub, create_job BUG ignores category, apply fake no DB, forums REAL, list_communities REAL, challenges PROBLEMS duels products stub seed, starteran listing drift.

## tauri_commands.rs 23 crypto_orphan not handler crypto_sync_evm get_chain_status add_chain create_template get_templates deploy get_deployed execute_interaction quote_swap execute_swap get_tokens get_pools quote_bridge create_bridge complete_bridge get_bridges get_farms create_yield get_user_positions get_lending get_staking create_staking get_engine_status — all need AppState.crypto_engine missing fail compile, not in lib.rs handler unreachable.

## lib.rs handler 278 entries 214 commands:: +52 core::commands +12 p2p agents, listed exhaustive not including crypto_.

