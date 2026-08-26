# PINC (Private Intelligent Network Core) — Complete Project Map v3.0.0
## Document Date: 2026-07-29

---

# PART 1: WHAT IS PINC

PINC is a **decentralized P2P ecosystem** built with Tauri v2 (Rust backend) + React 18 (TypeScript frontend). It provides:

- Self-sovereign identity via BIP39 seed phrases + Ed25519 keypairs
- End-to-end encrypted vault storage (XChaCha20-Poly1305)
- P2P mesh networking (QUIC transport, mDNS discovery, relay)
- Encrypted messaging + WebRTC voice/video calling
- Wallet system with balance tracking, escrow, P2P agents
- Gaming platform (100+ GamePix web games via RSS, wagers, tournaments, arena duels)
- Job marketplace (freelance listings, bidding)
- Bandwidth sharing marketplace (Starteran)
- Server rental marketplace (Rentbit/Rift)
- AI inference (Whisper STT, Llama LLM, ONNX vision, TTS)
- Kingsman governance engine (admin/security module)
- NetShare (QR-based P2P connection pairing)
- Internationalization (12 languages in store, 52 declared)
- Android APK + Linux/Windows/macOS desktop builds

---

# PART 2: COMPLETE DIRECTORY TREE

```
/home/rachael/pinc-network/
│
├── index.html                    # HTML entry: dark bg, global window.onerror handler
├── package.json                  # npm config: React 18, Tauri v2, Zustand 4, Framer Motion 11
├── package-lock.json             # npm lock
├── tsconfig.json                 # TS strict, ES2021, bundler resolution, @/ -> src/
├── tsconfig.node.json            # Vite/Node TS config
├── vite.config.ts                # Vite 6: React + Tailwind v4 plugins, port 1420, strip-crossorigin CSP
├── esbuild.config.js             # Legacy esbuild build config (alternative to Vite)
├── .gitignore                    # Ignores node_modules, dist, target, gen, .env, keystores, db files, vault/
│
├── README.md                     # 898-line main README (features, architecture, setup, API, security, roadmap)
├── CONFIGURATION.md              # API keys, data directory structure, backup procedures, model mgmt
├── PROJECT_DOCS.md               # 854-line authoritative project docs (navigation map, command registry, types, store, missing features, roadmap)
├── RESEARCH.md                   # Web game APIs research (Phaser, PixiJS, Three.js, etc.)
├── COMMUNICATION_RESEARCH.md     # Chat/WebRTC architecture research (Signal Protocol, STUN/TURN)
├── WALLET_RESEARCH.md            # Wallet & payment UI research (MetaMask patterns, P2P agents)
├── UX_RESEARCH.md                # Button states, form design, real-time data patterns (1227 lines)
├── GAMES_INTEGRATION.md          # GamePix RSS feed integration documentation
├── PINC_PLATFORM_FULL_AUDIT_REPORT.md  # 1107-line full platform audit (all files, APIs, caches, artifacts)
├── WORK_STATUS_2026-07-29.md     # THIS FILE — complete project map + current work status
│
├── run-pinc.sh                   # Quick launch: cd src-tauri && ./target/release/pinc
├── debug.keystore                # Android debug signing keystore
├── release.keystore              # Release signing keystore for CI
├── pinc-android.apk.idsig        # Android APK signature
├── pinc-admin-linux-x86_64       # Pre-built admin Linux binary
├── pinc-admin-windows.exe        # Pre-built admin Windows binary
│
├── dist/                         # Frontend Vite production build output
│   ├── index.html
│   └── assets/
│       ├── index-*.css
│       └── index-*.js
│
├── pinc-builds/                  # Build output directory
│
├── public/assets/
│   ├── fonts/                    # Inter, JetBrains Mono, Space Grotesk (6 files)
│   ├── images/                   # Logos, avatars, backgrounds (8 files)
│   └── sounds/                   # click, error, notification, receive, send, success (7 files)
│
├── scripts/
│   ├── preflight.sh              # Preflight: fmt, clippy, tests, audit, tsc
│   ├── build-android.sh          # Android build helper (checks SDK/NDK, targets, sign)
│   ├── data-management.sh        # Backup, restore, cache cleanup, model mgmt, stats
│   ├── complete_i18n.py          # i18n completion script
│   ├── expand_i18n.py            # i18n expansion script
│   └── fix_i18n.py               # i18n dedup/fix script
│
├── tests/
│   ├── api-test-suite.js         # API test suite (64 KB)
│   ├── e2e/
│   │   ├── package.json          # Playwright test deps
│   │   ├── playwright.config.ts  # Playwright config
│   │   └── utils/helpers.ts      # Test utilities
│   └── integration/              # (empty)
│
├── .devcontainer/
│   ├── devcontainer.json         # Codespaces config: Rust, Node 20, Java 17, Android SDK
│   └── setup.sh                  # Installs system deps, Tauri CLI, Android NDK 27
│
├── .github/workflows/
│   ├── desktop-build.yml         # Matrix: ubuntu/windows/macos, cargo tauri build
│   ├── android-build.yml         # Builds main + admin APKs, signs with release keystore
│   ├── rust-check.yml            # cargo fmt + cargo check
│   ├── typescript-check.yml      # tsc --noEmit + vite build
│   └── admin-windows-build.yml   # Manual dispatch: admin Windows EXE
│
├── .agents/                      # (empty)
├── .codex/                       # Hidden tooling config
├── .trae/rules/                  # Trae AI coding assistant rules
│
├── src/                          # ═══ REACT FRONTEND ═══
│   ├── main.tsx                  # React entry: HashRouter + AppErrorBoundary + App
│   ├── App.tsx                   # Root: screen routing (splash -> login -> dashboard)
│   ├── declarations.d.ts         # lucide-react + __TAURI__ type declarations
│   │
│   ├── store/
│   │   └── appStore.ts           # Zustand store (370 lines): identity, settings, wallet, network, all page data
│   │
│   ├── types/
│   │   ├── index.ts              # All TS interfaces (494 lines): Identity, PeerInfo, WalletBalance, etc.
│   │   └── settings.ts           # Settings types (149 lines): 8 settings sections + defaults
│   │
│   ├── i18n/
│   │   ├── index.ts              # i18n Zustand store (645 lines): 12 languages, key-based lookup
│   │   └── locales.json          # Extended locale JSON (20+ locales)
│   │
│   ├── styles/
│   │   └── globals.css           # Tailwind v4 import + CSS custom properties (dark theme, neon)
│   │
│   └── components/
│       ├── system/
│       │   └── AppErrorBoundary.tsx   # React error boundary (84 lines)
│       ├── splash/
│       │   └── SplashScreen.tsx       # Animated startup (93 lines)
│       ├── login/
│       │   └── LoginScreen.tsx        # Signup/login/recover (491 lines)
│       ├── dashboard/
│       │   ├── DashboardPage.tsx      # Main dashboard + sidebar + tab routing
│       │   └── NodeHome.tsx           # Identity card, earnings, activity, rankings
│       ├── sidebar/
│       │   └── Sidebar.tsx            # Navigation sidebar (85 lines)
│       ├── language/
│       │   └── LanguageSelector.tsx   # Language dropdown
│       ├── roles/
│       │   └── RoleSelector.tsx       # Role selector
│       ├── treific/                   # Communication hub (messaging, calls, communities)
│       ├── sarai/                     # Wallet system
│       ├── starteran/                 # Bandwidth marketplace
│       ├── rentbit/                   # Server rental
│       ├── wager/                     # Gaming & competition
│       ├── jobs/                      # Freelance marketplace
│       ├── rankings/                  # Leaderboards
│       ├── security/                  # Identity & protection
│       ├── settings/                  # Configuration (8 sections)
│       ├── admin/                     # Kingsman admin
│       ├── ai/                        # AI console
│       ├── messages/                  # WebRTC call components + useWebRTC hook
│       ├── wallet/                    # Wallet UI + SeedPhraseBackup
│       ├── vault/                     # Encrypted file storage
│       ├── marketplace/               # Marketplace UI
│       ├── networking/                # Network monitoring (note: named 'network' in dir)
│       ├── networld/                  # Network world view
│       ├── netshare/                  # QR pairing
│       ├── netstore/                  # Bandwidth store
│       ├── distributed/               # Distributed storage UI
│       ├── notifications/             # Notification center
│       ├── social/                    # Social feed
│       ├── reputation/                # Trust scores
│       ├── contacts/                  # Contacts management
│       ├── profile/                   # User profile
│       ├── resources/                 # Resource allocation
│       ├── payment/                   # Payment UI
│       ├── forge/                     # Game forge
│       ├── openmaestro/               # Gaming/tournaments
│       ├── zeroflipper/               # Store/marketplace
│       ├── plex/                      # Plex page
│       ├── about/                     # About page
│       ├── license/                   # License page
│       └── messaging/                 # Messaging UI
│
├── src-tauri/                    # ═══ RUST BACKEND ═══
│   ├── Cargo.toml                # Rust deps (121 lines): Tauri 2, tokio, serde, crypto, QUIC, AI
│   ├── Cargo.lock                # Cargo lock
│   ├── tauri.conf.json           # Tauri config: 1400x900 window, CSP, all bundle targets
│   ├── build.rs                  # Tauri build script (3 lines)
│   ├── build_log.txt             # Build log
│   ├── cargo_errors.txt          # Cargo error log
│   │
│   ├── capabilities/
│   │   └── default.json          # Tauri v2 permissions: core:default
│   │
│   ├── gen/android/              # Auto-generated Android build files
│   │   ├── .gradle/              # Gradle cache
│   │   ├── gradle/wrapper/       # Gradle wrapper
│   │   ├── app/
│   │   │   ├── build.gradle.kts
│   │   │   ├── proguard-rules.pro / proguard-tauri.pro
│   │   │   ├── tauri.build.gradle.kts
│   │   │   ├── tauri.properties  # version=3.0.0
│   │   │   └── build/            # Kotlin build cache
│   │   ├── tauri.settings.gradle
│   │   ├── build/                # Generated build outputs
│   │   ├── build.gradle.kts      # Top-level Gradle config
│   │   ├── settings.gradle
│   │   ├── gradle.properties     # ABI constraints: arm64-v8a,armeabi-v7a (FIXED)
│   │   ├── .editorconfig
│   │   └── local.properties
│   │
│   ├── icons/                    # All platform icons
│   │   ├── icon.png, icon.ico, icon.icns
│   │   ├── android/ (mipmap variants)
│   │   └── ios/ (AppIcon variants)
│   │
│   ├── src/
│   │   ├── main.rs               # Entry: pinc_lib::run() (5 lines)
│   │   ├── lib.rs                # Core: Tauri setup, plugins, state, command registration (358 lines)
│   │   ├── commands.rs           # ALL IPC commands (~200, 3000+ lines)
│   │   ├── errors.rs             # AppError enum + From conversions (197 lines)
│   │   ├── startup.rs            # Startup health checks: crypto, DB, vault (142 lines)
│   │   ├── log_macros.rs         # Macros: payment_trace!, agent_audit!, alert!, op_trail! (174 lines)
│   │   │
│   │   ├── config/
│   │   │   ├── mod.rs            # Re-exports
│   │   │   └── secrets.rs        # 50+ env var validators + placeholder gen (233 lines)
│   │   │
│   │   ├── android/
│   │   │   ├── mod.rs            # Android platform module
│   │   │   └── hotspot.rs        # Android hotspot management
│   │   │
│   │   ├── core/                 # ═══ CORE MODULES ═══
│   │   │   ├── mod.rs            # Module declarations (45 lines)
│   │   │   ├── networking.rs     # WebSocket server (529 lines, accept_async)
│   │   │   │
│   │   │   ├── crypto/           # ChaCha20Poly1305, Ed25519, X25519, HKDF, Argon2, Blake3, SHA2/3
│   │   │   ├── identity/         # BIP39 seed phrase, Ed25519 keypair generation/recovery
│   │   │   ├── vault/            # Encrypted file storage (chunked, zstd compressed)
│   │   │   ├── database/         # SQLite connection, WAL mode, migrations, queries, validator
│   │   │   ├── network/          # Peer registry, discovery, relay, bandwidth monitor
│   │   │   ├── p2p/              # P2P networking (QUIC via quinn) + WebRTC signaling
│   │   │   ├── messaging/        # Message router
│   │   │   ├── payment/          # Payment engine, escrow
│   │   │   ├── marketplace/      # Job marketplace
│   │   │   ├── wager/            # Wager engine, tournaments
│   │   │   ├── games/            # Game engine (GamePix RSS integration)
│   │   │   ├── ai/               # Whisper STT, Llama LLM, ONNX vision, TTS
│   │   │   ├── security/         # Kingsman governance engine (SHA3-256 activation)
│   │   │   ├── infrastructure/   # Nexus (speed test), Rift (server rental)
│   │   │   ├── settings/         # Settings persistence + localization engine
│   │   │   ├── net_share/        # QR code pairing, bandwidth sharing
│   │   │   ├── distributed/      # Distributed storage (Phase 4)
│   │   │   ├── social/           # Social feed engine (Phase 9)
│   │   │   ├── reputation/       # Trust scoring (Phase 8)
│   │   │   ├── routing/          # AI routing (Phase 12)
│   │   │   ├── telemetry/        # Metrics collector
│   │   │   ├── admin/            # Admin engine
│   │   │   ├── commands/         # Secondary commands (~15 stub + real)
│   │   │   ├── mesh/             # Mesh networking
│   │   │   ├── node/             # Node lifecycle
│   │   │   ├── permissions/      # RBAC system
│   │   │   ├── validation/       # Input validation
│   │   │   ├── config/           # Config management
│   │   │   ├── data/             # Data layer
│   │   │   ├── ecosystem/        # Plugins
│   │   │   └── regions/          # Country/region config
│   │   │
│   │   ├── engines/
│   │   │   ├── mod.rs
│   │   │   ├── audit_log_engine.rs    # Structured audit logging
│   │   │   ├── apk_analysis_engine.rs # APK analysis
│   │   │   ├── compression/           # zstd, flate2
│   │   │   ├── encryption/            # Encryption engine
│   │   │   └── network/               # Network engine
│   │   │
│   │   ├── modules/
│   │   │   ├── mod.rs                 # Module loader
│   │   │   └── p2p_agents/            # P2P agent system (buy/sell, KYC, escrow)
│   │   │                              # Plus stub modules for: about, admin, ai_plex, contacts,
│   │   │                              # identity, license, marketplace, notifications, openmaestro,
│   │   │                              # plex, rentbit, reputation, sarai, security, starteran,
│   │   │                              # system, taskpush, treific, wallet, zeroflipper
│   │   │
│   │   └── tests/
│   │       ├── integration.rs         # Integration tests
│   │       └── startup_failures.rs    # Startup failure tests
│   │
│   └── target/                        # Rust build artifacts (excluded from git)
│
├── pinc-admin/                   # ═══ ADMIN COMPANION APP ═══
│   ├── index.html                # Admin HTML entry
│   ├── package.json              # React 19, Tauri v2, Zustand 5, Framer Motion 12
│   ├── tsconfig.json             # Admin TS config (21 lines)
│   ├── tsconfig.node.json
│   ├── vite.config.ts            # Port 14200, no Tailwind
│   ├── package-lock.json
│   │
│   ├── src/                      # Admin React frontend
│   │   ├── main.tsx              # Admin entry (no error boundary)
│   │   ├── App.tsx               # Root: theme/layout switcher + admin shell (88 lines)
│   │   ├── store/adminStore.ts   # Zustand admin store
│   │   ├── contexts/ThemeContext.tsx  # Theme (4 themes) + Layout (3 layouts) context
│   │   ├── components/           # Admin UI: LoginScreen, AdminDashboard, etc.
│   │   └── styles/               # admin-theme.css, layouts.css, theme.css
│   │
│   └── src-tauri/                # Admin Rust backend
│       ├── Cargo.toml            # Minimal deps (34 lines): no AI, no crypto, just Tauri + SQLite
│       ├── tauri.conf.json       # "PINC Admin" app, same window dimensions
│       ├── build.rs
│       ├── capabilities/
│       ├── icons/
│       ├── gen/android/          # Admin Android config
│       ├── src/
│       │   ├── main.rs           # Entry
│       │   ├── lib.rs            # Tauri setup + 22 admin commands (50 lines)
│       │   └── commands.rs       # Admin backend commands
│       └── target/
│
└── .env                          # (gitignored) Environment variables
```

