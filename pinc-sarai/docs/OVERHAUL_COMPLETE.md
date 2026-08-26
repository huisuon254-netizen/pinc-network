# SARAI Overhaul — COMPLETE (31 Agents: 10 Assess + 10 Eval + 10 Fix + 1 Test)
Date: 2026-08-24 | REAL ONLY, NO DEMO DATA

## Phase 1 — ASSESS (10 agents)
Page structure, themes, onboarding, settings/auth, wallet containment, deposit/withdraw, escrow, P2P limits, currency, SDKs.

## Phase 2 — EVALUATE (10 agents)
Restructure plan (8→8 new tabs), 4-theme plan, onboarding language plan, settings/auth plan, containment plan, escrow-inbuilt plan, stable-2-coin plan, messages/history plan, bridge/swap/defi plan, profit plan.

## Phase 3 — FIX (10 agents, 3 parallel implementers)
### Fix A — Themes + Onboarding + Settings
- 4 themes: dark-tech, cyber-wave, light-luxe, matrix-grid — ThemeContext, themes.css, ThemeBackground (grid/waves/gold/olive), GlassCard, Pill, BottomNav, index.html pre-hydration
- Onboarding: LanguageOnboardingScreen (33 langs) BEFORE login, LanguageSelector, screen 'language', hasCompletedOnboarding
- Settings: SettingsPage 8 sections (Account/Security password+passcode+fingerprint/Privacy/Notifications/Appearance/Network/AI/Backup) + LockScreen PIN pad, backend core/settings + core/security (Argon2), app_settings/auth_secrets tables, 13 new lib.rs handlers

### Fix B — Page Restructure
- New 8 tabs: dashboard, deposit, withdraw, send, request, messages, history, crypto(watch-only), setting
- Removed: Payment Methods, Crypto(static), Escrow page, P2P Agent page
- Escrow INBUILT: EscrowInline silver #C0C0C0, 30min countdown, I HAVE SENT, complain after expiry
- Deposit: country → agents ranked completion_rate + online + 5 token balances → quote → initiate (expires+1800) → confirm → release
- Withdraw: process_withdraw + hot/swap top-up via cheapest_quote
- Send: PINC-0000-000 validation + USDT/USDC + memo → transfer + message
- Request: invoice via message, list incoming
- Messages: real polling 3s cmd_get_messages/send_message (no demo)
- History: unified transactions + p2p orders + notifications + search/export
- New backend: cmd_get_messages/send_message/p2p_deposit_list/wallet_history/conversations/list_invoices

### Fix C — Containment + Bridge + DeFi + Currency
- Wallet containment: admin feature gate, SARAI watch-only (no bip39/ethers on device), signed watch addresses, server-side QR, wallet_addresses table BIP44/84 gap-limit-20
- Deposit identification: per-user HD derivation, HMAC-SHA256 Alchemy webhook, chain_tx_hash UNIQUE dedup, 12 confirmations, no address reuse
- Bridge/Swap/DeFi: aggregator.rs (1inch 0.04%, LI.FI Across/CCTP/Stargate/LayerZero, Curve, CowSwap, Aave V3), net_out = quoted-gas-fee, profit_after_fees, scripts/audit-contracts.sh (cargo audit + slither)
- P2P: deposit limit max $1000 (agent-set), withdraw uncapped
- FX: 150 countries, market*0.99 - 2.5% fee (1 USD=129 KES market → 127.71 SARAI), frankfurter/CoinGecko live, cmd_get_fx_rate/convert_currency/profit_estimate
- Non-custodial SDKs: ethers@6, viem@2, @solana/web3.js, WalletConnect stub, public RPCs, DexScreener/CoinGecko, ChangeNOW/StealthEX, Base/Solana escrow contracts

## Phase 4 — TEST (1 agent) — ALL PASS
- cargo check: 0 errors (15 warnings)
- cargo test internal_wallets: 7/7 PASS | full: 45/45 PASS
- npx tsc --noEmit: 0 errors
- npm run build: 466kB OK
- Demo data: 0 hits (john_kinuthia/MOCK_TRANSACTIONS/bc1q5arx/0x742d35Cc all removed)
- Tab union: 9 (dashboard|deposit|withdraw|send|request|messages|history|crypto|setting)
- Themes: ThemeContext/themes.css/ThemeBackground exist
- Onboarding: LanguageOnboardingScreen exists
- Settings: SettingsPage + LockScreen exist
- Containment: 3 cfg(admin) gates
- P2P: 16 commands registered
- FIX: stale NDK_HOME=r26d → build-android.sh now pins 27.0.12077973

## BUILD COMMANDS
```bash
cd /home/rachael/pinc-network/pinc-sarai && npm install && npm run build
# LINUX
cd src-tauri && npx tauri build --target x86_64-unknown-linux-gnu
# ANDROID
export ANDROID_HOME=$HOME/Android/Sdk NDK_HOME=$HOME/Android/Sdk/ndk/27.0.12077973 ANDROID_NDK_HOME=$NDK_HOME
cd src-tauri && npx tauri android init && npx tauri android build --target aarch64
# WINDOWS (on windows host)
npm run build && cd src-tauri && cargo tauri build --target x86_64-pc-windows-msvc
# MACOS (on mac host)
cargo tauri build --target aarch64-apple-darwin
```
NOTE: Do NOT pass --features admin (SARAI ships watch-only; admin APK generates keys).
