# PINC Network Wallet & Payment System Research

*Compiled: June 23, 2026*
*Purpose: SARAI Wallet Implementation Reference*

---

## 1. Crypto Wallet UI Patterns

### 1.1 Essential Wallet Dashboard Features

**Core Dashboard Elements:**
- **Portfolio balance display** — Total value in fiat + crypto breakdown, with real-time price updates
- **Asset list** — Token/coin holdings with icons, names, balances, and % change
- **Quick action buttons** — Send, Receive, Swap, Buy prominently placed
- **Transaction history** — Scrollable list with filters (date, type, status)
- **Notification center** — Transaction confirmations, price alerts, security events
- **Multi-chain network selector** — Easy switching between supported networks

**DeFi-Specific Dashboard Additions:**
- Staking/LP position overview with APY
- Lending/borrowing health factors
- Yield farming positions and pending rewards
- NFT gallery integrated into wallet view

**Best Practices (from MetaMask, Rainbow, Phantom):**
- Minimalist design — avoid clutter; surface most-used actions
- Fiat value as primary display, crypto amounts secondary
- One-handed mobile navigation — bottom tab bar for core actions
- Dark/light theme support
- Progressive disclosure — show summary first, details on tap

### 1.2 Transaction List Design

**Standard Transaction List Patterns:**
| Element | Purpose |
|---------|---------|
| Icon/Avatar | Identify token or counterparty |
| Transaction type | Send, Receive, Swap, Contract interaction |
| Amount + token | Value with token symbol |
| Fiat equivalent | USD value at time of transaction |
| Timestamp | Relative (2h ago) with absolute on tap |
| Status indicator | Pending (spinner), Confirmed (check), Failed (X) |
| Network/gas info | Expandable detail row |

**Advanced Features:**
- Filter by: token, type, date range, status
- Search by address, tx hash, or memo
- Grouped transactions (e.g., batch sends)
- Expandable detail view showing: tx hash (linkable to block explorer), gas used, block number, nonce

### 1.3 Send/Receive Flow Patterns

**Send Flow (Best Practice Pattern):**
1. **Recipient input** — Paste address, select from contacts, scan QR, or select recent
2. **Address validation** — Real-time checksum validation, network prefix check
3. **Amount input** — Fiat and crypto toggle, max button, balance display
4. **Token selector** — Dropdown with balances and fiat values
5. **Fee estimation** — Network selector (if multi-chain), gas speed selector (slow/standard/fast), estimated fee in crypto + fiat
6. **Confirmation screen** — Summary with all details, edit buttons for each field
7. **Authentication** — Biometric/PIN confirmation
8. **Broadcast + status** — Pending animation → success screen with tx hash

**Receive Flow:**
1. **QR code display** — Large, centered, with wallet address below (copyable)
2. **Address display** — Truncated with expand option
3. **Network indicator** — Clear label of which network/address format
4. **Share options** — Copy, share via system share sheet
5. **Amount request** — Optional: set specific amount for payment request

### 1.4 QR Code Payment Patterns

**Technical Standards:**
- **BIP21** (Bitcoin): Address + amount + label in single QR
- **EIP-681** (EVM): Address + chain ID + amount + token + function call
- **UR (Uniform Resource)** format for hardware wallet communication

**QR Code Types:**
| Type | Use Case | Persistence |
|------|----------|-------------|
| Static QR | Receiving address | Permanent, reusable |
| Dynamic QR | Specific payment request | Temporary, includes amount/order |
| Payment QR | POS/in-store | Amount-encoded, time-limited |

**Implementation Recommendations:**
- Support both static (address-only) and dynamic (amount-encoded) QR
- Include chain/network identifier in QR to prevent cross-chain errors
- Camera permission flow with clear explanation
- Fallback: manual address paste with clipboard detection
- QR history for recent scan targets
- Customizable QR with branding support for merchant use

---

## 2. P2P Agent System

### 2.1 How Agent-Based Payment Systems Work

**Architecture Model:**
```
User A (Payer) → Agent Network → Agent (Local) → Agent Network → User B (Payee)
                        ↓
                    Escrow/Swap Layer
                        ↓
                   Settlement Chain
```

