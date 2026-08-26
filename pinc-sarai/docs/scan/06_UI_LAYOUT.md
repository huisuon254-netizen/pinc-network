# Agent 6 — UI/LAYOUT Exhaustive Report
**File:** `src/components/sarai/SaraiPage.tsx:1` 922L 8 tabs + `src/components/wallet/WalletPage.tsx:27`, `SeedPhraseBackup.tsx:91`, `payment/PaymentPage.tsx:742` orphan, `src/types/index.ts:160`, `src/store/appStore.ts:376`, `src/i18n 645L 3140L`, `globals.css:368`, `Sidebar.tsx:70`, `DashboardPage.tsx:63`, `NodeHome.tsx:523`, `UX_RESEARCH.md:1227`, `public/assets 22`

## SaraiPage 922L
- imports react framer-motion 26 lucide icons invoke useAppStore
- Tab 'dashboard'|'transactions'|'payments'|'crypto'|'escrow'|'agent'|'notifications'|'history' TABS 8 labels hardcoded English no t()
- formatAmount toLocale US only, formatTime Just now<h 1h etc, typeIcon/typeColor, statusBadge rgba neon-green/yellow/red, notifIcon
- EmptyState center padding 3rem icon muted 0.3 title 0.85 secondary subtitle 0.75 muted no CTA
- DashboardTab props balance? transactions any[] derived counts, grid 220px 4 cards motion stagger bottom gradient, counts pills 140px
- TransactionsTab TxFilter all|deposit|withdrawal|transfer|earning useMemo filter bar 5 buttons active electric-blue list gap .375 cards 32px circle right amount +/- green/red, no pagination virtualization date grouping.
- PaymentsTab interface PaymentMethod 9 hardcoded wise #00b9ff 40+ Low 1-2d both, remitly #4caf50, revolut #eb008b, paypal #003087 200+, connectpay #6c5ce7, wisebiz #0a6e4a, airwallex #0052ff, payoneer #ff6600, ofx #005b96 withdrawal only — grid 260px click border method.color invoke cmd_create_payment provider type amount parseFloat no validation NaN negative silent catch{} modal overlay 60 z100 card 420 width toggle deposit/withdraw dead href "#"
- CryptoTab wallets BTC bc1q5... min0.001 fee0.0005 Bitcoin, ETH 0x742d... 0.01 0.003 ERC-20, USDT same ETH 10 5 same, coinColors #f7931a #627eea #26a17b, state cryptoAmount cryptoSide deposit|withdrawal selectedCoin copiedAddr, copyAddr clipboard 2s, handleCryptoSubmit cmd_crypto_transaction missing, grid 1fr1fr left deposit address+copy+QR 120 icon placeholder Network/Min, right withdrawal destination uncontrolled no value fees Network submit Withdraw no validation responsive no media.
- EscrowTab escrowStep create|fund|release|dispute active blue, wrapper motion, Create counterparty PINC ID amount USD fees 0.5% static timelock 24h static button no onClick, Fund hardcoded Contract $250 Balance $1234.56, Release hardcoded PINC-742 $250 node_8f3a 18h42m Dispute/Release no handlers, Dispute select Item not received textarea Submit no handler, no invoke create/fund/release/dispute all mock.
- P2PAgentTab agentSearch unused agentPrompt Local methods M-Pesa GCash Paytm Pix PromptPay Mobile Money left list cards hover border only, right Prompt textarea Execute no invoke chips Best rate etc setPrompt, Nearby JK john_kinuthia Nairobi 98% trust Online dot Message/Request Trade hardcoded no list.
- NotificationsTab notifications any[] Empty Bell list gap .375 card flex borderLeft 1/3 if !read circle 32 middle type+amount +/- from_to right timestamp dot 6 blue source store fallback stale.
- HistoryTab search useMemo includes description/from/to/type/id, controls Search input Export no handler, Empty, table Type/Amount/Status/From/To/Description/Date ellipsis no tooltip Amount mono green/red, no pagination sort virtual scroll.
- SaraiPage activeTab dashboard balance history notifications loading boolean useEffect Promise.allSettled cmd_get_wallet_balance pending vs total_earned mismatch, cmd_get_transactions, cmd_get_wallet_history + store.notifications fallback swallow catch no polling interval error toast, layout padding 2rem max 1100 header DECENTRALIZED FINANCE SYSTEM muted SARAI 1.25 weight700 badge v2.0 vs sidebar v3.0 mismatch tab bar flex gap .25 bg secondary wrap nowrap overflowX buttons 0.7rem active electric-blue content AnimatePresence mode wait.