---

# PART 3: ARCHITECTURE OVERVIEW

## 3.1 Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | React 18, TypeScript 5, Tailwind CSS 4 | UI rendering |
| State | Zustand 4 (persist middleware -> localStorage) | State management |
| Routing | React Router 7 (HashRouter), state-based page routing | Screen navigation |
| Animation | Framer Motion 11 | UI animations |
| Icons | Lucide React | UI icon library |
| Backend | Rust 2021, Tokio 1 (full) | Async runtime |
| Bridge | Tauri v2 (Tauri CLI ^2) | Cross-platform native bridge |
| Database | rusqlite 0.31 (bundled SQLite, WAL mode) | Embedded database |
| Crypto | XChaCha20-Poly1305, Ed25519-dalek 2, X25519-dalek 2 | Encryption, signatures |
| Hashing | Blake3, SHA2, SHA3, Argon2, HKDF | Password hashing, KDF |
| Identity | BIP39 (24-word mnemonics), Ed25519 keypairs, UUID v4 | Self-sovereign identity |
| Networking | QUIC (quinn 0.11 + rustls 0.23 ring), TCP WebSocket (tokio-tungstenite) | P2P transport |
| AI (desktop) | whisper-rs 0.5, llama-rs 0.16, ort 2.0 (ONNX), ndarray | AI inference |
| Build | Vite 6 (frontend), Cargo (backend) | Build systems |
| Mobile | Android SDK 34, NDK 27, Kotlin | Android APK |

