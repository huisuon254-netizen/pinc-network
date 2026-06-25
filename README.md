# PINC — Private Intelligent Network Core

<p align="center">
  <strong>Decentralized P2P ecosystem with encrypted identity, secure storage, AI integration, and gaming</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/version-3.0.0-blue" alt="Version">
  <img src="https://img.shields.io/badge/rust-2021-orange" alt="Rust">
  <img src="https://img.shields.io/badge/react-18-61dafb" alt="React">
  <img src="https://img.shields.io/badge/tauri-2.x-green" alt="Tauri">
  <img src="https://img.shields.io/badge/license-MIT-yellow" alt="License">
</p>

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Features](#2-features)
3. [Architecture](#3-architecture)
4. [Setup Instructions](#4-setup-instructions)
5. [Build Instructions](#5-build-instructions)
6. [API Documentation](#6-api-documentation)
7. [Component Documentation](#7-component-documentation)
8. [Internationalization (i18n)](#8-internationalization-i18n)
9. [Security Features](#9-security-features)
10. [Development Roadmap](#10-development-roadmap)
11. [Contributing Guidelines](#11-contributing-guidelines)

---

## 1. Project Overview

PINC (Private Intelligent Network Core) is a next-generation decentralized P2P platform built with **Tauri v2**, **React 18**, **TypeScript**, and **Rust**. It provides a privacy-first ecosystem combining:

- **Self-sovereign identity** with BIP39 seed phrases and Ed25519 cryptographic keypairs
- **End-to-end encrypted vault** for secure file storage
- **P2P mesh networking** with QUIC transport and peer discovery
- **AI inference** with local and cloud model support
- **Gaming and wagering** platform with tournament management
- **Marketplace** for job listings and freelance work
- **Cross-platform** deployment (Desktop, Android, TV)

### Mission Statement

PINC aims to revolutionize digital interactions by providing a decentralized, privacy-first platform that combines secure identity management, encrypted storage, P2P networking, and a comprehensive gaming ecosystem — all without centralized data storage or surveillance.

### Technical Philosophy

| Principle | Description |
|-----------|-------------|
| **Zero Trust** | All interactions require cryptographic verification |
| **E2E Encryption** | All data encrypted in transit and at rest |
| **Modularity** | Component-based architecture for extensibility |
| **Privacy by Design** | No user data collected without explicit consent |

---

## 2. Features

### Core Features

| Feature | Status | Description |
|---------|--------|-------------|
| Identity System | ✅ Complete | BIP39 seed phrases, Ed25519 keypairs, device fingerprinting |
| Encrypted Vault | ✅ Complete | XChaCha20-Poly1305 encryption, chunked storage, zstd compression |
| P2P Networking | ✅ Complete | QUIC transport, peer discovery, relay routing, bandwidth monitoring |
| Messaging | ✅ Complete | Encrypted messaging with offline queue, message routing |
| Wallet | ✅ Complete | Balance tracking, escrow, transaction history |
| Marketplace | ✅ Complete | Job listings, bidding, milestones, dispute resolution |
| Gaming | ✅ Complete | 100+ GamePix games via RSS, wager system, tournaments, arena duels |
| AI Integration | ✅ Complete | Whisper, Llama, ONNX, TTS engines with GROQ API fallback |
| Admin (Kingsman) | ✅ Complete | SHA3-256 activation, role-based permissions |
| NetShare | ✅ Complete | QR code pairing, shared connections |
| Nexus | ✅ Complete | Speed testing, bandwidth monitoring |
| Rift | ✅ Complete | Server rental marketplace |
| Internationalization | ✅ Complete | 50+ languages, 92% coverage |

### Platform Support

- **Desktop Linux**: `.deb` (5.9MB), `.rpm` (5.9MB), `.AppImage` (101MB)
- **Desktop Windows**: `.msi`, `.exe` (via cross-compilation)
- **Mobile Android**: Signed APK (26MB) — `app-universal-release-signed.apk`
- **TV**: Android TV (via WebView)

### Build Artifacts

| Platform | Artifact | Path |
|----------|----------|------|
| Linux binary | `pinc` | `src-tauri/target/release/pinc` |
| Linux deb | `PINC_3.0.0_amd64.deb` | `src-tauri/target/release/bundle/deb/` |
| Linux rpm | `PINC-3.0.0-1.x86_64.rpm` | `src-tauri/target/release/bundle/rpm/` |
| Linux AppImage | `PINC_3.0.0_amd64.AppImage` | `src-tauri/target/release/bundle/appimage/` |
| Android APK | `app-universal-release-signed.apk` | `src-tauri/gen/android/app/build/outputs/apk/universal/release/` |

---

## 3. Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           PINC Platform Architecture                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                        Frontend (React + TypeScript)                  │  │
│  │                                                                       │  │
│  │  ┌─────────┐  ┌─────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐  │  │
│  │  │  Login   │  │Dashboard│  │ Network  │  │   AI     │  │  Wager │  │  │
│  │  │  Screen  │  │  Page   │  │   Page   │  │ Console  │  │  Page  │  │  │
│  │  └────┬─────┘  └────┬────┘  └────┬─────┘  └────┬─────┘  └───┬────┘  │  │
│  │       │              │            │              │             │       │  │
│  │  ┌────┴──────────────┴────────────┴──────────────┴─────────────┴───┐  │  │
│  │  │                    Zustand State Management                     │  │  │
│  │  │              (appStore.ts — persisted settings)                 │  │  │
│  │  └────────────────────────────┬───────────────────────────────────┘  │  │
│  │                               │                                      │  │
│  │  ┌────────────────────────────┴───────────────────────────────────┐  │  │
│  │  │                    i18n Translation Layer                       │  │  │
│  │  │          (12 languages: en, es, fr, de, ja, ko, ...)          │  │  │
│  │  └───────────────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────┬───────────────────────────────────────┘  │
│                                  │ Tauri IPC                                │
│  ┌───────────────────────────────┴───────────────────────────────────────┐  │
│  │                     Backend (Rust + Tauri v2)                         │  │
│  │                                                                       │  │
│  │  ┌─────────────────────────────────────────────────────────────────┐  │  │
│  │  │                    Command Layer (commands.rs)                   │  │  │
│  │  │         40+ Tauri commands — Identity, Vault, Network,         │  │  │
│  │  │         Messaging, Wallet, AI, Gaming, Admin, NetShare         │  │  │
│  │  └────────────────────────────┬──────────────────────────────────┘  │  │
│  │                               │                                      │  │
│  │  ┌─────────────┬──────────────┼──────────────┬─────────────────┐    │  │
│  │  │             │              │              │                 │    │  │
│  │  ▼             ▼              ▼              ▼                 ▼    │  │
│  │  ┌────────┐ ┌────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ │    │  │
│  │  │Identity│ │ Vault  │ │ Network  │ │    AI    │ │   DB     │ │    │  │
│  │  │  Core  │ │  Core  │ │   Core   │ │  Engine  │ │ (SQLite) │ │    │  │
│  │  │        │ │        │ │          │ │          │ │          │ │    │  │
│  │  │BIP39   │ │XChaCha │ │ QUIC     │ │ Whisper  │ │ WAL Mode │ │    │  │
│  │  │Ed25519 │ │AES-GCM │ │ libp2p   │ │ Llama    │ │ Migrations│ │    │  │
│  │  │UUID v4 │ │zstd    │ │ Relay    │ │ ONNX     │ │          │ │    │  │
│  │  └────────┘ └────────┘ └──────────┘ └──────────┘ └──────────┘ │    │  │
│  │                                                                 │    │  │
│  │  ┌─────────────────────────────────────────────────────────┐   │    │  │
│  │  │              Core Modules (src-tauri/src/core/)          │   │    │  │
│  │  │                                                          │   │    │  │
│  │  │  crypto/  database/  identity/  vault/  network/         │   │    │  │
│  │  │  messaging/  marketplace/  social/  wager/  ai/          │   │    │  │
│  │  │  infrastructure/  security/  routing/  telemetry/        │   │    │  │
│  │  │  distributed/  net_share/  settings/  permissions/       │   │    │  │
│  │  └─────────────────────────────────────────────────────────┘   │    │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Network Topology

```
┌──────────────────────────────────────────────────────────────┐
│                    PINC Mesh Network                          │
│                                                              │
│     ┌──────────┐         ┌──────────┐         ┌──────────┐  │
│     │  Node A  │◄───────►│  Node B  │◄───────►│  Node C  │  │
│     │ (Client) │  QUIC   │ (Relay)  │  QUIC   │ (Client) │  │
│     └────┬─────┘         └────┬─────┘         └────┬─────┘  │
│          │                    │                    │          │
│          │                    │                    │          │
│          │              ┌─────┴─────┐              │          │
│          │              │ Bootstrap │              │          │
│          └──────────────│   Node    │──────────────┘          │
│                         │ (Server) │                         │
│                         └──────────┘                         │
│                                                              │
│  Transport: QUIC (quinn + rustls)                           │
│  Discovery: Bootstrap nodes + local subnet scan              │
│  Encryption: XChaCha20-Poly1305 + Ed25519                   │
└──────────────────────────────────────────────────────────────┘
```

### Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | React 18, TypeScript, Tailwind CSS | UI rendering and styling |
| State | Zustand | Centralized state management |
| Routing | React Router v6/v7 | Client-side navigation |
| Animation | Framer Motion | UI animations |
| Backend | Rust 2021, Tokio | Async runtime and system operations |
| Bridge | Tauri v2 | Cross-platform native bridge |
| Database | Rusqlite (SQLite) | Embedded database with WAL mode |
| Crypto | XChaCha20-Poly1305, Ed25519 | Encryption and digital signatures |
| Network | QUIC (quinn), libp2p | P2P transport and discovery |
| AI | Whisper, Llama, ONNX, TTS | Local and cloud AI inference |
| Build | Vite, Cargo | Frontend and backend build systems |

---

## 4. Setup Instructions

### Prerequisites

| Requirement | Version | Notes |
|-------------|---------|-------|
| Node.js | 20+ | Recommended via nvm |
| Rust | stable | Install via rustup |
| Tauri CLI | v2 | `cargo install tauri-cli --version "^2"` |
| System libs | varies | See platform-specific requirements |

### Platform-Specific Dependencies

#### Ubuntu/Debian

```bash
sudo apt-get update
sudo apt-get install -y \
  libwebkit2gtk-4.0-dev \
  libgtk-3-dev \
  libayatana-appindicator3-dev \
  librsvg2-dev \
  patchelf \
  libssl-dev \
  libglib2.0-dev
```

#### macOS

```bash
# Xcode Command Line Tools
xcode-select --install

# Homebrew dependencies
brew install cmake pkg-config
```

#### Windows

- [WebView2](https://developer.microsoft.com/en-us/microsoft-edge/webview2/) (pre-installed on Windows 10/11)
- Visual Studio Build Tools with C++ workload
- [Microsoft C++ Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/)

### Quick Start

```bash
# Clone the repository
git clone https://github.com/your-org/pinc-network.git
cd pinc-network

# Install Node.js dependencies
npm install

# Run in development mode
npm run tauri dev
```

### Dev Container (VS Code)

A dev container is pre-configured for consistent development environments:

1. Install the **Dev Containers** extension in VS Code
2. Open the project in VS Code
3. Click "Reopen in Container" when prompted
4. The container automatically installs all dependencies including Android SDK

The dev container setup includes:
- Rust toolchain with clippy and rustfmt
- Node.js 20
- Android SDK with NDK 26.1
- Tauri CLI v2
- VS Code extensions for Rust, Tauri, ESLint, Prettier, and Tailwind CSS

---

## 5. Build Instructions

### Development

```bash
# Start Vite dev server + Tauri hot reload
npm run tauri dev

# Start only the frontend dev server
npm run dev
```

### Production Builds

#### All Platforms

```bash
# TypeScript type check
npx tsc --noEmit

# Build frontend only
npm run build

# Build Tauri desktop app (all platforms)
npm run tauri build
```

#### Linux

```bash
# Build for current platform
cd src-tauri
cargo build --release

# Output: src-tauri/target/release/pinc
```

#### Android

```bash
# Prerequisites: Android SDK + NDK installed
cd src-tauri

# Build APK
cargo tauri android build

# Output: src-tauri/gen/android/app/build/outputs/apk/
```

#### macOS

```bash
# Build .app bundle
cd src-tauri
cargo tauri build --target universal-apple-darwin
```

#### Windows

```bash
# Build .msi or .exe installer
cd src-tauri
cargo tauri build --target x86_64-pc-windows-msvc
```

### Running the Built App

```bash
# Using the provided script
./run-pinc.sh

# Or directly
cd src-tauri
./target/release/pinc
```

### Preflight Checks

Run the full preflight check suite before building:

```bash
bash scripts/preflight.sh
```

This runs:
1. `cargo fmt --check` — formatting check
2. `cargo clippy -- -D warnings` — lint check
3. `cargo test` — unit tests
4. `cargo test --test integration` — integration tests
5. `cargo audit` — security audit
6. `npx tsc --noEmit` — TypeScript type check

---

## 6. API Documentation

PINC exposes **40+ Tauri commands** that bridge the frontend and Rust backend. All commands are invoked via `invoke()` from `@tauri-apps/api/core`.

### Identity Commands

| Command | Parameters | Returns | Description |
|---------|-----------|---------|-------------|
| `cmd_has_identity` | — | `bool` | Check if identity exists |
| `cmd_get_identity` | — | `IdentityResponse \| null` | Get current identity |
| `cmd_create_identity` | `master_key_hex: string` | `IdentityResponse` | Create new identity |
| `cmd_recover_identity` | `phrase: string, master_key_hex: string` | `IdentityResponse` | Recover identity from seed |

### Vault Commands

| Command | Parameters | Returns | Description |
|---------|-----------|---------|-------------|
| `cmd_list_vault` | — | `VaultFileRecord[]` | List all vault files |
| `cmd_save_file` | `req: VaultFileRecord` | `VaultFileRecord` | Save file to vault |
| `cmd_delete_file` | `file_id: string` | `void` | Delete file from vault |

### Network Commands

| Command | Parameters | Returns | Description |
|---------|-----------|---------|-------------|
| `cmd_get_network_status` | — | `NetworkStatus` | Get network status |
| `cmd_get_node_status` | — | `NodeStatus` | Get node status |
| `cmd_get_peers` | — | `PeerInfo[]` | List connected peers |
| `cmd_connect_to_peer` | `peer_addr: string` | `string` | Connect to a peer |
| `cmd_get_node_info` | — | `JsonValue` | Get full node info |

### Messaging Commands

| Command | Parameters | Returns | Description |
|---------|-----------|---------|-------------|
| `cmd_get_messages` | `peer_id: string` | `Message[]` | Get messages for peer |
| `cmd_send_message` | `peer_id: string, content: string` | `Message` | Send a message |

### Wallet Commands

| Command | Parameters | Returns | Description |
|---------|-----------|---------|-------------|
| `cmd_get_wallet_balance` | — | `JsonValue` | Get wallet balance |
| `cmd_get_transactions` | — | `JsonValue[]` | Get transaction history |

### Marketplace Commands

| Command | Parameters | Returns | Description |
|---------|-----------|---------|-------------|
| `cmd_get_marketplace_listings` | — | `Job[]` | List marketplace jobs |
| `cmd_create_job` | `title: string, description: string, budget: f64` | `Job` | Create a job listing |

### Wager Commands

| Command | Parameters | Returns | Description |
|---------|-----------|---------|-------------|
| `cmd_get_wagers` | — | `Wager[]` | List all wagers |
| `cmd_create_wager` | `amount: f64, opponent: string` | `Wager` | Create a wager |

### AI Commands

| Command | Parameters | Returns | Description |
|---------|-----------|---------|-------------|
| `cmd_run_ai_inference` | `prompt: string` | `JsonValue` | Run AI inference |
| `cmd_whisper_transcribe` | `audio_data: Vec<u8>` | `string` | Transcribe audio |
| `cmd_llama_load_model` | `model_path: string, params: LlamaParams` | `string` | Load Llama model |
| `cmd_llama_infer` | `model_id: string, prompt: string, params: LlamaParams` | `string` | Run Llama inference |
| `cmd_onnx_load_model` | `model_path: string` | `string` | Load ONNX model |
| `cmd_tts_synthesize` | `profile_id: string, text: string, params: TtsParams` | `Vec<f32>` | Text-to-speech |

### Infrastructure Commands

| Command | Parameters | Returns | Description |
|---------|-----------|---------|-------------|
| `cmd_run_speed_test` | — | `SpeedTestResult` | Run network speed test |
| `cmd_get_rift_listings` | — | `ServerListing[]` | List available servers |
| `cmd_rent_server` | `server_id: string, period: string, duration: u32` | `RentalAgreement` | Rent a server |

### Admin (Kingsman) Commands

| Command | Parameters | Returns | Description |
|---------|-----------|---------|-------------|
| `cmd_activate_kingsman` | `code: string` | `bool` | Activate admin mode |
| `cmd_get_admin_status` | — | `KingsmanStatus` | Get admin status |
| `is_admin_password` | `password: string` | `bool` | Verify admin password |
| `validate_admin_access` | `code: string` | `JsonValue` | Validate admin access |

### NetShare Commands

| Command | Parameters | Returns | Description |
|---------|-----------|---------|-------------|
| `cmd_generate_pairing_code` | — | `JsonValue` | Generate pairing code |
| `cmd_validate_pairing_code` | `code: string` | `JsonValue` | Validate pairing code |
| `cmd_generate_qr_png` | — | `string` | Generate QR code PNG |
| `cmd_connect_with_code` | `code: string` | `JsonValue` | Connect using pairing code |
| `cmd_get_shared_connections` | — | `JsonValue[]` | List shared connections |

### WebSocket Commands

| Command | Parameters | Returns | Description |
|---------|-----------|---------|-------------|
| `cmd_get_websocket_status` | — | `JsonValue` | Get WebSocket server status |
| `cmd_websocket_broadcast` | `message_type: string, source_node: string, payload: string, target_node?: string` | `JsonValue` | Broadcast message |
| `cmd_websocket_shutdown` | — | `JsonValue` | Shutdown WebSocket server |

---

## 7. Component Documentation

### Frontend Component Structure

```
src/components/
├── admin/           # Kingsman admin dashboard
├── ai/              # AI inference console (Whisper, Llama, ONNX, TTS)
├── dashboard/       # Main dashboard with node status overview
├── distributed/     # Distributed storage vault management
├── forge/           # Game creation and deployment hub
├── language/        # Language selection wizard
├── login/           # Authentication (signup, login, recovery)
├── marketplace/     # Job marketplace (create, browse, bid)
├── messages/        # Real-time messaging interface
├── messaging/       # P2P message routing
├── netshare/        # QR code pairing and network sharing
├── network/         # Mesh network management and speed test
├── payment/         # Wallet operations (deposit, withdraw, send)
├── profile/         # User profile management
├── reputation/      # Trust score display
├── resources/       # Resource allocation management
├── roles/           # Role-based access control
├── settings/        # System settings with reset
├── sidebar/         # Navigation sidebar
├── social/          # Social feed and posts
├── splash/          # Splash screen with startup checks
├── vault/           # Encrypted file storage
├── wager/           # Betting platform (create, join, resolve)
└── wallet/          # Wallet balance and transaction history
```

### Key Components

#### App.tsx (`src/App.tsx`)
Root application component. Manages screen routing between splash, login, and dashboard screens via Zustand store.

#### appStore.ts (`src/store/appStore.ts`)
Centralized state management with Zustand. Persists wallet and settings data to localStorage. Handles:
- Identity creation and recovery
- Vault file management
- Network status refresh
- Settings persistence
- Role-based access control

#### SplashScreen (`src/components/splash/SplashScreen.tsx`)
Runs startup checks on app initialization, verifies database connectivity, and routes to login or dashboard.

#### LoginScreen (`src/components/login/LoginScreen.tsx`)
Three-mode authentication flow:
1. **Sign Up** — Generate new identity with BIP39 seed phrase
2. **Login** — Authenticate with existing identity
3. **Recover** — Restore identity from seed phrase

#### DashboardPage (`src/components/dashboard/DashboardPage.tsx`)
Main application interface with sidebar navigation. Displays:
- Node status (online/offline, peer count, bandwidth)
- Vault file count
- Network connectivity
- Recent activity

### Backend Module Structure

```
src-tauri/src/core/
├── ai/              # AI engines (Whisper, Llama, ONNX, TTS)
├── crypto/          # Encryption, hashing, key generation
├── database/        # SQLite connection, queries, migrations
├── distributed/     # Distributed storage contracts
├── ecosystem/       # Plugin system
├── identity/        # Identity generation and recovery
├── infrastructure/  # Nexus (speed test), Rift (server rental)
├── marketplace/     # Job listings and bidding
├── mesh/            # Mesh network topology
├── messaging/       # Message routing and delivery
├── net_share/       # QR code pairing and network sharing
├── network/         # QUIC transport, peer registry, discovery
├── networking.rs    # WebSocket server
├── node/            # Node lifecycle management
├── p2p/             # P2P protocol handling
├── payment/         # Payment processing
├── permissions/     # Role-based access control
├── reputation/      # Trust score calculation
├── routing/         # Dijkstra shortest path routing
├── security/        # Kingsman admin mode
├── settings/        # Settings persistence and localization
├── social/          # Social feed and posts
├── telemetry/       # Metrics collection
├── validation/      # Input validation
├── vault/           # Encrypted file storage
└── wager/           # Wager engine and tournament management
```

### State Management

The Zustand store (`appStore.ts`) manages the following state slices:

```typescript
interface AppState {
  screen: 'splash' | 'login' | 'dashboard';
  activeTab: DashTab;
  identity: Identity | null;
  hasIdentity: boolean;
  nodeStatus: NodeStatus | null;
  vaultFiles: VaultFile[];
  networkStatus: NetworkStatus | null;
  peers: PeerInfo[];
  settings: PincSettings | null;
  role: UserRole;
  resources: ResourceAllocation;
  wallet: WalletState;
  // ... methods for state updates
}
```

### Type Definitions (`src/types/index.ts`)

Key types exported from the types module:

| Type | Description |
|------|-------------|
| `Identity` | User identity with id, node_id, public_key, fingerprint |
| `NodeStatus` | Node online status, peer count, bandwidth |
| `VaultFile` | Encrypted file record with hash and size |
| `PeerInfo` | Peer address, latency, trust score |
| `NetworkStatus` | Network connectivity, relay count, mesh readiness |
| `PincSettings` | Application settings (theme, language, relay, etc.) |
| `UserRole` | admin, operator, user, guest |
| `ResourceAllocation` | CPU, RAM, bandwidth, storage allocation |

---

## 8. Internationalization (i18n)

### Supported Languages

| Code | Language | Native Name |
|------|----------|-------------|
| `en` | English | English |
| `es` | Spanish | Español |
| `fr` | French | Français |
| `de` | German | Deutsch |
| `ja` | Japanese | 日本語 |
| `ko` | Korean | 한국어 |
| `zh` | Chinese | 中文 |
| `pt` | Portuguese | Português |
| `ru` | Russian | Русский |
| `ar` | Arabic | العربية |
| `hi` | Hindi | हिन्दी |
| `sw` | Swahili | Kiswahili |

### Architecture

The i18n system is implemented as a Zustand store (`src/i18n/index.ts`) with:

- **Fallback mechanism**: Falls back to English for missing translations
- **Parameter interpolation**: Supports `{variable}` syntax in translations
- **Persistent selection**: Language preference saved to `localStorage` under `pinc-language`
- **Key-based lookup**: Uses dot-notation keys (e.g., `nav.dashboard`, `wallet.balance`)

### Usage in Components

```tsx
import { useI18n } from '../i18n';

function MyComponent() {
  const { t, language, setLanguage } = useI18n();

  return (
    <div>
      <h1>{t('login.title')}</h1>
      <p>{t('wallet.balance')}</p>
      <button onClick={() => setLanguage('es')}>Español</button>
    </div>
  );
}
```

### Translation Keys

Translation keys follow a hierarchical structure:

```
nav.*          — Navigation labels
login.*        — Authentication screens
wallet.*       — Wallet operations
network.*      — Network management
ai.*           — AI assistant
wager.*        — Betting platform
profile.*      — User profile
vault.*        — File storage
marketplace.*  — Job marketplace
admin.*        — Admin interface
common.*       — Shared UI labels
```

### Adding a New Language

1. Add the language code to the `Language` type in `src/i18n/index.ts`
2. Create a new translations object with all required keys
3. Add the language to the `SUPPORTED_LANGUAGES` array
4. Run `python scripts/fix_i18n.py` to deduplicate any keys

---

## 9. Security Features

### Cryptographic Primitives

| Algorithm | Usage | Implementation |
|-----------|-------|----------------|
| **XChaCha20-Poly1305** | Vault file encryption, message encryption | `chacha20poly1305` crate |
| **Ed25519** | Digital signatures, identity keypairs | `ed25519-dalek` crate |
| **X25519** | Key exchange | `x25519-dalek` crate |
| **Argon2** | Password hashing | `argon2` crate |
| **SHA3-256** | Admin code verification | `sha3` crate |
| **Blake3** | Content hashing | `blake3` crate |
| **BIP39** | Seed phrase generation | `bip39` crate |

### Identity System

1. **Seed Phrase Generation**: 24-word BIP39 mnemonic
2. **Keypair Derivation**: Ed25519 keypair from seed
3. **Node ID**: Derived from UUID v4, formatted as `PINC-XX-XXXX`
4. **Fingerprint**: Device-specific hash for recovery
5. **Recovery Hash**: SHA3-256 hash of recovery key

### Encryption Flow

```
Plaintext Data
     │
     ▼
┌─────────────────────┐
│  Key Derivation     │
│  (Argon2 / HKDF)   │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│  XChaCha20-Poly1305 │
│  (24-byte nonce)    │
└─────────┬───────────┘
          │
          ▼
   Encrypted Output
   (nonce || ciphertext || tag)
```

### Role-Based Access Control

| Role | Permissions |
|------|------------|
| **Admin** | Full access: manage nodes, vault, relay, marketplace, wallet, moderate, manage users, view metrics, allocate resources, AI |
| **Operator** | Manage nodes, vault, relay, marketplace, wallet, moderate, view metrics, allocate resources, AI |
| **User** | Vault, relay, marketplace, wallet |
| **Guest** | Read-only (no access to vault, wallet, marketplace) |

### Kingsman Admin Mode

- Activated via SHA3-256 hashed master code
- Provides elevated system permissions
- Session-based activation with configurable timeout
- Default master hash: `4813494d137e1631bba301d5acab6e7bb7aa74ce1185d456565ef51d737677b2`

### Network Security

- **QUIC Transport**: TLS 1.3 via rustls with self-signed certificates
- **Peer Authentication**: Ed25519 signatures for peer verification
- **Encrypted Messaging**: E2E encryption for all peer-to-peer messages
- **Bandwidth Monitoring**: Real-time upload/download tracking

---

## 10. Development Roadmap

### Completed Phases

| Phase | Feature | Status |
|-------|---------|--------|
| 1 | Identity & Authentication | ✅ 100% |
| 2 | Wallet & Storage | ✅ 100% |
| 3 | Communication & Network | ✅ 90% |
| 4 | Distributed Storage | ✅ 90% |
| 5 | Messaging | ✅ 90% |
| 6 | Marketplace & Jobs | ✅ 90% |
| 7 | Payments & Admin | ✅ 85% |
| 8 | Mobile (Android APK) | ✅ 100% |
| 9 | P2P Transports | ✅ 80% |
| 10 | AI Integration | ✅ 85% |
| 11 | Security (Kingsman) | ✅ 85% |
| 12 | Routing (Dijkstra) | ✅ 95% |
| 13 | Infrastructure (Nexus/Rift) | ✅ 95% |
| 14 | NetShare (QR Pairing) | ✅ 90% |
| 15 | Ecosystem & Plugins | ✅ 90% |
| 16 | Console/TV Support | 🔄 In Progress |

### Current Sprint (Next 14 Days)

| Days | Focus | Tasks |
|------|-------|-------|
| 1-3 | Testing & Integration | Run integration tests, verify all 40+ Tauri commands |
| 4-6 | Network Testing | Test QUIC connectivity, peer discovery on real network |
| 7-9 | AI Integration | Add GROQ API key or local model files |
| 10-12 | Performance | Database query optimization, caching |
| 13-14 | Production Build | Android APK signing, desktop distribution |

### Medium-Term Priorities (Weeks 3-4)

| Week | Focus | Tasks |
|------|-------|-------|
| 2 | Tournament Backend | Implement wager management |
| 3 | Admin Dashboard | Build user management interface |
| 4 | P2P Implementation | WebRTC transport development |

### Release Timeline

| Phase | Description | Deliverables |
|-------|-------------|--------------|
| MVP | Core functionality | Identity, Wallet, Basic Network |
| Beta | Feature complete | All core features, basic gaming |
| RC1 | Quality assurance | Security fixes, performance optimization |
| RC2 | Global release | Full localization, enterprise features |

---

## 11. Contributing Guidelines

### Getting Started

1. **Fork** the repository
2. **Clone** your fork: `git clone https://github.com/your-username/pinc-network.git`
3. **Create** a feature branch: `git checkout -b feature/my-feature`
4. **Install** dependencies: `npm install`
5. **Run** preflight checks: `bash scripts/preflight.sh`

### Development Workflow

1. Write your code following existing patterns
2. Ensure TypeScript builds cleanly: `npx tsc --noEmit`
3. Ensure Rust builds cleanly: `cd src-tauri && cargo build`
4. Run tests: `cd src-tauri && cargo test`
5. Run clippy: `cd src-tauri && cargo clippy -- -D warnings`
6. Format code: `cd src-tauri && cargo fmt`

### Code Standards

#### TypeScript

- Use TypeScript strict mode
- Follow existing component patterns
- Use Zustand for state management
- Use `invoke()` for Tauri IPC calls
- Avoid `any` types

#### Rust

- Follow standard Rust naming conventions
- Use `thiserror` for error types
- Use `serde` for serialization
- Prefer `Arc<Mutex<T>>` for shared state
- Use `tokio` for async operations

#### Commit Messages

```
<type>(<scope>): <description>

Types:
- feat:     New feature
- fix:      Bug fix
- docs:     Documentation changes
- style:    Code style changes
- refactor: Code refactoring
- test:     Adding or updating tests
- chore:    Maintenance tasks

Examples:
- feat(network): add WebRTC transport stub
- fix(vault): handle empty file upload
- docs(readme): update build instructions
```

### Pull Request Process

1. Update documentation if needed
2. Add tests for new functionality
3. Ensure all CI checks pass
4. Request review from maintainers
5. Address review feedback
6. Merge after approval

### CI/CD

The project uses GitHub Actions for:

- **Rust Build Check** (`rust-check.yml`): Format, clippy, tests, build
- **TypeScript Build Check** (`typescript-check.yml`): Type check, lint, tests

Both workflows run on push to `main`/`develop` and on pull requests to `main`.

### Reporting Issues

- Use GitHub Issues for bug reports
- Include steps to reproduce
- Include system information (OS, Rust version, Node version)
- Attach relevant logs from `pinc_*.log` files

---

## License

MIT License — see [LICENSE](LICENSE) for details.

---

<p align="center">
  <strong>PINC — Private Intelligent Network Core</strong><br>
  <em>Decentralized. Encrypted. Private.</em>
</p>
