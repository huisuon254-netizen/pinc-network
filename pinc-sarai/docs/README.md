# SARAI Standalone — 10-Agent Deep Scan + Build

**Project:** SARAI (Wallet) Phase 7 — Decentralized Wallet & Finance  
**Date:** 2026-08-24  
**Root:** `/home/rachael/pinc-network` → `pinc-sarai/` standalone  
**Agents:** 10 parallel explore agents, ~80 files, ~15k LOC  
**Status:** Scan complete, standalone scaffold created

## Structure
- `src/components/sarai/SaraiPage.tsx:1` — 922L, 8 tabs (dashboard|transactions|payments|crypto|escrow|agent|notifications|history)
- `src-tauri/src/core/payment/` — types, ledger, escrow, treasury, errors
- `src-tauri/src/core/crypto/` — wallet (HD), keys, cipher, hash, token_swap, bridge, evm_sync, defi, phase12
- `src-tauri/src/core/database/` — schema 858L (71 tables), queries 1743L, migrations 491L
- `src-tauri/src/modules/p2p_agents/` — models, storage, commands (fiat on-ramp)
- `src-tauri/tauri.conf.json` — `com.pinc.sarai` port 1422 (vs main 1420, admin 14200)

## Build Targets
| Platform | Target | Artifact |
|---|---|---|
| Windows | x86_64-pc-windows-msvc | msi+exe |
| Android | aarch64-linux-android | apk (arm64-v8a+armeabi-v7a) |
| macOS | aarch64-apple-darwin | dmg+app |
| Linux | x86_64-unknown-linux-gnu | AppImage+deb |

See `docs/scan/` for 10 exhaustive agent reports. See `SARAI_BUILD_PLAN.md` for scaffold steps.