## 3.2 Application Flow

```
index.html
  └── src/main.tsx
      ├── React.StrictMode
      ├── AppErrorBoundary (catches render crashes)
      ├── HashRouter (for deep-link compatibility)
      └── App.tsx
          └── screen === 'splash'  -> SplashScreen (animated logo, 3s timeout)
              screen === 'login'   -> LoginScreen (signup | login | recover)
              screen === 'dashboard' -> DashboardPage
                  ├── Sidebar (10 tabs: HOME | TREIFIC | SARAI | STARTERAN | RENTBIT | WAGERS | JOBS | RANKINGS | SECURITY | SETTINGS)
                  └── Tab content pages (NodeHome, TreificPage, SaraiPage, etc.)
```

## 3.3 Backend Initialization (lib.rs run())

1. Ignore SIGHUP (survive shell exit)
2. Install rustls ring crypto provider
3. Initialize env_logger (Info level, millisecond timestamps)
4. Validate env vars (secrets::validate_all)
5. Install Tauri plugins: notification, fs, shell, dialog, clipboard-manager, http, deep-link
6. Open SQLite database, create data dir, run migrations
7. Run startup health checks (crypto self-test, DB schema, vault encrypt/decrypt)
8. Create AppState with all engines:
   - Database, Nexus, Rift, Kingsman, GhostOrigin, Localization
   - PeerRegistry, BandwidthMonitor, Discovery, RelayManager
   - MessageRouter, MetricsCollector, NetShareEngine, P2PNetwork
   - WebSocketServer (port 14029, WebRTC signaling)
