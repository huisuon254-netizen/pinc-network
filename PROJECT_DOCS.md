# PINC Network — Project Documentation

> **Version:** 3.0.0
> **Last Updated:** 2026-06-23
> **Architecture:** Tauri v2 + Rust backend + React frontend

---

## 1. Platform Overview

### What is PINC?

PINC (Peer Infrastructure for Networked Computing) is a decentralized peer-to-peer platform built as a desktop application. It enables users to share bandwidth, rent computing resources, communicate securely, trade jobs, play games with wagers, and earn PINC tokens — all within a single unified client.

### Ecosystem Structure

PINC is divided into **10 sub-systems (phases)**, each a self-contained module:

| Module | Name | Purpose | Phase |
|--------|------|---------|-------|
| **HOME** | Node Home | Identity card, earnings, activity feed, rankings, node status | — |
| **TREIFIC** | Communication Hub | Encrypted messaging, voice/video calls, communities, status updates | Phase 5 |
| **SARAI** | Wallet System | Balance management, transactions, P2P agent deposits/withdrawals, notifications, history | Phase 7 |
| **STARTERAN** | Bandwidth Marketplace | Speed testing, bandwidth sharing, approval tiers, QR pairing, controls | Phase 3 |
| **RENTBIT** | Server Rental Marketplace | Device scanning, qualification, hosting options, server marketplace | Phase 4 |
| **WAGERS** | Gaming & Competition | Wagers, games, tournaments, challenges, leaderboard | Phase 10 |
| **JOBS** | Freelance Marketplace | Browse jobs, post jobs, manage applications, earnings | Phase 6 |
| **RANKINGS** | Leaderboards | 6 category leaderboards (relay, job, payment, uptime, dispute, overall) | Phase 8 |
| **SECURITY** | Identity & Protection | Identity management, device tracking, security logs, recovery | Phase 16 |
| **SETTINGS** | Configuration | Account, security, privacy, notifications, appearance, network, AI, backup | — |

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    React Frontend (TSX)                      │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌─────────┐ │
│  │ HOME │ │TREIFIC│ │ SARAI│ │START.│ │RENT. │ │WAGERS/JOBS│
│  └──┬───┘ └──┬───┘ └──┬───┘ └──┬───┘ └──┬───┘ └────┬────┘ │
│     └────────┴────────┴────────┴────────┴──────────┘       │
│                    Zustand Store (appStore)                  │
│                    invoke('cmd_*')                           │
├─────────────────────────────────────────────────────────────┤
│                    Tauri IPC Bridge                          │
├─────────────────────────────────────────────────────────────┤
│                     Rust Backend                             │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  commands.rs (80+ Tauri commands)                      │ │
│  │  core/commands/mod.rs (15+ additional commands)        │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌─────────┐ ┌────────┐ ┌────────┐ ┌──────┐ ┌───────────┐ │
│  │Database │ │Network │ │Security│ │ AI   │ │Messaging  │ │
│  │(SQLite) │ │(P2P)   │ │(Kings.)│ │Engine│ │(Router)   │ │
│  └─────────┘ └────────┘ └────────┘ └──────┘ └───────────┘ │
└─────────────────────────────────────────────────────────────┘
```

**Key technologies:**
- **Frontend:** React 18, TypeScript, Zustand, Framer Motion, Lucide icons, Tailwind-style CSS variables
- **Backend:** Rust, Tauri v2, SQLite (via rusqlite), tokio async runtime
- **Crypto:** XChaCha20-Poly1305 (encryption), Ed25519 (signing), Blake3 (hashing), Argon2 (password hashing)
- **AI:** Whisper (transcription), LLaMA (inference), ONNX (image segmentation), TTS (voice synthesis)
- **Networking:** WebSocket server, WebRTC signaling, QUIC transport, mDNS discovery

---

## 2. Navigation Map

### Sidebar Navigation (`src/components/sidebar/Sidebar.tsx`)

The sidebar defines 10 top-level tabs (`FullDashTab` type):

```
HOME | TREIFIC | SARAI | STARTERAN | RENTBIT | WAGERS | JOBS | RANKINGS | SECURITY | SETTINGS
```

### Page → Tab Structure

#### HOME (`NodeHome.tsx`)
- **Identity Card** — node_id, public key, fingerprint, created_at
- **Earnings** — wallet balance, recent transactions
- **Activity** — recent activity feed (logged via `log_activity`)
- **Rankings** — top rankings across categories
- **Node Status** — online status, peer count, bandwidth, messages relayed

#### TREIFIC (`TreificPage.tsx`) — Phase 5: Communication Hub
| Tab | Commands Called | Description |
|-----|----------------|-------------|
| **Messages** | `cmd_get_conversations`, `cmd_get_messages`, `cmd_send_message` | E2E encrypted chat with conversation list |
| **Calls** | `cmd_get_call_history` | Voice/video call log (incoming, outgoing, missed) |
| **Communities** | `cmd_get_communities` | Public/private community groups |
| **Status** | `cmd_get_status_updates` | Post and view status updates |

#### SARAI (`SaraiPage.tsx`) — Phase 7: Wallet System
| Tab | Commands Called | Description |
|-----|----------------|-------------|
| **Dashboard** | `cmd_get_wallet_balance`, `cmd_get_transactions` | Balance overview, transaction counts |
| **Transactions** | `cmd_get_transactions` | Filtered transaction list (deposit/withdrawal/transfer/earning) |
| **P2P Agent** | — | Deposit/withdrawal methods (agent, crypto, bank) |
| **Notifications** | (from store) | Wallet notifications |
| **History** | `cmd_get_wallet_history` | Searchable transaction history table |

#### STARTERAN (`StarteranPage.tsx`) — Phase 3: Bandwidth Marketplace
| Tab | Commands Called | Description |
|-----|----------------|-------------|
| **Dashboard** | `cmd_get_starteran_status` | Sharing stats, approval level, toggle sharing |
| **Speed Scan** | `cmd_run_speed_test` | Download/upload/latency/jitter testing |
| **Share** | `cmd_generate_pairing_code`, `cmd_generate_qr_png`, `cmd_connect_with_code`, `cmd_toggle_net_sharing` | QR code pairing, bandwidth sharing toggle |
| **Approval Levels** | — | 5-tier system: Bronze → Enterprise |
| **Controls** | `cmd_toggle_net_sharing` | Availability toggle, bandwidth limits, auto-reconnect |

#### RENTBIT (`RentbitPage.tsx`) — Phase 4: Server Rental
| Tab | Commands Called | Description |
|-----|----------------|-------------|
| **Dashboard** | `cmd_get_rentbit_status` | Active rentals, CPU/RAM/storage usage, earnings |
| **Device Scan** | `cmd_run_device_scan` | Real hardware detection (CPU, RAM, storage, network, uptime) |
| **Qualification** | — | Hardware qualification for hosting |
| **Hosting Options** | — | List server for rent options |
| **Marketplace** | `cmd_get_rift_listings`, `cmd_create_server_listing`, `cmd_rent_server` | Browse and rent servers |

#### WAGERS (`WagerPage.tsx`) — Phase 10: Gaming & Competition
| Tab | Commands Called | Description |
|-----|----------------|-------------|
| **Wagers** | `cmd_get_wagers`, `cmd_create_wager` | Create and manage PINC wagers |
| **Games** | `cmd_get_games` | Browse available games |
| **Tournaments** | `cmd_get_tournaments`, `cmd_create_tournament`, `cmd_join_tournament` | Tournament management |
| **Challenges** | `cmd_get_challenges`, `cmd_create_challenge` | Coding/gaming/AI challenges |
| **Leaderboard** | — | Top players and rankings |

#### JOBS (`JobsPage.tsx`) — Phase 6: Freelance Marketplace
| Tab | Commands Called | Description |
|-----|----------------|-------------|
| **Dashboard** | `cmd_get_marketplace_stats` | Marketplace overview, active/completed jobs |
| **Browse Jobs** | `cmd_get_marketplace_listings` | Browse available job listings |
| **My Jobs** | `cmd_create_job` | Manage posted jobs |
| **Earnings** | — | Job-related earnings |

#### RANKINGS (`RankingsPage.tsx`) — Phase 8: Leaderboards
6 category leaderboards:
- **Relay Score** — bandwidth relay contribution
- **Job Score** — job completion performance
- **Payment Score** — payment reliability
- **Uptime Score** — node availability
- **Dispute Score** — dispute resolution
- **Overall** — combined ranking

Commands: `cmd_get_rankings` (per category)

#### SECURITY (`SecurityPage.tsx`) — Phase 16
| Tab | Commands Called | Description |
|-----|----------------|-------------|
| **Identity** | `cmd_has_identity`, `cmd_get_identity`, `cmd_create_identity`, `cmd_recover_identity` | Create/recover node identity |
| **Devices** | `cmd_get_devices` | Linked device management |
| **Logs** | `cmd_get_security_logs` | Security event log |
| **Recovery** | — | Recovery phrase and backup |

#### SETTINGS (`SettingsPage.tsx`)
| Tab | Description |
|-----|-------------|
| **Account** | Username, email, password change |
| **Security** | 2FA, session timeout, login alerts, biometric |
| **Privacy** | Profile visibility, online status, data collection |
| **Notifications** | Email, push, in-app, transaction/security alerts |
| **Appearance** | Theme (dark/light), font size, language, compact mode |
| **Network** | Proxy, DNS, connection timeout, auto-reconnect |
| **AI** | API keys (Groq), model selection, temperature, streaming |
| **Backup** | Auto-backup, frequency, encryption |

---

## 3. Backend Commands Registry

All commands are registered in `src-tauri/src/lib.rs:122-285`.

### Commands from `commands.rs` (Primary — 130+ commands)

#### Startup & Governance
| Command | Parameters | Returns | Description |
|---------|-----------|---------|-------------|
| `cmd_run_startup` | — | `StartupReport` | Run startup health checks |
| `cmd_activate_kingsman` | `code: String` | `bool` | Activate Kingsman admin engine |
| `cmd_get_admin_status` | — | `KingsmanStatus` | Get admin/governance status |
| `is_admin_password` | `password: String` | `Result<bool>` | Check admin password |
| `validate_admin_access` | `password: String` | `Result<Value>` | Validate admin access with permission level |

#### Identity
| Command | Parameters | Returns | Description |
|---------|-----------|---------|-------------|
| `cmd_has_identity` | — | `bool` | Check if identity exists |
| `cmd_get_identity` | — | `Result<Option<IdentityResponse>>` | Get current identity |
| `cmd_create_identity` | `master_key_hex: String` | `Result<IdentityResponse>` | Create new identity from master key |
| `cmd_recover_identity` | `phrase: String, master_key_hex: String` | `Result<IdentityResponse>` | Recover identity from phrase |

#### Node & Network
| Command | Parameters | Returns | Description |
|---------|-----------|---------|-------------|
| `cmd_get_node_status` | — | `Value` | Get node status (peers, vault, bandwidth, metrics) |
| `cmd_get_node_info` | — | `Result<Value>` | Get node ID, public key, fingerprint |
| `cmd_get_network_status` | — | `Result<NetworkStatus>` | Get network status (online, peers, relay, NAT, mesh) |
| `cmd_get_peers` | — | `Result<Vec<PeerInfo>>` | Get online peers |
| `cmd_get_nodes` | — | `Result<Vec<PeerInfo>>` | Get all peers |
| `cmd_connect_to_peer` | `peer_addr: String` | `Result<String>` | Connect to peer at address |
| `cmd_scan_network` | — | `Result<Vec<PeerInfo>>` | Scan for online peers |

#### Vault (Encrypted Storage)
| Command | Parameters | Returns | Description |
|---------|-----------|---------|-------------|
| `cmd_list_vault` | — | `Result<Vec<VaultFileRecord>>` | List vault files |
| `cmd_list_files` | — | `Result<Vec<VaultFileRecord>>` | List files (alias) |
| `cmd_save_file` | `req: VaultFileRecord` | `Result<VaultFileRecord>` | Save file record |
| `cmd_upload_file` | `name: String, data: Vec<u8>, encrypt: bool` | `Result<VaultFileRecord>` | Upload file to vault |
| `cmd_download_file` | `file_id: String` | `Result<Vec<u8>>` | Download file from vault |
| `cmd_delete_file` | `file_id: String` | `Result<()>` | Delete vault file |

#### Wallet & Payments (SARAI)
| Command | Parameters | Returns | Description |
|---------|-----------|---------|-------------|
| `cmd_get_wallet_balance` | — | `Result<Value>` | Get wallet balance (balance, escrow, pending) |
| `cmd_get_transactions` | — | `Result<Vec<Value>>` | Get all transactions |
| `cmd_get_wallet_history` | — | `Result<Vec<Transaction>>` | Get wallet history |
| `cmd_transfer_tokens` | `to_node: String, amount: f64` | `Result<Value>` | Transfer PINC tokens |
| `cmd_send_payment` | `to_node: String, amount: f64, memo: Option<String>` | `Result<Value>` | Send payment with optional memo |
| `cmd_faucet_request` | — | `Result<Value>` | Request 1000 PINC from faucet |
| `cmd_create_escrow` | `payee_node: String, amount: f64, reason: String` | `Result<Value>` | Create escrow hold |
| `cmd_release_escrow` | `escrow_id: String` | `Result<()>` | Release escrow funds |
| `cmd_refund_escrow` | `escrow_id: String` | `Result<Value>` | Refund escrow to payer |

#### Messaging (TREIFIC)
| Command | Parameters | Returns | Description |
|---------|-----------|---------|-------------|
| `cmd_get_messages` | `peer_id: String` | `Vec<Message>` | Get messages for a peer |
| `cmd_send_message` | `peer_id: String, content: String` | `Result<Message>` | Send encrypted message |

#### Calls (WebRTC)
| Command | Parameters | Returns | Description |
|---------|-----------|---------|-------------|
| `cmd_initiate_call` | `peer_id: String, call_type: String` | `Result<Value>` | Initiate voice/video call |
| `cmd_answer_call` | `peer_id: String, offer_sdp: String` | `Result<Value>` | Answer incoming call |
| `cmd_hang_up` | `peer_id: String` | `Result<Value>` | End active call |
| `cmd_get_call_status` | — | `Result<Value>` | Get current call status |

#### Marketplace (JOBS)
| Command | Parameters | Returns | Description |
|---------|-----------|---------|-------------|
| `cmd_get_marketplace_listings` | — | `Result<Vec<Job>>` | Get all job listings |
| `cmd_get_marketplace_stats` | — | `Result<Value>` | Get marketplace statistics |
| `cmd_create_job` | `title: String, description: String, budget: f64` | `Result<Job>` | Create a new job listing |

#### Reputation & Social
| Command | Parameters | Returns | Description |
|---------|-----------|---------|-------------|
| `cmd_get_reputation` | `node_id: String` | `Result<Value>` | Get reputation scores |
| `cmd_get_social_feed` | — | `Result<Vec<Post>>` | Get social feed |
| `cmd_create_post` | `content: String` | `Result<Post>` | Create social post |

#### Gaming & Wagers (WAGERS)
| Command | Parameters | Returns | Description |
|---------|-----------|---------|-------------|
| `cmd_get_wagers` | — | `Result<Vec<Wager>>` | Get all wagers |
| `cmd_create_wager` | `amount: f64, opponent: String` | `Result<Wager>` | Create a wager |
| `cmd_get_wager` | `wager_id: String` | `Result<Value>` | Get wager details |
| `cmd_update_wager` | `wager_id: String, status: String` | `Result<()>` | Update wager status |
| `cmd_delete_wager` | `wager_id: String` | `Result<()>` | Delete a wager |
| `cmd_settle_wager` | `wager_id: String, winner_id: String` | `Result<()>` | Settle wager with winner |
| `cmd_get_games` | — | `Result<Vec<Value>>` | Get available games |
| `cmd_get_tournaments` | — | `Result<Vec<Value>>` | Get tournaments |
| `cmd_create_tournament` | `name: String, game_id: String, max_players: u32, entry_fee: f64` | `Result<Value>` | Create tournament |
| `cmd_join_tournament` | `tournament_id: String` | `Result<()>` | Join tournament |
| `cmd_start_tournament` | `tournament_id: String` | `Result<()>` | Start tournament |
| `cmd_end_tournament` | `tournament_id: String` | `Result<()>` | End tournament |
| `cmd_save_game_progress` | `game_id: String, high_score: u64, play_time_secs: u64` | `Result<()>` | Save game progress |
| `cmd_get_game_progress` | `game_id: String` | `Result<Value>` | Get game progress |
| `cmd_get_user_game_stats` | — | `Result<Value>` | Get user game statistics |
| `cmd_create_game_session` | `game_id: String, max_players: u32` | `Result<Value>` | Create multiplayer session |
| `cmd_join_game_session` | `session_id: String` | `Result<()>` | Join game session |
| `cmd_submit_score` | `session_id: String, score: u64` | `Result<()>` | Submit game score |
| `cmd_arena_create_duel` | `opponent_id: String, game_id: String, stake_amount: f64` | `Result<Value>` | Create duel |

#### Server Rental (RENTBIT / RIFT)
| Command | Parameters | Returns | Description |
|---------|-----------|---------|-------------|
| `cmd_get_rift_listings` | — | `Result<Vec<ServerListing>>` | Get server listings |
| `cmd_create_server_listing` | `tier, price, cpu, ram, storage, speed` | `Result<ServerListing>` | List a server |
| `cmd_rent_server` | `server_id: String, period: String, duration_hours: u32` | `Result<RentalAgreement>` | Rent a server |
| `cmd_return_server` | `rental_id: String` | `Result<()>` | Return rented server |
| `cmd_update_server_metrics` | `server_id: String, metrics: ServerMetrics` | `Result<()>` | Update server metrics |
| `cmd_get_server_metrics` | `server_id: String` | `Result<Value>` | Get server metrics |
| `cmd_get_active_rentals` | — | `Result<Vec<RentalAgreement>>` | Get active rentals |

#### Network Sharing (STARTERAN / NEXUS)
| Command | Parameters | Returns | Description |
|---------|-----------|---------|-------------|
| `cmd_run_speed_test` | — | `Result<SpeedTestResult>` | Run speed test via Cloudflare |
| `cmd_toggle_net_sharing` | `active: bool` | `Result<()>` | Toggle bandwidth sharing |

#### Ghost Origin (Privacy / Tor-like)
| Command | Parameters | Returns | Description |
|---------|-----------|---------|-------------|
| `cmd_get_ghost_origin_status` | — | `GhostOriginStatus` | Get privacy proxy status |
| `cmd_toggle_ghost_origin` | — | `Result<GhostOriginStatus>` | Toggle privacy mode |
| `cmd_set_ghost_origin_region` | `region: String` | `Result<GhostOriginStatus>` | Set exit node region |
| `cmd_set_ghost_origin_hops` | `hops: u8` | `Result<GhostOriginStatus>` | Set circuit hops (1-7) |

#### Localization
| Command | Parameters | Returns | Description |
|---------|-----------|---------|-------------|
| `cmd_download_language` | `code: String` | `Result<()>` | Download language pack |
| `cmd_set_language` | `code: String` | `Result<()>` | Set active language |

#### Settings
| Command | Parameters | Returns | Description |
|---------|-----------|---------|-------------|
| `cmd_get_settings` | — | `Result<PincSettings>` | Get all settings |
| `cmd_update_settings` | `settings: PincSettings` | `Result<()>` | Update settings |
| `cmd_apply_settings` | — | `Result<()>` | Apply settings (stub) |
| `cmd_reset_settings_section` | `section: String` | `Result<()>` | Reset section (stub) |
| `cmd_reset_all_settings` | — | `Result<()>` | Reset all (stub) |

#### Distributed Storage
| Command | Parameters | Returns | Description |
|---------|-----------|---------|-------------|
| `cmd_get_distributed_status` | — | `Result<Value>` | Get distributed vault status |
| `cmd_get_storage_contracts` | — | `Result<Vec<StorageContract>>` | Get storage contracts |
| `cmd_repair_shards` | — | `Result<Value>` | Repair storage shards |

#### AI (Phase 11)
| Command | Parameters | Returns | Description |
|---------|-----------|---------|-------------|
| `cmd_get_ai_agents` | — | `Result<Vec<AiAgent>>` | Get AI agents |
| `cmd_run_ai_inference` | `prompt: String` | `Result<Value>` | Run AI inference (local or Groq) |
| `cmd_whisper_transcribe` | `audio_data: Vec<u8>` | `Result<String>` | Transcribe audio |
| `cmd_llama_load_model` | `model_path, params` | `Result<String>` | Load LLaMA model |
| `cmd_llama_infer` | `model_id, prompt, params` | `Result<String>` | LLaMA inference |
| `cmd_llama_generate` | `model_id, prompt, params` | `Result<String>` | LLaMA text generation |
| `cmd_llama_unload_model` | `model_id` | `Result<()>` | Unload LLaMA model |
| `cmd_onnx_load_model` | `model_path` | `Result<String>` | Load ONNX model |
| `cmd_onnx_segment_image` | `model_id, image_data` | `Result<ImageSegmentation>` | Image segmentation |
| `cmd_onnx_unload_model` | `model_id` | `Result<()>` | Unload ONNX model |
| `cmd_tts_create_voice_profile` | `name, audio_samples` | `Result<String>` | Create TTS voice profile |
| `cmd_tts_synthesize` | `profile_id, text, params` | `Result<Vec<f32>>` | Synthesize speech |
| `cmd_get_model_cache_stats` | — | `Result<Value>` | Get model cache stats |
| `cmd_clear_model_cache` | — | `Result<()>` | Clear model cache |

#### WebSocket
| Command | Parameters | Returns | Description |
|---------|-----------|---------|-------------|
| `cmd_get_websocket_status` | — | `Result<Value>` | Get WebSocket server status |
| `cmd_websocket_broadcast` | `message: String` | `Result<()>` | Broadcast message via WebSocket |
| `cmd_websocket_shutdown` | — | `Result<()>` | Shutdown WebSocket server |

#### Net Share & Pairing
| Command | Parameters | Returns | Description |
|---------|-----------|---------|-------------|
| `cmd_generate_pairing_code` | — | `Result<Value>` | Generate PINC-XXXXXX pairing code |
| `cmd_validate_pairing_code` | `code: String` | `Result<bool>` | Validate pairing code format |
| `cmd_generate_qr_png` | `data: Option<String>` | `Result<String>` | Generate QR code as base64 PNG |
| `cmd_connect_with_code` | `code: String` | `Result<Value>` | Connect using pairing code |
| `cmd_get_shared_connections` | — | `Result<Vec<Value>>` | Get shared connections |
| `cmd_disconnect_shared` | `peer_id` | `Result<()>` | Disconnect shared peer |
| `cmd_get_net_share_status` | — | `Result<Value>` | Get net share status |
| `cmd_toggle_net_share` | `enabled: bool` | `Result<()>` | Toggle net sharing |

#### Net Store
| Command | Parameters | Returns | Description |
|---------|-----------|---------|-------------|
| `cmd_create_net_store_listing` | `bandwidth_mbps, price_per_gb, location` | `Result<Value>` | Create bandwidth listing |
| `cmd_list_net_store_listings` | — | `Result<Vec<Value>>` | List bandwidth listings |
| `cmd_purchase_bandwidth` | `listing_id, hours` | `Result<Value>` | Purchase bandwidth |
| `cmd_get_my_listings` | — | `Result<Vec<Value>>` | Get user's listings |
| `cmd_get_my_purchases` | — | `Result<Vec<Value>>` | Get user's purchases |

#### Metrics
| Command | Parameters | Returns | Description |
|---------|-----------|---------|-------------|
| `cmd_get_metrics` | — | `Value` | Get system metrics |

#### API Keys
| Command | Parameters | Returns | Description |
|---------|-----------|---------|-------------|
| `cmd_get_api_keys` | — | `Result<Value>` | Get API key names |
| `cmd_get_api_key_status` | — | `Result<Value>` | Check which API keys are configured |

#### Admin Commands (20+ commands)
| Command | Parameters | Returns | Description |
|---------|-----------|---------|-------------|
| `cmd_admin_get_overview` | — | `Result<Value>` | Admin dashboard overview |
| `cmd_admin_list_users` | — | `Result<Vec<Value>>` | List admin users |
| `cmd_admin_create_user` | `username, email, password, role` | `Result<Value>` | Create admin user |
| `cmd_admin_update_user` | `user_id, updates` | `Result<()>` | Update admin user |
| `cmd_admin_delete_user` | `user_id` | `Result<()>` | Delete admin user |
| `cmd_admin_toggle_user` | `user_id, active` | `Result<()>` | Enable/disable user |
| `cmd_admin_list_logs` | `limit: Option<u32>` | `Result<Vec<Value>>` | List admin logs |
| `cmd_admin_list_logs_filtered` | `action, limit` | `Result<Vec<Value>>` | Filtered admin logs |
| `cmd_admin_list_config` | `category: Option<String>` | `Result<Vec<Value>>` | List system config |
| `cmd_admin_update_config` | `key, value` | `Result<()>` | Update system config |
| `cmd_admin_delete_config` | `key` | `Result<()>` | Delete system config |
| `cmd_admin_get_security` | — | `Result<Value>` | Get security info |
| `cmd_admin_get_network_monitor` | — | `Result<Value>` | Network monitoring |
| `cmd_admin_ban_peer` | `peer_id` | `Result<()>` | Ban peer |
| `cmd_admin_unban_peer` | `peer_id` | `Result<()>` | Unban peer |
| `cmd_admin_reset_password` | `user_id, new_password` | `Result<()>` | Reset user password |
| `cmd_admin_list_banned_peers` | — | `Result<Vec<Value>>` | List banned peers |
| `cmd_admin_get_kingsman_config` | — | `Result<Value>` | Get Kingsman config |
| `cmd_admin_set_kingsman_master_hash` | `master_hash` | `Result<()>` | Set master hash |
| `cmd_admin_change_kingsman_master_hash` | `current_hash, new_hash` | `Result<()>` | Change master hash |
| `cmd_admin_login` | `username, password` | `Result<Value>` | Admin login |
| `cmd_admin_get_stats` | — | `Result<Value>` | Get admin stats |

### Commands from `core/commands/mod.rs` (Secondary — 15 commands)

These are stub/scaffold commands that return empty data:

| Command | Parameters | Returns | Description |
|---------|-----------|---------|-------------|
| `cmd_get_starteran_status` | — | `Result<Value>` | Stub: returns default sharing status |
| `cmd_get_rentbit_status` | — | `Result<Value>` | Stub: returns default rental status |
| `cmd_run_device_scan` | — | `Result<Value>` | **Real:** reads /proc for CPU, RAM, storage, uptime, security |
| `cmd_get_conversations` | — | `Result<Vec<Value>>` | Stub: returns `[]` |
| `cmd_get_call_history` | — | `Result<Vec<Value>>` | Stub: returns `[]` |
| `cmd_get_communities` | — | `Result<Vec<Value>>` | Stub: returns `[]` |
| `cmd_get_status_updates` | — | `Result<Vec<Value>>` | Stub: returns `[]` |
| `cmd_get_challenges` | — | `Result<Vec<Value>>` | Stub: returns `[]` |
| `cmd_get_rankings` | `_category: String` | `Result<Vec<Value>>` | Stub: returns `[]` |
| `cmd_get_security_logs` | — | `Result<Vec<Value>>` | Stub: returns `[]` |
| `cmd_get_devices` | — | `Result<Vec<Value>>` | Stub: returns `[]` |
| `cmd_get_app_notifications` | — | `Result<Vec<Value>>` | Stub: returns `[]` |
| `cmd_get_jobs` | — | `Result<Vec<Value>>` | Stub: returns `[]` |
| `cmd_create_wager` | `opponent_id, game_id, stake_amount, deadline` | `Result<Value>` | Stub: returns pending wager |
| `cmd_create_challenge` | `title, category, difficulty, reward_points, description` | `Result<Value>` | Stub: returns open challenge |
| `cmd_join_tournament` | `tournament_id` | `Result<Value>` | Stub: returns joined=true |
| `cmd_create_tournament` | `name, type_, prize_pool, max_participants, start_time` | `Result<Value>` | Stub: returns created tournament |

---

## 4. TypeScript Types

All types defined in `src/types/index.ts` and `src/types/settings.ts`.

### Core Types

| Interface | File | Used By |
|-----------|------|---------|
| `Identity` | `types/index.ts:1` | Security page, store |
| `StartupCheck` | `types/index.ts:10` | Startup reports |
| `StartupReport` | `types/index.ts:16` | App initialization |
| `NodeStatus` | `types/index.ts:22` | HOME page, store |
| `VaultFile` | `types/index.ts:33` | Vault page |
| `PeerInfo` | `types/index.ts:42` | Network page, peers list |
| `NetworkStatus` | `types/index.ts:53` | Network monitoring |
| `PincSettings` | `types/index.ts:63` | Settings page |
| `ResourceAllocation` | `types/index.ts:148` | Resource management |
| `NetWorldListing` | `types/index.ts:120` | Bandwidth marketplace |
| `SpeedTestResult` | `types/index.ts:131` | Starteran speed scan |
| `GhostOriginStatus` | `types/index.ts:139` | Privacy settings |

### SARAI Types

| Interface | File | Used By |
|-----------|------|---------|
| `WalletBalance` | `types/index.ts:160` | SARAI dashboard |
| `Transaction` | `types/index.ts:166` | Transaction list |
| `WalletNotification` | `types/index.ts:177` | Notifications tab |

### STARTERAN Types

| Interface | File | Used By |
|-----------|------|---------|
| `StarteranStatus` | `types/index.ts:187` | Starteran dashboard |
| `SpeedScanResult` | `types/index.ts:196` | Speed scan results |

### RENTBIT Types

| Interface | File | Used By |
|-----------|------|---------|
| `RentbitStatus` | `types/index.ts:206` | Rentbit dashboard |
| `DeviceScanResult` | `types/index.ts:216` | Device scan results |

### TREIFIC Types

| Interface | File | Used By |
|-----------|------|---------|
| `Conversation` | `types/index.ts:227` | Messages tab |
| `CallRecord` | `types/index.ts:237` | Calls tab |
| `Community` | `types/index.ts:246` | Communities tab |
| `StatusUpdate` | `types/index.ts:255` | Status tab |

### WAGERS Types

| Interface | File | Used By |
|-----------|------|---------|
| `Game` | `types/index.ts:265` | Games tab |
| `Tournament` | `types/index.ts:274` | Tournaments tab |
| `Challenge` | `types/index.ts:285` | Challenges tab |

### JOBS Types

| Interface | File | Used By |
|-----------|------|---------|
| `Job` | `types/index.ts:296` | Jobs marketplace |

### RANKINGS Types

| Interface | File | Used By |
|-----------|------|---------|
| `RankingEntry` | `types/index.ts:310` | Rankings page |

### SECURITY Types

| Interface | File | Used By |
|-----------|------|---------|
| `SecurityLog` | `types/index.ts:320` | Security logs tab |
| `Device` | `types/index.ts:329` | Devices tab |

### NOTIFICATIONS Types

| Interface | File | Used By |
|-----------|------|---------|
| `AppNotification` | `types/index.ts:339` | Notification center |

### RBAC Types

| Type/Interface | File | Description |
|----------------|------|-------------|
| `UserRole` | `types/index.ts:82` | `'admin' \| 'operator' \| 'user' \| 'guest'` |
| `RolePermissions` | `types/index.ts:84` | Permission matrix (10 boolean fields) |
| `ROLE_PERMISSIONS` | `types/index.ts:97` | Static permission map per role |

### Settings Types (`types/settings.ts`)

| Interface | Fields | Description |
|-----------|--------|-------------|
| `AccountSettings` | username, email, currentPassword, newPassword, confirmPassword | User account |
| `SecuritySettings` | twoFactorEnabled, twoFactorMethod, sessionTimeout, loginAlerts, biometricLogin | Security prefs |
| `PrivacySettings` | profileVisibility, showOnlineStatus, allowDataCollection, shareAnalytics, showWalletAddress | Privacy prefs |
| `NotificationSettings` | emailNotifications, pushNotifications, inAppNotifications, transactionAlerts, securityAlerts, marketingEmails, weeklyDigest | Notification prefs |
| `AppearanceSettings` | theme, fontSize, language, compactMode, animationsEnabled | UI prefs |
| `NetworkSettings` | useProxy, proxyAddress, proxyPort, proxyType, customDns, dnsServer, connectionTimeout, autoReconnect | Network prefs |
| `AISettings` | apiKey, groq_api_key, model, groq_model, temperature, maxTokens, streamingEnabled, autoSuggestions, customEndpoint | AI prefs |
| `BackupSettings` | lastBackupDate, autoBackup, backupFrequency, encryptBackups | Backup prefs |
| `AllSettings` | *(all above combined)* | Full settings object |

---

## 5. State Management

### Zustand Store (`src/store/appStore.ts`)

The store uses `zustand` with `persist` middleware, storing to localStorage under key `pinc-settings`.

#### State Fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `screen` | `'splash' \| 'login' \| 'dashboard'` | `'splash'` | Current app screen |
| `identity` | `Identity \| null` | `null` | Current node identity |
| `nodeStatus` | `NodeStatus` | `{online:false, ...}` | Node status metrics |
| `startupReport` | `StartupReport \| null` | `null` | Startup check results |
| `startupDone` | `boolean` | `false` | Whether startup completed |
| `peers` | `PeerInfo[]` | `[]` | Connected peers |
| `vaultFiles` | `VaultFile[]` | `[]` | Vault file list |
| `networkStatus` | `NetworkStatus \| null` | `null` | Network status |
| `error` | `string \| null` | `null` | Current error message |
| `activeTab` | `string` | `'home'` | Active sidebar tab |
| `role` | `UserRole` | `'user'` | Current user role |
| `settings` | `AllSettings` | `DEFAULT_SETTINGS` | All app settings |
| `walletBalance` | `WalletBalance \| null` | `null` | Wallet balance |
| `transactions` | `Transaction[]` | `[]` | Transaction history |
| `starteranStatus` | `StarteranStatus \| null` | `null` | Bandwidth sharing status |
| `rentbitStatus` | `RentbitStatus \| null` | `null` | Server rental status |
| `conversations` | `Conversation[]` | `[]` | Chat conversations |
| `notifications` | `AppNotification[]` | `[]` | App notifications |
| `securityLogs` | `SecurityLog[]` | `[]` | Security event logs |
| `devices` | `Device[]` | `[]` | Linked devices |
| `jobs` | `Job[]` | `[]` | Job listings |
| `tournaments` | `Tournament[]` | `[]` | Game tournaments |
| `challenges` | `Challenge[]` | `[]` | Active challenges |
| `rankings` | `RankingEntry[]` | `[]` | Ranking entries |

#### Actions / Functions

| Action | Description | Invokes |
|--------|-------------|---------|
| `setScreen(screen)` | Set app screen | — |
| `setIdentity(identity)` | Set current identity | — |
| `setActiveTab(tab)` | Set active sidebar tab | — |
| `setRole(role)` | Set user role | — |
| `updateSettings(section, values)` | Merge partial settings | — |
| `resetSection(section)` | Reset one settings section | — |
| `resetAll()` | Reset all settings | — |
| `setSettings(settings)` | Replace all settings | — |
| `saveSettings()` | Persist settings | — |
| `setError(error)` | Set error message | — |
| `refreshWallet()` | Fetch wallet data | `cmd_get_wallet_balance`, `cmd_get_transactions` |
| `refreshStarteran()` | Fetch starteran status | `cmd_get_starteran_status` |
| `refreshRentbit()` | Fetch rentbit status | `cmd_get_rentbit_status` |
| `refreshConversations()` | Fetch conversations | `cmd_get_conversations` |
| `refreshNotifications()` | Fetch notifications | `cmd_get_app_notifications` |
| `refreshSecurity()` | Fetch security data | `cmd_get_security_logs`, `cmd_get_devices` |
| `refreshJobs()` | Fetch jobs/tournaments/challenges/rankings | `cmd_get_jobs`, `cmd_get_tournaments`, `cmd_get_challenges`, `cmd_get_rankings` |
| `refreshNodeStatus()` | *(stub — no-op)* | — |
| `refreshNetwork()` | *(stub — no-op)* | — |
| `loadVault()` | *(stub — no-op)* | — |
| `deleteFile(fileId)` | *(stub — no-op)* | — |
| `initialize()` | Start app, transition to login after 3s | — |

#### Persist Configuration

```typescript
persist({
  name: 'pinc-settings',
  partialize: (state) => ({
    settings: state.settings,    // Persisted
    identity: state.identity,    // Persisted
    screen: state.screen,        // Persisted
  }),
  // Deep merges persisted settings with defaults
})
```

Only `settings`, `identity`, and `screen` survive page reloads.

---

## 6. Missing Features (Based on Current Code)

### Completely Stub (Empty `[]` Returns)

These commands in `core/commands/mod.rs` return empty arrays — no real data:

| Command | Expected Functionality |
|---------|----------------------|
| `cmd_get_conversations` | Real conversation list from database |
| `cmd_get_call_history` | Real call log from database |
| `cmd_get_communities` | Community creation and listing |
| `cmd_get_status_updates` | Status update feed |
| `cmd_get_challenges` | Challenge listings |
| `cmd_get_rankings` | Real ranking data from reputation engine |
| `cmd_get_security_logs` | Security event logging |
| `cmd_get_devices` | Device tracking/management |
| `cmd_get_app_notifications` | Notification system |
| `cmd_get_jobs` | Job listings from marketplace engine |

### Stub Status Commands (Default Values)

| Command | Issue |
|---------|-------|
| `cmd_get_starteran_status` | Returns hardcoded zeros, not from database |
| `cmd_get_rentbit_status` | Returns hardcoded zeros, not from database |

### Real P2P Networking (Currently Local-Only)

- `P2PNetwork::connect_to_peer()` — exists but peers are local/in-memory only
- `PeerRegistry` — tracks peers in `Arc<Mutex<>>`, not persisted across restarts
- No actual mDNS/DHT discovery of remote peers
- No real NAT traversal (relay sessions exist but are not wired)
- WebSocket server starts but has no real peer connections

### Real Wallet Transactions

- `cmd_faucet_request` — gives 1000 PINC instantly (no real faucet network)
- `cmd_transfer_tokens` — writes to local SQLite, no peer-to-peer transfer
- `cmd_send_payment` — same as transfer (calls `cmd_transfer_tokens`)
- No real blockchain or distributed ledger

### Real Job Marketplace

- `cmd_create_job` — saves to local DB only
- No bidding system (`submit_bid` exists in engine but not exposed as command)
- No worker selection, no milestone tracking, no escrow integration

### Real Game Sessions

- `cmd_create_game_session`, `cmd_join_game_session`, `cmd_submit_score` — all local DB only
- No real-time game state synchronization between peers
- No actual game implementations (games are listed from `web_games` table)

### Real Community Creation

- `cmd_get_communities` returns `[]`
- No create community command exists
- No member management

### Real Call Functionality

- `cmd_initiate_call` generates fake SDP offers (not real WebRTC)
- `cmd_answer_call` generates fake SDP answers
- WebSocket signaling exists but no actual WebRTC peer connection
- Call history is written to DB but no real audio/video streaming

### Database Persistence Gaps

- Settings: persisted via Zustand (localStorage), not SQLite
- Rankings: not computed or stored
- Challenges: stub only
- Communities: stub only
- Notifications: stub only
- Device tracking: stub only

---

## 7. Integration Roadmap

Priority order for making features real (based on dependency chain):

### Phase 1: P2P Networking Foundation
**Goal:** Enable real peer discovery and connection
- Implement mDNS/DHT peer discovery
- Wire `PeerRegistry` to persist discovered peers in SQLite
- Implement real NAT traversal via relay network
- Add peer authentication (Ed25519 signature exchange)
- Wire WebSocket server to actual peer connections
- **Commands to fix:** `cmd_connect_to_peer`, `cmd_scan_network`, `cmd_get_peers`

### Phase 2: Wallet Transactions
**Goal:** Enable real token transfers between peers
- Implement transaction signing (Ed25519)
- Add transaction broadcast to connected peers
- Implement UTXO or account-based balance model
- Wire escrow system to real transactions
- Add faucet with rate limiting and balance validation
- **Commands to fix:** `cmd_transfer_tokens`, `cmd_send_payment`, `cmd_faucet_request`, `cmd_create_escrow`, `cmd_release_escrow`

### Phase 3: Job Marketplace
**Goal:** Enable real freelance job postings and bidding
- Implement bidding system (expose `submit_bid`)
- Add worker selection and assignment
- Wire milestone tracking
- Integrate escrow for job payments
- Add job completion verification
- **Commands to fix:** `cmd_get_jobs`, `cmd_create_job`, add `cmd_submit_bid`, `cmd_select_worker`, `cmd_complete_milestone`

### Phase 4: Game Sessions
**Goal:** Enable real multiplayer game sessions
- Implement WebRTC data channels for real-time game state
- Add game state synchronization protocol
- Create at least one reference game
- Wire tournament brackets to real game outcomes
- **Commands to fix:** `cmd_create_game_session`, `cmd_join_game_session`, `cmd_submit_score`

### Phase 5: Communication (Chat, Calls)
**Goal:** Enable real encrypted messaging and voice/video calls
- Implement real message routing via P2P network
- Add message persistence in SQLite
- Wire WebRTC for real voice/video calls
- Implement call signaling via WebSocket
- Add community creation and management
- Add status update feed
- **Commands to fix:** `cmd_get_conversations`, `cmd_send_message`, `cmd_initiate_call`, `cmd_answer_call`, `cmd_get_communities`, `cmd_get_status_updates`

### Phase 6: Rankings & Notifications
**Goal:** Enable computed rankings and real notifications
- Implement ranking computation from reputation scores
- Add notification generation from real events
- Wire device tracking
- Add security event logging
- **Commands to fix:** `cmd_get_rankings`, `cmd_get_app_notifications`, `cmd_get_devices`, `cmd_get_security_logs`

---

## 8. File Structure

### Root
```
pinc-network/
├── PROJECT_DOCS.md          ← This file
├── package.json              ← Node.js dependencies
├── src-tauri/                ← Rust/Tauri backend
│   ├── Cargo.toml
│   ├── tauri.conf.json
│   └── src/
│       ├── main.rs           ← Entry point
│       ├── lib.rs            ← App setup, command registration, state management
│       ├── commands.rs       ← All Tauri commands (~2500 lines)
│       ├── startup.rs        ← Startup health checks
│       ├── errors.rs         ← Error types
│       └── core/             ← Backend modules
│           ├── mod.rs
│           ├── admin/        ← Admin engine
│           ├── ai/           ← AI engines (Whisper, LLaMA, ONNX, TTS)
│           ├── commands/     ← Additional commands (mod.rs)
│           ├── config/       ← API key management
│           ├── crypto/       ← Cryptographic utilities
│           ├── database/     ← SQLite connection, queries, migrations
│           ├── distributed/  ← Distributed storage
│           ├── games/        ← Game engine
│           ├── identity/     ← Identity generation/recovery
│           ├── infrastructure/ ← Nexus (bandwidth), Rift (server rental)
│           ├── marketplace/  ← Job marketplace engine
│           ├── messaging/    ← Message router and types
│           ├── net_share/    ← Network sharing engine
│           ├── network/      ← Peer registry, bandwidth, discovery, relay, transport
│           ├── p2p/          ← P2P network, WebRTC signaling
│           ├── payment/      ← Payment/escrow engine
│           ├── permissions/  ← Permission system
│           ├── reputation/   ← Reputation scoring
│           ├── routing/      ← AI routing
│           ├── security/     ← Kingsman governance engine
│           ├── settings/     ← Settings and localization
│           ├── social/       ← Social feed engine
│           ├── telemetry/    ← Metrics collector
│           ├── validation/   ← Input validation
│           ├── vault/        ← Encrypted vault file management
│           └── wager/        ← Wager/tournament engine
└── src/                      ← React frontend
    ├── App.tsx               ← Root component (splash → login → dashboard)
    ├── main.tsx              ← React entry point
    ├── declarations.d.ts    ← Type declarations
    ├── i18n/                 ← Internationalization
    ├── styles/               ← Global CSS
    ├── types/
    │   ├── index.ts          ← All TypeScript interfaces (~346 lines)
    │   └── settings.ts       ← Settings types and defaults (~149 lines)
    ├── store/
    │   └── appStore.ts       ← Zustand state management (~244 lines)
    └── components/
        ├── sidebar/          ← Sidebar navigation
        ├── splash/           ← Splash screen
        ├── login/            ← Login screen
        ├── dashboard/        ← Dashboard page + NodeHome
        ├── treific/          ← Communication hub
        ├── sarai/            ← Wallet system
        ├── starteran/        ← Bandwidth marketplace
        ├── rentbit/          ← Server rental
        ├── wager/            ← Gaming & competition
        ├── jobs/             ← Freelance marketplace
        ├── rankings/         ← Leaderboards
        ├── security/         ← Identity & protection
        ├── settings/         ← Configuration
        ├── admin/            ← Admin panel
        ├── ai/               ← AI features
        ├── distributed/      ← Distributed storage UI
        ├── forge/            ← Code forge
        ├── language/         ← Language selection
        ├── marketplace/      ← Marketplace UI
        ├── messages/         ← Message components
        ├── messaging/        ← Messaging UI
        ├── netshare/         ← Network sharing
        ├── netstore/         ← Bandwidth store
        ├── network/          ← Network monitoring
        ├── networld/         ← Network world view
        ├── notifications/    ← Notification components
        ├── payment/          ← Payment UI
        ├── profile/          ← User profile
        ├── reputation/       ← Reputation display
        ├── resources/        ← Resource allocation
        ├── roles/            ← Role management
        ├── social/           ← Social feed
        ├── vault/            ← Vault file management
        └── wallet/           ← Wallet UI
```

---

*This document is the authoritative reference for the PINC Network project. For questions or contributions, refer to the codebase directly.*