**Agent Roles:**
1. **Liquidity Agent** — Holds local currency reserves for crypto-to-fiat conversion
2. **Relay Agent** — Routes transactions across networks, optimizes paths
3. **Settlement Agent** — Finalizes on-chain settlement
4. **Dispute Agent** — Mediates failed or contested transactions

**AgentPay Reference Architecture (from open source):**
- mDNS-based local agent discovery
- libp2p stream negotiation for service terms
- Filecoin-style signed payment vouchers (off-chain)
- Multi-chain settlement: Ethereum, Algorand, Filecoin FEVM
- ERC-8004 on-chain agent registration (identity tokens)
- Reputation scoring and SLA monitoring

### 2.2 Agent Registration and Verification

**Registration Flow:**
1. Agent submits identity + proof of reserves
2. Smart contract registers agent with ERC-8004 identity token
3. Agent bonds collateral (stake for reputation)
4. Agent declares supported currencies, regions, fee structure
5. Verification: KYC/AML check, reserve audit, capacity test

**Trust Mechanisms:**
- On-chain reputation score (0-100 or similar)
- Transaction history and completion rate
- Response time metrics
- Dispute resolution history
- Collateral/stake as economic security

### 2.3 Transaction Routing Through Agents

**Routing Algorithm:**
1. User initiates payment → selects recipient and amount
2. System discovers available agents matching:
   - Geographic proximity (for local currency)
   - Supported token pair
   - Reputation threshold
   - Sufficient liquidity
3. Route optimization: minimize fees, maximize speed
4. Escrow lock on source chain
5. Agent performs swap/conversion
6. Delivery to recipient on destination chain
7. Settlement and release

**Key Design Decisions:**
- Single-hop (direct agent) vs multi-hop (relay chain)
- HTLC (Hash Time-Locked Contracts) for trustless atomic swaps
- Escrow timeout windows (configurable, typically 1-24 hours)
- Fee structure: fixed vs percentage vs hybrid

### 2.4 Dispute Resolution

**Dispute Types:**
1. Payment sent but not received
2. Incorrect amount delivered
3. Agent went offline mid-transaction
4. Double-spend attempt
5. Rate manipulation

**Resolution Flow:**
1. Dispute filed by either party
2. Evidence submission window (tx hashes, timestamps, screenshots)
3. Automated verification against on-chain records
4. If resolved: auto-refund or completion
5. If contested: escalation to dispute agent or DAO governance
6. Resolution enforced on-chain
7. Reputation impact on both parties

**Escalation Tiers:**
- Tier 1: Automated (rule-based, fast)
- Tier 2: Community arbiters (human review, moderate)
- Tier 3: DAO governance (full vote, slow, binding)

---

## 3. Earning Systems

### 3.1 How Earnings Accumulate

**Revenue Sources for Platform Participants:**
| Source | Description | Frequency |
|--------|-------------|-----------|
| Transaction fees | % of each transaction routed through agent | Per transaction |
| Liquidity provision | Yield from providing capital to pools | Continuous |
| Staking rewards | Block validation or governance staking | Epoch-based |
| Referral bonuses | Inviting new users/agents | One-time + recurring |
| Service fees | Payment processing, swap fees | Per transaction |
| Yield farming | Providing liquidity to DeFi protocols | Continuous |
| Task completion | Gig/work-based earnings | Per task |

**Accumulation Pattern:**
- Earnings accrue in real-time to wallet balance
- Pending vs confirmed earnings (like pending tx vs confirmed)
- Auto-compounding option for staking/yield earnings
- Daily/weekly/monthly summary views

### 3.2 Earning Breakdown Display

**Dashboard Earnings Widget:**
```
Total Earnings: $1,247.83
├── Transaction Fees: $423.15 (34%)
├── Liquidity Yield: $312.50 (25%)
├── Staking Rewards: $287.18 (23%)
├── Referral Bonuses: $150.00 (12%)
└── Other: $75.00 (6%)

Last 30 days: +$89.42 (7.7%)
[View Details →]
```

**Per-Earning Detail View:**
- Source and timestamp
- Amount in crypto + fiat equivalent
- Transaction hash (if applicable)
- Status (pending/confirmed)
- Running total for period