9. Register ~200 Tauri commands
10. Spawn WebSocket server async
11. Run Tauri app

## 3.4 AppState (backend managed state)

```rust
struct AppState {
    db: Arc<Mutex<Database>>,
    nexus: Arc<Mutex<NexusEngine>>,
    rift: Arc<Mutex<RiftEngine>>,
    kingsman: Arc<Mutex<KingsmanEngine>>,
    ghost_origin: Arc<Mutex<GhostOriginEngine>>,
    localization: Arc<AsyncMutex<LocalizationEngine>>,
    peer_registry: Arc<Mutex<PeerRegistry>>,
    bandwidth: Arc<Mutex<BandwidthMonitor>>,
    discovery: Arc<Mutex<Discovery>>,
    relay: Arc<Mutex<RelayManager>>,
    message_router: Arc<Mutex<MessageRouter>>,
    metrics: Arc<Mutex<MetricsCollector>>,
    net_share: Arc<Mutex<NetShareEngine>>,
    p2p_network: Arc<P2PNetwork>,
    web_socket_server: Option<Arc<AsyncMutex<WebSocketServer>>>,
    vault_dir: PathBuf,
    audit_log_engine: Arc<Mutex<SqliteAuditLogEngine>>,
}
```

---

# PART 4: COMPLETE COMMAND REGISTRY

## 4.1 Commands from commands.rs (Primary — ~170 commands)

### Startup & Governance
| Command | Params | Returns | Description |
|---------|--------|---------|-------------|
| `cmd_run_startup` | — | `StartupReport` | Run health checks |
| `cmd_activate_kingsman` | code: String | bool | Activate Kingsman |
| `cmd_get_admin_status` | — | KingsmanStatus | Admin status |
| `is_admin_password` | password: String | bool | Check admin password |
| `validate_admin_access` | password: String | Value | Validate + permission level |

### Identity
| Command | Params | Returns |
|---------|--------|---------|
| `cmd_has_identity` | — | bool |
| `cmd_get_identity` | — | Option<IdentityResponse> |
| `cmd_create_identity` | master_key_hex: String | IdentityResponse |
| `cmd_recover_identity` | phrase, master_key_hex | IdentityResponse |
| `cmd_verify_login` | — | Value |

### Node & Network
| Command | Params | Returns |
|---------|--------|---------|
| `cmd_get_node_status` | — | Value (peers, vault, bandwidth, metrics) |
| `cmd_get_node_info` | — | Value (node ID, public key, fingerprint) |
| `cmd_get_network_status` | — | NetworkStatus |
| `cmd_get_peers` | — | Vec<PeerInfo> |
| `cmd_get_nodes` | — | Vec<PeerInfo> |
| `cmd_connect_to_peer` | peer_addr: String | String |
| `cmd_scan_network` | — | Vec<PeerInfo> |

### Vault
| Command | Params | Returns |
|---------|--------|---------|
| `cmd_list_vault` | — | Vec<VaultFileRecord> |
| `cmd_list_files` | — | Vec<VaultFileRecord> |
| `cmd_save_file` | req: VaultFileRecord | VaultFileRecord |
| `cmd_upload_file` | name, data, encrypt | VaultFileRecord |
| `cmd_download_file` | file_id: String | Vec<u8> |
| `cmd_delete_file` | file_id: String | () |

### Wallet & Payments
| Command | Params | Returns |
|---------|--------|---------|
| `cmd_get_wallet_balance` | — | Value (balance, escrow, pending) |
| `cmd_get_transactions` | — | Vec<Value> |
| `cmd_get_wallet_history` | — | Vec<Transaction> |
| `cmd_transfer_tokens` | to_node, amount | Value |
| `cmd_send_payment` | to_node, amount, memo | Value |
| `cmd_faucet_request` | — | Value (1000 PINC) |
| `cmd_create_escrow` | payee_node, amount, reason | Value |
| `cmd_release_escrow` | escrow_id | () |
| `cmd_refund_escrow` | escrow_id | Value |

### Messaging & Calls
| Command | Params | Returns |
|---------|--------|---------|
| `cmd_get_messages` | peer_id | Vec<Message> |
| `cmd_send_message` | peer_id, content | Message |
| `cmd_initiate_call` | peer_id, call_type | Value |
| `cmd_answer_call` | peer_id, offer_sdp | Value |
| `cmd_hang_up` | peer_id | Value |
| `cmd_get_call_status` | — | Value |

### Marketplace
| Command | Params | Returns |
|---------|--------|---------|
| `cmd_get_marketplace_listings` | — | Vec<Job> |
| `cmd_get_marketplace_stats` | — | Value |
| `cmd_create_job` | title, description, budget | Job |