## WalletPage 27L header INTERNAL WALLET PHASE 7 badge PENDING card PHASE 7 Payment & Escrow System non-custodial badges Internal Balances etc orphan never routed vs Sarai.

## SeedPhraseBackup 91L useI18n t(), props seedPhrase onComplete onSkip copied confirmed seedWords split space motion y20 bg-gray-900/90 inconsistent vs pinc-card grid 3 cols bg-gray-700 rounded copy emoji hardcoded Skip not i18n Save disabled gradient Continue no verification shuffle.

## PaymentPage 742L legacy alternative AnimatedBalance requestAnimationFrame 1200ms cubic, QRCode svg pseudoRandom seeded address finder pattern timing, StatusBadge, TypeIcon, CopyButton, main PaymentPage balance 1247.50 hardcoded mock MOCK_TRANSACTIONS 7 deposits withdrawals etc not backend activeTab send|receive|deposit|withdraw depositAgent crypto toggle etc all mocked timeout 1500ms no invoke no i18n Tailwind purple/pink vs neon-blue dual design orphan.

## types/index.ts WalletBalance {balance,pending,total_earned} pending ambiguous, Transaction deposit|withdrawal|transfer|earning amount status completed|pending|failed from/to timestamp description mismatched vs Rust, WalletNotification incoming|outgoing|completed|failed, DashTab includes sarai, AppNotification generic mismatch.

## appStore 376L walletBalance Transaction|null 177 refreshWallet invoke cmd_get_wallet_balance synthesize pending sum total_earned=balance catch{} silent not used by Sarai, refreshHomeStats 256 walletRaw synthes same, persist only settings identity activeTab not wallet, no polling.

## i18n index 645 12 langs wallet.balance etc, locales.json 1850 20 locales nested payment deposit withdraw but two systems dead Sarai never t() hardcoded English.

## App.tsx 17L screen initialize splash|login|dashboard else DashboardPage, main.tsx HashRouter ErrorBoundary globals.css, globals.css 368L font JetBrains Mono Inter Space Grotesk vars bg #0a0a0f border #1e1e3a electric-blue #00d4ff etc pinc-card btn input badges app-shell flex sidebar 190px width sidebar-nav-item 0.7rem mono active rgba 0,212,255 0.08 border-left, main flex1 overflow auto hamburger hidden media 767 sidebar fixed left -200 transition, not covering Sarai grids responsive gap.

## Sidebar 70L FullDashTab 10 entries sarai Wallet 15 nav active page, props activePage setActivePage nodeId online peerCount renders logo header version v3.0 node dot online/offline.

## DashboardPage 63L refreshNodeStatus interval 15s not wallet, renderContent switch sarai→SaraiPage, NodeHome walletEarnings totalEarnings 10 StatCards WALLET BALANCE neongreen etc grid 160px.

## public/assets 22 images sounds fonts not wired to Sarai.

## UX_RESEARCH 1227 button states focus-visible missing, Toast aria-live missing, ConfirmDialog missing, Form Zod missing, polling vs websocket critique, EmptyState lacking, immediate wins not implemented.

## Coverage: Dashboard counts ✅ but no asset list, Transactions partial, Payments 9 providers stub, Crypto static, Escrow mock, P2P static, Notifications fallback, History no export.

