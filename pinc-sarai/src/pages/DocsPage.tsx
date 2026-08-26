import { useEffect } from 'react';
import ThemeBackground from '../components/theme/ThemeBackground';

export default function DocsPage() {
  useEffect(() => {
    document.title = 'Documentation | PINC Platform';
  }, []);

  const docSections = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      items: [
        { title: 'Installation', desc: 'Download and install SARAI Wallet for your platform', href: '/apps' },
        { title: 'Quick Start Guide', desc: 'Create your first wallet, receive and send transactions', href: '/docs/quickstart' },
        { title: 'Security Setup', desc: 'Enable biometric auth, backup your seed phrase, set up PIN', href: '/docs/security-setup' },
        { title: 'Network Selection', desc: 'Choose between Mainnet, Testnet, and Devnet', href: '/docs/networks' }
      ]
    },
    {
      id: 'wallet-features',
      title: 'Wallet Features',
      items: [
        { title: 'Multi-Currency Support', desc: 'Manage 55+ stablecoins and 200+ tokens across 8 networks', href: '/docs/multi-currency' },
        { title: 'Send & Receive', desc: 'Transaction creation, fee estimation, address book', href: '/docs/send-receive' },
        { title: 'Cross-Chain Swaps', desc: 'Atomic swaps between Ethereum, Solana, BSC, Polygon, and more', href: '/docs/cross-chain' },
        { title: 'P2P Trading', desc: 'Peer-to-peer exchange with escrow and reputation system', href: '/docs/p2p' },
        { title: 'Staking & Yield', desc: 'Native staking, liquid staking, and DeFi yield strategies', href: '/docs/staking' },
        { title: 'Hardware Wallets', desc: 'Ledger, Trezor, Keystone, and GridPlus integration', href: '/docs/hardware' }
      ]
    },
    {
      id: 'developers',
      title: 'Developers',
      items: [
        { title: 'API Reference', desc: 'REST and WebSocket APIs for wallet and network interaction', href: '/docs/api' },
        { title: 'SDKs', desc: 'TypeScript, Rust, and Python SDKs for building on PINC', href: '/docs/sdks' },
        { title: 'Smart Contracts', desc: 'Core contract addresses, ABIs, and integration guides', href: '/docs/contracts' },
        { title: 'Running a Node', desc: 'Validator and relay node setup, staking requirements', href: '/docs/nodes' },
        { title: 'Building from Source', desc: 'Compile SARAI Wallet and PINC node from source code', href: '/docs/building' }
      ]
    },
    {
      id: 'platform',
      title: 'Platform',
      items: [
        { title: 'Architecture', desc: 'System design, consensus mechanism, and network topology', href: '/docs/architecture' },
        { title: 'Consensus', desc: 'Proof-of-Stake with BFT finality, slashing, and rewards', href: '/docs/consensus' },
        { title: 'Governance', desc: 'On-chain governance, proposals, and voting mechanisms', href: '/docs/governance' },
        { title: 'Economics', desc: 'Tokenomics, fee structure, and incentive alignment', href: '/docs/economics' },
        { title: 'Licence', desc: 'Full legal licence and terms of use', href: '/licence' }
      ]
    }
  ];

  return (
    <div style={{ position: 'relative', minHeight: '100vh', padding: '2rem 1rem' }}>
      <ThemeBackground />
      <div style={{ maxWidth: 900, margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <header style={{ marginBottom: '2rem', textAlign: 'center' }}>
          <h1 style={{ fontFamily: 'monospace', fontSize: '2rem', fontWeight: 800, color: 'var(--theme-accent)', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>Documentation</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Comprehensive guides for users, developers, and node operators</p>
        </header>

        {docSections.map(section => (
          <section key={section.id} style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--theme-accent)' }}>{section.id.toUpperCase()}</span>
              {section.title}
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.75rem' }}>
              {section.items.map((item, i) => (
                <a key={i} href={item.href} style={{ display: 'block', padding: '1rem', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, textDecoration: 'none', transition: 'all 0.2s', color: 'inherit' }}>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem', fontSize: '0.9rem' }}>{item.title}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{item.desc}</div>
                </a>
              ))}
            </div>
          </section>
        ))}

        <section style={{ marginBottom: '2rem', padding: '1.5rem', background: 'rgba(212,175,55,0.08)', border: '1px solid var(--theme-accent)', borderRadius: 12 }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--theme-accent)', marginBottom: '1rem' }}>Building from Source</h2>
          <div style={{ color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: '0.9rem' }}>
            <pre style={{ background: 'var(--bg-elevated)', padding: '1rem', borderRadius: 8, overflow: 'auto', fontSize: '0.75rem', marginBottom: '1rem', border: '1px solid var(--border)' }}>
{`# Prerequisites
# - Node.js 20+ (https://nodejs.org)
# - Rust 1.75+ (https://rustup.rs)
# - Git

# Clone repository
git clone https://github.com/pinc-network/pinc-sarai
cd pinc-sarai

# Install Node dependencies
npm install

# Build frontend assets
npm run build

# Build desktop (Linux/macOS/Windows)
cd src-tauri
cargo tauri build

# Build Android
export ANDROID_HOME=$HOME/Android/Sdk
export NDK_HOME=$ANDROID_HOME/ndk/27.0.12077973
export ANDROID_NDK_HOME=$NDK_HOME
npx tauri android build --target aarch64

# Output locations:
# Linux: src-tauri/target/release/bundle/appimage/
# Windows: src-tauri/target/x86_64-pc-windows-msvc/release/bundle/msi/
# macOS: src-tauri/target/aarch64-apple-darwin/release/bundle/dmg/
# Android: src-tauri/gen/android/app/build/outputs/apk/release/`}
            </pre>
            <p>Platform-specific requirements: <a href="/docs/building#platform-specific" style={{ color: 'var(--theme-accent)' }}>Documentation → Building → Platform Specific</a></p>
          </div>
        </section>

        <section style={{ marginBottom: '2rem', padding: '1.5rem', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12 }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem' }}>Useful Links</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <a href="https://github.com/pinc-network/pinc-sarai" target="_blank" rel="noopener noreferrer" style={{ padding: '1rem', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, textDecoration: 'none', color: 'var(--text-primary)' }}>
              <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>GitHub Repository</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Source code, issues, releases</div>
            </a>
            <a href="https://github.com/pinc-network/pinc-sarai/discussions" target="_blank" rel="noopener noreferrer" style={{ padding: '1rem', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, textDecoration: 'none', color: 'var(--text-primary)' }}>
              <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Discussions</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Community Q&A, feature requests</div>
            </a>
            <a href="https://discord.gg/pinc-network" target="_blank" rel="noopener noreferrer" style={{ padding: '1rem', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, textDecoration: 'none', color: 'var(--text-primary)' }}>
              <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Discord Community</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Real-time chat, support</div>
            </a>
            <a href="/security" style={{ padding: '1rem', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, textDecoration: 'none', color: 'var(--text-primary)' }}>
              <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Security & Audits</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Bug bounty, responsible disclosure</div>
            </a>
          </div>
        </section>

        <footer style={{ textAlign: 'center', marginTop: '3rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
          <p>PINC Platform Documentation</p>
          <p><a href="mailto:docs@pinc.network" style={{ color: 'var(--theme-accent)' }}>docs@pinc.network</a> | <a href="https://github.com/pinc-network/pinc-sarai/edit/main/docs" style={{ color: 'var(--theme-accent)' }}>Edit on GitHub</a></p>
        </footer>
      </div>
    </div>
  );
}