### Gaming & Wagers
| Command | Params | Returns |
|---------|--------|---------|
| `cmd_get_wagers` | — | Vec<Wager> |
| `cmd_create_wager` | amount, opponent | Wager |
| `cmd_get_games` | — | Vec<Value> |
| `cmd_get_tournaments` | — | Vec<Value> |
| `cmd_create_tournament` | name, game_id, max_players, entry_fee | Value |
| `cmd_join_tournament` | tournament_id | () |
| `cmd_create_game_session` | game_id, max_players | Value |
| `cmd_join_game_session` | session_id | () |
| `cmd_submit_score` | session_id, score | () |
| `cmd_arena_create_duel` | opponent_id, game_id, stake_amount | Value |
| `cmd_save_game_progress` | game_id, high_score, play_time_secs | () |
| `cmd_get_game_progress` | game_id | Value |
| `cmd_get_user_game_stats` | — | Value |
| `cmd_get_game_sessions` | — | Vec<Value> |
| `cmd_resolve_game_session` | — | — |
| `cmd_save_game_result` | — | — |
| `cmd_save_game_result_with_progress` | — | — |
| `cmd_get_game_progress_all` | — | — |

### Server Rental (Rift)
| Command | Params | Returns |
|---------|--------|---------|
| `cmd_get_rift_listings` | — | Vec<ServerListing> |
| `cmd_create_server_listing` | tier, price, cpu, ram, storage, speed | ServerListing |
| `cmd_rent_server` | server_id, period, duration_hours | RentalAgreement |
| `cmd_return_server` | rental_id | () |
| `cmd_get_active_rentals` | — | Vec<RentalAgreement> |

### Ghost Origin (Privacy)
| Command | Params | Returns |
|---------|--------|---------|
| `cmd_get_ghost_origin_status` | — | GhostOriginStatus |
| `cmd_toggle_ghost_origin` | — | GhostOriginStatus |
| `cmd_set_ghost_origin_region` | region | GhostOriginStatus |
| `cmd_set_ghost_origin_hops` | hops: u8 | GhostOriginStatus |

### NetShare / QR Pairing
| Command | Params | Returns |
|---------|--------|---------|
| `cmd_generate_pairing_code` | — | Value (PINC-XXXXXX) |
| `cmd_validate_pairing_code` | code | bool |
| `cmd_generate_qr_png` | data? | String (base64 PNG) |
| `cmd_connect_with_code` | code | Value |
| `cmd_get_shared_connections` | — | Vec<Value> |
| `cmd_disconnect_shared` | peer_id | () |
| `cmd_get_net_share_status` | — | Value |
| `cmd_toggle_net_share` | enabled: bool | () |

### NetStore (Bandwidth)
| Command | Params | Returns |
|---------|--------|---------|
| `cmd_create_net_store_listing` | bandwidth_mbps, price_per_gb, location | Value |
| `cmd_list_net_store_listings` | — | Vec<Value> |
| `cmd_purchase_bandwidth` | listing_id, hours | Value |
| `cmd_get_my_listings` | — | Vec<Value> |
| `cmd_get_my_purchases` | — | Vec<Value> |

### WebSocket
| Command | Params | Returns |
|---------|--------|---------|
| `cmd_get_websocket_status` | — | Value |
| `cmd_websocket_broadcast` | message | () |
| `cmd_websocket_shutdown` | — | () |

### AI Inference
| Command | Params | Returns |
|---------|--------|---------|
| `cmd_get_ai_agents` | — | Vec<AiAgent> |
| `cmd_run_ai_inference` | prompt | Value |
| `cmd_whisper_transcribe` | audio_data | String |
| `cmd_llama_load_model` | model_path, params | String |
| `cmd_llama_infer` | model_id, prompt, params | String |
| `cmd_llama_unload_model` | model_id | () |
| `cmd_onnx_load_model` | model_path | String |
| `cmd_onnx_segment_image` | model_id, image_data | ImageSegmentation |
| `cmd_onnx_unload_model` | model_id | () |
| `cmd_tts_create_voice_profile` | name, audio_samples | String |
| `cmd_tts_synthesize` | profile_id, text, params | Vec<f32> |
| `cmd_get_model_cache_stats` | — | Value |
| `cmd_clear_model_cache` | — | () |

### Admin (Kingsman) — 20+ commands
| Command | Description |
|---------|-------------|
| `cmd_admin_get_overview` | Admin dashboard overview |
| `cmd_admin_list_users` | List admin users |
| `cmd_admin_create_user` | Create admin user |
| `cmd_admin_update_user` | Update admin user |
| `cmd_admin_delete_user` | Delete admin user |
| `cmd_admin_toggle_user` | Enable/disable user |
| `cmd_admin_list_logs` | List admin logs |
| `cmd_admin_list_config` | List system config |
| `cmd_admin_update_config` | Update system config |
| `cmd_admin_get_security` | Security info |
| `cmd_admin_get_network_monitor` | Network monitoring |
| `cmd_admin_ban_peer` | Ban peer |
| `cmd_admin_unban_peer` | Unban peer |
| `cmd_admin_reset_password` | Reset user password |
| `cmd_admin_get_kingsman_config` | Kingsman config |
| `cmd_admin_set_kingsman_master_hash` | Set master hash |
| `cmd_admin_change_kingsman_master_hash` | Change master hash |
| `cmd_admin_login` | Admin login |
| `cmd_admin_get_stats` | Admin stats |

### Other
| Command | Purpose |
|---------|---------|
| `cmd_run_speed_test` | Cloudflare speed test |
| `cmd_toggle_net_sharing` | Toggle bandwidth sharing |
| `cmd_get_distributed_status` | Distributed vault status |
| `cmd_get_storage_contracts` | Storage contracts |
| `cmd_repair_shards` | Repair storage shards |
| `cmd_get_metrics` | System metrics |
| `cmd_get_api_keys` | API key names |
| `cmd_get_api_key_status` | API key config status |
| `cmd_logs_query` | Query audit logs |
| `cmd_logs_export_csv` | Export logs as CSV |
| `cmd_payment_trace` | Payment trace |
| `cmd_get_settings` | All settings |
| `cmd_update_settings` | Update settings |
| `cmd_reset_settings_section` | Reset settings section |
| `cmd_reset_all_settings` | Reset all settings |
| `cmd_apply_settings` | Apply settings (stub) |
| `cmd_download_language` | Download language pack |
| `cmd_set_language` | Set active language |
| `cmd_get_social_feed` | Social feed |
| `cmd_create_post` | Create social post |
| `cmd_get_reputation` | Reputation scores |
| `cmd_get_leaderboard` | Leaderboard |
| `cmd_get_netshare_status` | — |

