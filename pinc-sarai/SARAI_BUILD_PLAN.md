# SARAI Standalone — Build Plan for All Platforms

**Scaffold:** `pinc-sarai/` created 2026-08-24, template `pinc-admin` (29 files) + SARAI 10-agent scan
**Identifier:** `com.pinc.sarai` (was `com.pinc.app`), product `SARAI`, port `1422` (main 1420, admin 14200), version `3.0.0` code `3000000`

## 1. What Was Copied (Everything Found by 10 Agents)
- **Frontend:** `src/components/sarai/SaraiPage.tsx:1` 922L 8 tabs, `WalletPage.tsx`, `SeedPhraseBackup.tsx:1` 91L, `types/index.ts:160` WalletBalance/Transaction, `store/appStore.ts:1` 376L, `i18n/*` 12+20 langs, `styles/globals.css:1` 368L, `App.tsx`, `main.tsx`, `index.html`, `vite.config.ts:1422`, `tsconfig.json`, `package.json`, `public/assets 31 files`, `icons 20`
- **Backend:** `src-tauri/src/core/payment/*` (types f64, ledger, escrow, treasury orphan), `core/crypto/*` (wallet HD BIP39/BIP44, token_swap 353L, bridge 283L, evm_sync 272L, defi 430L, phase12 28L, htlc 141L), `core/database/*` (schema 858L 71 tables, queries 1743L, migrations 491L), `core/identity/*` (generator SHA256 weak, recovery broken), `modules/p2p_agents/*` (models 183L, storage 540L, commands 452L), `commands.rs` wallet cmds, `tauri.conf.json`, `Cargo.toml`, `build.rs`, `capabilities/default.json`, `.cargo/config.toml` NDK 27, `scripts/build-android.sh` adapted

## 2. Critical Fixes Required Before Build (from 10 scans)
- **P0 compile:** add `pub mod treasury` to payment/mod.rs (done), add 8 `pub mod` to crypto/mod.rs (done), fix `SystemTime` + `Token` imports in token_swap/defi/bridge/evm, fix `&mut` for swap/bridge execute, add `AppState.crypto_engine` or wire Phase12 via Arc<AsyncMutex> and register 23 crypto_* handlers in lib.rs (currently SARAI minimal lib.rs exposes only 8 wallet cmds)
- **P0 money:** f64 → i64 cents or Decimal before production; TRON Base58, HMAC Alchemy webhook, Argon2 for private_key_encrypted
- **P0 wallet linkage:** cmd_transfer_tokens currently direct insert no ledger::transfer; wire to ledger + wallet_balances atomic transaction; wire faucet to treasury::faucet_request daily limit

## 3. Minimal SARAI lib.rs Created (195L)
- AppState {db, vault_dir} only (not full 19 fields), 8 commands: get_wallet_balance, get_transactions, transfer_tokens, faucet_request, create_escrow, release_escrow, has_identity, create_identity, get_identity; setup creates sarai.db + vault + manage; handler generate_handler! 8.
- To add full swap/bridge/defi: extend AppState with `crypto_engine: Arc<Mutex<CryptoEngine>>` and add 23 crypto_* handlers (see docs/scan/02-04)

## 4. Build Steps per Platform

### Prerequisites
- Node 20, Rust stable + `cargo install tauri-cli`, NDK 27.0.12077973, Java 17, Android SDK 34, mold+clang

### Desktop (Windows/macOS/Linux)
```bash
cd pinc-sarai
npm install
npm run build  # tsc + vite → dist
cargo check --manifest-path src-tauri/Cargo.toml
cargo tauri build --target x86_64-unknown-linux-gnu # Linux
cargo tauri build --target x86_64-pc-windows-msvc # Windows (on windows-latest)
cargo tauri build --target aarch64-apple-darwin # macOS
# artifacts: src-tauri/target/<target>/release/bundle/{appimage,deb,msi,dmg}
```

### Android APK
```bash
cd pinc-sarai
npm install && npm run build
cd src-tauri && npx tauri android init  # generates gen/android with namespace com.pinc.sarai
# edit gen/android/app/build.gradle.kts: namespace/com.pinc.sarai, abiFilters arm64-v8a+armeabi-v7a, signing pincDebug/release
# edit AndroidManifest.xml: keep INTERNET, drop CAMERA/BLUETOOTH if pure wallet
npx tauri android build --target aarch64  # 30min
find gen -name "*.apk" -exec ls -lh {} \;
apksigner sign --ks ../../../debug.keystore --ks-pass pass:pinc123 --out ~/Desktop/SARAI.apk gen/android/app/build/outputs/apk/universal/release/*.apk
```

### CI (GitHub)
Add to `.github/workflows/android-build.yml` third job `build-sarai-android` mirror build-admin-android with `working-directory: pinc-sarai`, env CC/CXX/AR LINKER NDK clang35, same keytool/zipalign/apksigner.

## 5. Tests — What Was Scanned
- payment/tests 7, crypto 20, database 9, identity 11, marketplace 7, wager 9, integration 9, startup 8, e2e 0 specs, api-suite 1500 external not SARAI → overall <5% SARAI cross-module. Must add DB integration tests for transfer→balance, escrow lock→release balance move, faucet daily limit, plus playwright e2e for Sarai tabs.

## 6. Layout
- globals.css vars #0a0a0f etc, app-shell sidebar 190 + main flex1, hamburger mobile fixed 36, sidebar-nav-item 0.7rem mono active electric-blue border-left
- SaraiPage grids: dashboard 220px, transactions filter bar secondary, payments 260px cards, crypto 1fr1fr no media gap, escrow steps flex1, p2p 1fr1fr, history table ellipsis
- Sidebar FullDashTab 10 entries, SARAI Wallet 15, DashboardPage switch sarai→SaraiPage, NodeHome earnings sum.

## 7. Next Actions
1. `npm install` in pinc-sarai then `cargo check` fix imports → `cargo test` → `vite build`
2. Implement P0 fixes (ledger wiring, treasury, f64→i64)
3. Add CryptoEngine to AppState and re-enable swap/bridge/defi handlers if full finance needed
4. Run `scripts/build-android.sh` for APK, desktop `cargo tauri build` for msi/dmg