### 3.3 Withdrawal Flow Design

**Withdrawal Options:**
1. **To bank account** — ACH/Wire, 1-3 business days
2. **To crypto wallet** — On-chain transfer, instant to minutes
3. **To agent network** — Cash pickup via local agent
4. **To stablecoin** — USDC/USDT for DeFi use

**Withdrawal Flow:**
1. Select withdrawal method
2. Enter amount (with min/max limits displayed)
3. Select destination (saved bank, wallet address, agent location)
4. Review fees and estimated arrival
5. Confirm with biometric/PIN
6. Status tracking with notifications

**Anti-Fraud Measures:**
- Daily/weekly withdrawal limits
- New destination address cooldown (24-48 hours)
- Large withdrawal additional verification
- Velocity checks and anomaly detection

### 3.4 Tax Reporting Considerations

**Data Points to Track:**
- Transaction date/time (UTC)
- Transaction type (send, receive, swap, earn)
- Asset and amount
- Fair market value at time of transaction
- Counterparty address
- Network fees paid
- Realized/unrealized gains/losses

**Reporting Features:**
- Export to CSV/PDF for accountant
- Integration with tax software (Koinly, CoinTracker, etc.)
- Annual summary report
- Cost basis tracking (FIFO, LIFO, HIFO options)
- Jurisdiction-specific tax form generation

**Compliance Notes:**
- Track all taxable events (swaps, spending, earning)
- Stablecoin transactions may still be taxable events
- Gift/donation tracking
- Cross-border transaction reporting thresholds

---

## 4. Security Patterns

### 4.1 Seed Phrase Display/Backup Flow

**Onboarding Backup Flow:**
1. **Education screen** — Explain what seed phrase is, why it matters
2. **Generation** — Generate 12 or 24 word BIP39 phrase
3. **Display** — Show phrase in clear, numbered grid
   - Warning: no screenshots, no cloud, no photos
   - Copy button with clipboard warning
   - Timer to encourage writing before continuing
4. **Verification** — User must re-enter words in correct order
   - Partial reveal option (show 4-5 words, user fills rest)
   - Or random word selection (tap word 7, word 12, etc.)
5. **Backup confirmation** — User confirms they've stored it safely
6. **Optional encryption** — BIP39 passphrase (25th word) for extra security

**Best Practices:**
- Never display phrase again after initial backup (unless recovery)
- No cloud sync, no screenshots, no password manager storage
- Metal backup recommendation for durability
- Multiple location storage guidance (2-3 locations)
- Clear warnings about phishing sites requesting seed phrase

### 4.2 Key Storage Best Practices

**Software Wallet:**
- Keys stored in device secure enclave (iOS) or Keystore (Android)
- Encrypted at rest with device-level encryption
- Never transmitted over network in plaintext
- Background key access restricted

**Hardware Wallet:**
- Keys in secure element chip (never leaves device)
- All signing happens on-device
- Physical button confirmation required
- USB/Bluetooth communication encrypted