## 4.2 Commands from core/commands/mod.rs (Secondary — ~35 commands)

### Real commands:
| Command | Description |
|---------|-------------|
| `cmd_run_device_scan` | **Real:** reads /proc for CPU, RAM, storage, uptime, security |
| `cmd_list_contacts` | List contacts |
| `cmd_add_contact` | Add contact |
| `cmd_remove_contact` | Remove contact |
| `cmd_update_contact_service` | Update contact service |
| `cmd_search_users` | Search users |
| `cmd_get_forum_posts` | Forum posts |
| `cmd_create_forum_post` | Create forum post |
| `cmd_get_forum_comments` | Forum comments |
| `cmd_create_forum_comment` | Create forum comment |
| `cmd_get_forum_profile` | Forum profile |
| `cmd_create_or_update_forum_profile` | Forum profile |
| `cmd_list_communities` | List communities |
| `cmd_create_community` | Create community |
| `cmd_join_community` | Join community |
| `cmd_leave_community` | Leave community |
| `cmd_list_challenges` | List challenges |
| `cmd_list_problems` | List problems |
| `cmd_join_challenge` | Join challenge |
| `cmd_list_duels` | List duels |
| `cmd_list_rankings` | List rankings |
| `cmd_list_products` | List products |
| `cmd_buy_product` | Buy product |
| `cmd_generate_starteran_share_code` | Generate share code |
| `cmd_pinc_id_from_node_id` | Lookup PINC ID |

### Stub commands (return empty []):
| Command | Expected functionality |
|---------|----------------------|
| `cmd_get_starteran_status` | Hardcoded zeros (not from DB) |
| `cmd_get_rentbit_status` | Hardcoded zeros (not from DB) |
| `cmd_get_conversations` | Real conversation list |
| `cmd_get_call_history` | Real call log |
| `cmd_get_communities` | Community listing |
| `cmd_get_status_updates` | Status update feed |
| `cmd_get_challenges` | Challenge listing |
| `cmd_get_rankings` | Real ranking data |
| `cmd_get_security_logs` | Security event logging |
| `cmd_get_devices` | Device tracking |
| `cmd_get_app_notifications` | Notification system |
| `cmd_get_jobs` | Job listings |

## 4.3 P2P Agent Commands (modules/p2p_agents/commands.rs)
`cmd_p2p_agent_list`, `cmd_p2p_agent_create`, `cmd_p2p_agent_update`, `cmd_p2p_agent_delete`,
`cmd_p2p_agent_bind_channel`, `cmd_p2p_agent_unbind_channel`, `cmd_p2p_agent_bind_commlink`,
`cmd_p2p_agent_unbind_commlink`, `cmd_p2p_agent_calc_quote`, `cmd_p2p_agent_initiate_deposit`,
`cmd_p2p_agent_confirm_payment`, `cmd_p2p_agent_release_escrow`

## 4.4 Admin App Commands (22 commands)
`cmd_admin_login`, `cmd_admin_platform_stats`, `cmd_admin_list_nodes`,
`cmd_admin_list_servers`, `cmd_admin_wallet_stats`, `cmd_admin_traffic_stats`,
`cmd_admin_game_stats`, `cmd_admin_security_events`, `cmd_admin_list_transactions`,
`cmd_admin_freeze_identity`, `cmd_admin_suspend_user`, `cmd_admin_send_notification`,
`cmd_admin_toggle_feature`, `cmd_admin_get_fees`, `cmd_admin_set_fees`,
`cmd_admin_get_wallet_types`, `cmd_admin_add_wallet_type`, `cmd_admin_remove_wallet_type`,
`cmd_admin_get_wallet_balances`, `cmd_admin_get_all_transactions`,
`cmd_admin_get_payment_sources`, `cmd_admin_add_payment_source`,
`cmd_admin_update_payment_source`

---

# PART 5: DEPENDENCIES

## 5.1 npm (Main App — 12 runtime + 7 dev)

**Runtime:** @tauri-apps/api ^2, @tauri-apps/plugin-clipboard-manager ^2.3.2, @tauri-apps/plugin-deep-link ^2.4.9, @tauri-apps/plugin-dialog ^2.7.1, @tauri-apps/plugin-fs ^2.5.1, @tauri-apps/plugin-http ^2.5.9, @tauri-apps/plugin-notification ^2.3.3, @tauri-apps/plugin-shell ^2.3.5, framer-motion ^11, html5-qrcode ^2.3.8, lucide-react ^0.383.0, qrcode.react ^4.2.0, react ^18, react-dom ^18, react-router ^7.17.0, react-router-dom ^6, zustand ^4

**Dev:** @tailwindcss/vite ^4, @tauri-apps/cli ^2, @types/react ^18, @types/react-dom ^18, @vitejs/plugin-react ^4, tailwindcss ^4, typescript ^5, vite ^6

## 5.2 Cargo (Main App — 40+ crates)

**Core:** tauri 2 (protocol-asset), tokio 1 (full), serde 1 (derive), serde_json 1, rusqlite 0.31 (bundled), thiserror 1, anyhow 1, log 0.4, env_logger 0.11

**Crypto:** chacha20poly1305 0.10, ed25519-dalek 2 (rand_core), x25519-dalek 2 (static_secrets), hkdf 0.12, rand 0.8, sha2 0.10, sha3 0.10, blake3 1, argon2 0.5, uuid 1 (v4), bip39 2, base64 0.22, hex 0.4, ethers-core 2.0, ethers-signers 2.0

**Networking:** quinn 0.11, rustls 0.23 (ring), rcgen 0.13, reqwest 0.12 (json, rustls-tls, multipart), tokio-tungstenite 0.26, futures-util 0.3, async-trait 0.1, dirs 5, libc 0.2, hostname 0.3, num_cpus 1

**Media:** qrcode 0.14 (image), image 0.25 (png), flate2 1, zstd 0.13, chrono 0.4 (serde), time 0.3.36

**Plugins:** tauri-plugin-notification 2, -fs 2, -shell 2, -dialog 2, -clipboard-manager 2, -http 2, -deep-link 2

