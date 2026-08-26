# SARAI Security Deep-Dive (Publishable)
© 2026 PINC Platform — All Transactions. Securely.

## 1. Non-Custodial Architecture
- Private keys generated **locally on device** via ethers.js `Wallet.createRandom()` / @solana/web3.js `Keypair.generate()` — never transmitted.
- At rest: **Argon2id** (m=19456,t=2,p=1) KDF → **XChaCha20-Poly1305** AEAD (24-byte nonce) encryption of key material.
- OS-level: Android **StrongBox/Keystore**, iOS **Secure Enclave**, desktop **OS Keychain**. Nothing in APK bundle.
- Seed phrase shown once, verified by re-entry, never persisted plaintext.

## 2. HD Derivation & Deposit Identification
- **BIP44** `m/44'/60'/0'/0/n` (EVM), **BIP84** `m/84'/0'/0'/0/n` (BTC).
- **Gap limit 20**, per-user unique derivation path + address index — **no address reuse**.
- Every deposit address is unique per user per deposit → system always knows who deposited.
- **chain_tx_hash UNIQUE** dedup — webhook replay impossible. **12 confirmations** before credit.
- Webhook **HMAC-SHA256** signature verification (Alchemy standard).

## 3. Containment Center
- Key/address generation exists **ONLY** in SARAI Admin (`cfg(feature="admin")` compile gate).
- SARAI APK is **watch-only**: fetches signed addresses (`ADMIN_SIGNING_SECRET` HMAC) + server-rendered QR.
- `cargo tree` proof: no `bip39`/`ethers-signers` linked in SARAI release build.

## 4. Escrow State Machine (Inbuilt, not a page)
- On-chain escrow contracts on **Base / Solana** — funds locked in contract, never in our DB.
- States: `EscrowHeld` (silver #C0C0C0) → `PaymentConfirmed` (silver) → `Completed` (green) / `Disputed` (red).
- **30-minute timeout** (`expires_at = created_at + 1800`), live mm:ss countdown.
- After expiry anyone can **complain with evidence** (SHA-256 evidence hash stored, audit_logs entry, both parties notified).

## 5. Aggregator & Bridge Security
- Live route comparison: **CCTP V2** (gas-only, issuer-secured USDC), **Across** (0.04%, UMA optimistic), **Stargate** (0.06%, LayerZero DVN), **1inch Fusion** (0% router, MEV-shielded intents), **Curve** (0.04% stable pools).
- Execution rule: `net_out = quoted_out − gas − protocol_fee`; **profit > 0 enforced** before any route executes.
- Contracts scanned: **cargo audit + slither** — zero abnormalities gate in CI (`scripts/audit-contracts.sh`).

## 6. 20-Wallet Internal Engine
- 5 stables × 4 wallets (fee/hot/cold/swap) + 5 admin fee sinks.
- Hot limit / cold limit / swap reserve; auto-rebalance every 60s; shortfall auto top-up from swap donors via cheapest bridge.
- Fee wallet piles to **$10** then sweeps to admin sink — atomic, audited.

## 7. Anti-Arbitrage Pricing
- **SARAI rate = market × 0.99 − 2.5% (2–3% band) via rate, never a separate fee line.**
- Example: USD/KES market 129.00 → SARAI 128.5 SHILYS. Arbitrage mathematically impossible.
- FX live from Frankfurter/CoinGecko, 30s cache, 150 countries, 33 languages (5 RTL).

## 8. Threat Model & Mitigations
| Threat | Mitigation |
|---|---|
| Clipboard address swap | QR server-rendered; address shown with checksum + copy-verify hint |
| Webhook replay/forgery | HMAC-SHA256 + UNIQUE tx hash + 12 confirmations |
| Address poisoning | Per-user HD paths, gap-20, no reuse |
| MEV sandwich | 1inch Fusion intent mode (no public mempool) |
| Escrow griefing | 30-min timeout + evidence-hash dispute + reputation |
| Key theft at rest | Argon2id + XChaCha20 + OS enclave |
| Insider key access | Containment: generation admin-only, SARAI watch-only |

## 9. Audit Posture
- `cargo audit` + `slither` in CI, zero-abnormality gate.
- **Zero demo/mock data** in shipped app (grep-verified).
- Reproducible builds; every payment action writes `audit_logs` + `op_trails` (actor, trace_id, fields).
- Rate limits: faucet 1000/req, 5000/day; agent commission clamped 0–10%.

## 10. Known Limitations & Roadmap (Honest)
- `f64` money internally → planned migration to i64 cents.
- TRON Base58Check rendering pending (currently hex display).
- Webhook HMAC key rotation scheduled quarterly.
- Cold wallet signing policy + HSM seed ceremony: **internal** (not published by design).