**Hybrid Approach (Recommended for SARAI):**
- Primary keys in device secure element
- Encrypted backup to user's cloud (encrypted client-side)
- Social recovery option (Shamir's Secret Sharing or multi-sig)
- Hardware wallet as optional enhanced security

### 4.3 Recovery Method Design

**Recovery Options (Ranked by Security):**

| Method | Security | Convenience | Use Case |
|--------|----------|-------------|----------|
| Seed phrase | Highest | Lowest | Full wallet recovery |
| Social recovery | High | Medium | Lost device, no seed phrase |
| Cloud backup (encrypted) | Medium | High | Quick restore on new device |
| Hardware wallet | Highest | Medium | Enhanced signing security |
| Passkey/BIOMETRIC | Medium-High | Highest | Daily access, not full recovery |

**Recovery Flow Design:**
1. **Device loss detection** — Alert system, remote lock option
2. **Recovery initiation** — "I lost my device" button on new install
3. **Identity verification** — Email + phone + biometric (if available)
4. **Recovery method selection** — Present available options
5. **Seed phrase entry** — Word-by-word input with validation
6. **Sync and restore** — Re-derive keys, sync balances
7. **Security checkup** — Review recent activity, revoke old sessions

### 4.4 Device Binding Patterns

**Device Binding Approaches:**
1. **Fingerprint binding** — Wallet tied to device biometric
2. **Hardware attestation** — Verify device integrity before key access
3. **Secure enclave binding** — Keys generated and stored in TEE
4. **Device certificate** — Unique per-device certificate for API access

**Multi-Device Strategy:**
- Primary device: full key access
- Secondary device: view-only or limited signing
- Recovery device: requires social consensus or seed phrase
- Hardware wallet: additional signing layer

**Security Considerations:**
- Device change requires re-authentication
- Suspicious device detection (new location, new device)
- Session management with timeout
- Remote session revocation

---

## 5. Practical Recommendations for SARAI Wallet

### 5.1 Architecture Decisions

**Wallet Type:** Non-custodial with optional custodial escrow for P2P agent transactions

**Supported Chains (Priority Order):**
1. Stellar (fast, low fees, SEP-30 recovery support)
2. Ethereum/EVM (broadest DeFi access)
3. Solana (high throughput, growing ecosystem)
4. Bitcoin (store of value, Lightning for payments)

**Account Model:** Smart contract wallets (ERC-4337 account abstraction)
- Enables social recovery without seed phrase dependency
- Gasless transactions for new users
- Batch operations and session keys
- Programmatic spending limits

### 5.2 P2P Agent Integration

**Agent Network Design:**
- Stellar SEP-30 for key recovery (MoneyGram model)
- Agent staking/collateral requirements
- Reputation system with on-chain attestations
- Escrow contracts for agent-mediated transactions
- Dispute resolution via multi-sig + timeout

**Agent Registration:**
- KYC verification for agents
- Minimum stake requirement (token + fiat reserves)
- Regional capacity matching
- Performance metrics tracking

### 5.3 Earning System Design

**Token Economics:**
- Transaction fee sharing (agent + platform)
- Staking rewards for governance participation
- Referral program with tiered rewards
- Yield optimization through DeFi integration

**Earning Display:**
- Real-time accrual with pending/confirmed separation
- Source breakdown with icons
- Historical performance charts
- Tax-ready export functionality

### 5.4 Security Implementation

**Key Management:**
- Device secure enclave for key storage
- BIP39 seed phrase with guided backup flow
- Optional BIP39 passphrase for enhanced security
- Social recovery via trusted contacts (3-of-5 multi-sig)

**Authentication:**
- Biometric primary (Face ID / fingerprint)
- PIN fallback
- 2FA via TOTP authenticator app (recommended over SMS)
- Session management with configurable timeout

**Recovery:**
- Primary: Seed phrase
- Secondary: Social recovery (trusted contacts)
- Tertiary: Cloud-encrypted backup (user-managed encryption key)
- Emergency: Platform-assisted recovery with identity verification

### 5.5 UI/UX Priorities

**Mobile-First Design:**
- Bottom navigation for core actions
- One-tap QR scan for payments
- Pull-to-refresh for balance updates
- Swipe actions for quick send/receive

**Key Screens:**
1. Home/Dashboard — balance + quick actions
2. Asset detail — token info + chart + actions
3. Send — recipient → amount → confirm
4. Receive — QR + address + share
5. Activity — transaction history + filters
6. Settings — security, preferences, support

**Accessibility:**
- WCAG 2.1 AA compliance
- Screen reader support
- High contrast mode
- Adjustable font sizes

---

## References

- Stripe: Non-Custodial Crypto Wallet Guide
- BeInCrypto: Non-Custodial Wallet Fundamentals
- Crossmint: Embedded Stablecoin Wallet Infrastructure
- AgentPay: Decentralized P2P Micropayment Channels (GitHub)
- AppZoro: P2P Payment App Development Guide
- Chainalysis: Bitcoin Loss Report 2024
- Figma: Crypto Wallet Seed Phrase Flow Design
- LogRocket: 2FA UX Patterns
- Bitget: QR Code Payment Trends 2026
- Spirit Capital: Crypto Wallet UX Best Practices