**AI (desktop only):** whisper-rs 0.5, llama-rs 0.16.1, ort 2.0.0-rc.12 (ndarray), ndarray 0.16, redis 0.23

## 5.3 Cargo (Admin App — minimal)
tauri 2, serde 1, serde_json 1, rusqlite 0.31, log 0.4, env_logger 0.11, uuid 1, chrono 0.4, dirs 5, 6 tauri plugins

---

# PART 6: ZUSTAND STORE (src/store/appStore.ts)

## 6.1 State fields (45+)

| Field | Type | Default |
|-------|------|---------|
| screen | 'splash' \| 'login' \| 'dashboard' | 'splash' |
| activeTab | string | 'home' |
| identity | Identity \| null | null |
| hasIdentity | — | (from identity != null) |
| nodeStatus | NodeStatus | { online: false, peer_count: 0, ... } |
| startupReport | StartupReport \| null | null |
| startupDone | boolean | false |
| peers | PeerInfo[] | [] |
| vaultFiles | VaultFile[] | [] |
| networkStatus | NetworkStatus \| null | null |
| error | string \| null | null |
| role | UserRole | 'user' |
| settings | AllSettings | DEFAULT_SETTINGS |
| walletBalance | WalletBalance \| null | null |
| transactions | Transaction[] | [] |
| starteranStatus | StarteranStatus \| null | null |
| rentbitStatus | RentbitStatus \| null | null |
| conversations | Conversation[] | [] |
| notifications | AppNotification[] | [] |
| securityLogs | SecurityLog[] | [] |
| devices | Device[] | [] |
| jobs | Job[] | [] |
| tournaments | Tournament[] | [] |
| challenges | Challenge[] | [] |
| rankings | RankingEntry[] | [] |
| products | Product[] | [] |
| duels | DuelChallenge[] | [] |
| problems | ProblemPost[] | [] |
| wagers | any[] | [] |
| gameSessions | any[] | [] |
| gameStats | any \| null | null |
| netShareStatus | any \| null | null |
| reputation | any \| null | null |
| aiAgents | any[] | [] |
| leaderboard | any[] | [] |
| homeLoading | boolean | false |

## 6.2 Persistence config
```typescript
persist({
  name: 'pinc-settings',
  partialize: (state) => ({
    settings: state.settings,
    identity: state.identity,
    // screen is NOT persisted (FIXED)
  }),
  merge: deep merges persisted settings with defaults
})
```

## 6.3 Key actions
| Action | Invokes |
|--------|---------|
| initialize() | setTimeout(3s) -> screen='login' |
| refreshWallet() | cmd_get_wallet_balance, cmd_get_transactions |
| refreshHomeStats() | 15+ parallel invoke() calls |
| refreshOpenMaestro() | cmd_list_challenges, cmd_list_rankings, etc. |
| refreshZeroFlipper() | cmd_list_products, cmd_get_wagers, etc. |

---

# PART 7: DATA LAYER

## 7.1 SQLite Database
- **Engine:** rusqlite 0.31 (bundled SQLite)
- **Mode:** WAL (Write-Ahead Logging)
- **Location:** ~/.local/share/com.pinc.app/pinc.db
- **Tables:** 37
- **Migrations:** run on every startup
- **Key tables:** identity, peers, vault_files, transactions, messages, wagers, tournaments, games, jobs, settings, system_config, audit_logs, communities, forum_posts, contacts, products, p2p_agents, etc.

## 7.2 Data Directory Structure
```
~/.local/share/com.pinc.app/
├── pinc.db          # Main SQLite database (WAL mode)
├── pinc.db-wal      # Write-ahead log
├── pinc.db-shm      # Shared memory
├── vault/           # Encrypted user files (XChaCha20-Poly1305)
├── models/          # AI models (whisper, llama, onnx, tts)
├── cache/           # TTL-based cache
├── logs/            # App logs (auto-rotated 30 days)
├── config/          # Local config overrides
└── backups/         # DB backups
```

---

# PART 8: BUILD CONFIGURATION

## 8.1 Frontend Build (Vite 6)
- **Target:** ES2021, Chrome 100, Safari 13
- **Port:** 1420 (dev), 1421 (HMR WebSocket)
- **Base:** `./` (relative for Tauri)
- **Minify:** esbuild (production), none (TAURI_DEBUG)
- **Sourcemaps:** TAURI_DEBUG only
- **Alias:** `@/` -> `src/`
- **Plugins:** @vitejs/plugin-react, @tailwindcss/vite, custom strip-crossorigin

## 8.2 Rust Build
- **Edition:** 2021
- **Release profile:** panic=abort, opt-level=s, strip=true, codegen-units=16, lto=false
- **Android release:** same as desktop

## 8.3 Android Build
- **Targets (constrained):** aarch64-linux-android, armv7-linux-androideabi
- **ABIs:** arm64-v8a, armeabi-v7a
- **NDK:** 27.0.12077973
- **SDK:** Android 34 (build-tools 34.0.0)
- **Java:** Temurin 17
- **Version:** 3.0.0 (versionCode 3000000)
- **Signing:** debug.keystore (dev), release.keystore (CI)

## 8.4 CI/CD Pipelines
- **desktop-build.yml:** Matrix on ubuntu/windows/macos, `cargo tauri build`
- **android-build.yml:** Builds main + admin APKs, signs with release keystore
- **rust-check.yml:** `cargo fmt --check` + `cargo check`
- **typescript-check.yml:** `tsc --noEmit` + `vite build`
- **admin-windows-build.yml:** Manual dispatch, admin Windows EXE

---

# PART 9: ENVIRONMENT VARIABLES (50+ required)

| Category | Keys |
|----------|------|
| Core | PINC_MASTER_KEY_SEED, PINC_JWT_SECRET, PINC_DB_ENCRYPTION_KEY, PINC_SIGNING_ED25519_SEED |
| Crypto | PINC_VAPID_PUBLIC_KEY, PINC_VAPID_PRIVATE_KEY |
| Payments | PINC_BINANCE_API_KEY/SECRET, PINC_PAYPAL_CLIENT_ID/SECRET, PINC_SENDWAVE_API_TOKEN, PINC_MPESA_CONSUMER_KEY/SECRET, PINC_STRIPE_KEY, PINC_SKRILL_MERCHANT_EMAIL/API_PASSWORD, PINC_BANK_TRANSFER_SWIFT/IBAN, PINC_USDT_WALLET_ADDRESS |
| Messaging | PINC_WHATSAPP_GATEWAY_URL, PINC_TELEGRAM_BOT_TOKEN, PINC_SIGNAL_GATEWAY_URL, PINC_DISCORD_WEBHOOK_URL |
| Email | PINC_SMTP_RELAY_HOST/USER/PASS |
| Infrastructure | PINC_EXCHANGE_RATE_API_KEY, PINC_GEOIP_API_KEY, PINC_SMS_GATEWAY_API_KEY, PINC_KYC_PROVIDER_API_KEY, PINC_SANCTIONS_SCREENING_API_KEY |
| Updater | PINC_TAURI_UPDATER_SIGNING_KEY |
| P2P | PINC_P2P_ESCROW_MULTISIG |

Missing keys get auto-generated placeholders (warning logged).

---

# PART 10: ERROR HANDLING

## AppError enum (errors.rs)
Categories: Crypto, Identity, Database, Vault, Network, Mesh, Permissions, Telemetry, Settings, Startup, Distributed, Messaging, Marketplace, Payment, Reputation, Social, Wager, AI, General

Implements From for: std::io::Error, serde_json::Error, rusqlite::Error, String, CryptoError, DatabaseError, IdentityError, VaultError, NetworkError

---

# PART 11: SECURITY

## Cryptographic primitives
| Algorithm | Use |
|-----------|-----|
| XChaCha20-Poly1305 | Vault + message encryption |
| Ed25519 | Digital signatures, identity |
| X25519 | Key exchange |
| Argon2 | Password hashing |
| SHA3-256 | Admin code verification |
| Blake3 | Content hashing |
| BIP39 | 24-word seed phrases |

## RBAC roles
| Role | Scope |
|------|-------|
| Admin | Full system access |
| Operator | Manage nodes, vault, relay, marketplace, wallet |
| User | Vault, relay, marketplace, wallet |
| Guest | Read-only |

## Kingsman admin mode
- Activated via SHA3-256 hashed master code
- Default hash: `4813494d137e1631bba301d5acab6e7bb7aa74ce1185d456565ef51d737677b2`

---

# PART 12: MISSING / STUB FEATURES

Based on code audit, these features exist only as stubs:

| Feature | Status |
|---------|--------|
| cmd_get_starteran_status | Returns hardcoded zeros |
| cmd_get_rentbit_status | Returns hardcoded zeros |
| cmd_get_conversations | Returns [] |
| cmd_get_call_history | Returns [] |
| cmd_get_communities | Returns [] (but cmd_list_communities exists) |
| cmd_get_status_updates | Returns [] |
| cmd_get_challenges | Returns [] (but cmd_list_challenges exists) |
| cmd_get_rankings | Returns [] (but cmd_list_rankings exists) |
| cmd_get_security_logs | Returns [] |
| cmd_get_devices | Returns [] |
| cmd_get_app_notifications | Returns [] |
| cmd_get_jobs | Returns [] |
| P2P networking | Peers are local/in-memory only, no remote discovery |
| Real wallet tx | Faucet gives instant 1000 PINC, no real P2P transfer |
| Real WebRTC calls | SDP offers/answers are fake |
| Real game sessions | Local DB only, no P2P sync |

---

# PART 13: FILES CHANGED IN CURRENT WORK SESSION

| File | Change |
|------|--------|
| src/main.tsx | Wrapped App in AppErrorBoundary |
| src/components/system/AppErrorBoundary.tsx | NEW: React error boundary |
| src/store/appStore.ts | Removed screen from persist; fixed merge logic |
| src/components/dashboard/NodeHome.tsx | Added asNumber() guard + cleaned unused imports |
| src-tauri/Cargo.toml | Removed openssl vendored; removed native-tls from tokio-tungstenite |
| src-tauri/gen/android/gradle.properties | Added abiList/archList/targetList constraints |

---

# PART 14: CURRENT BUILD STATUS

## Successfully built
- Frontend production build: dist/index.html + assets (exists on disk)
- Linux release binary: src-tauri/target/release/pinc (21.7 MB, Jul 29 17:19)

## Partially built
- Android Rust target cache: .cargo-target-android/ (partial artifacts exist)
- Android build metadata: output-metadata.json exists
- **Android APK not confirmed present** — build was interrupted

---

# PART 15: BUILD COMMANDS

## Linux (clean rebuild)
```bash
rm -rf "/home/rachael/pinc-network/dist" "/home/rachael/pinc-network/src-tauri/target/release/bundle" "/home/rachael/pinc-network/src-tauri/target/release/pinc" && npm run build && cargo build --manifest-path "/home/rachael/pinc-network/src-tauri/Cargo.toml" --release
```

## Android (clean rebuild)
```bash
rm -rf "/home/rachael/pinc-network/.cargo-target-android" "/home/rachael/pinc-network/src-tauri/gen/android/app/build" && npm run build && CARGO_TARGET_DIR="/home/rachael/pinc-network/.cargo-target-android" CARGO_BUILD_JOBS=1 ./src-tauri/gen/android/gradlew -p ./src-tauri/gen/android assembleUniversalRelease
```

Expected APK: `src-tauri/gen/android/app/build/outputs/apk/universal/release/app-universal-release.apk`

---

# PART 16: PROJECT STATS

| Metric | Value |
|--------|-------|
| Rust source files | ~166 |
| Rust lines of code | ~19,474 |
| Frontend source files | ~32 |
| Frontend lines of code | ~27,073 |
| Database tables | 37 |
| Tauri commands | ~200+ |
| Supported languages | 12 (store) / 52 (declared) |
| Git commits | 5 |
| Disk usage | ~5.3 GB (target) + 4 MB (dist) |
| Platform targets | Linux, Windows, macOS, Android, iOS (scaffolded) |

---

*End of comprehensive project map. This document covers all files, directories, architecture, commands, dependencies, state management, build config, security, and current work status for PINC v3.0.0.*

