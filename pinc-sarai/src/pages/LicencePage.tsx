import { useEffect } from 'react';
import ThemeBackground from '../components/theme/ThemeBackground';

export default function LicencePage() {
  useEffect(() => {
    document.title = 'Licence | PINC Platform';
  }, []);

  return (
    <div style={{ position: 'relative', minHeight: '100vh', padding: '2rem 1rem' }}>
      <ThemeBackground />
      <div style={{ maxWidth: 900, margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <header style={{ marginBottom: '2rem', textAlign: 'center' }}>
          <h1 style={{ fontFamily: 'monospace', fontSize: '2rem', fontWeight: 800, color: 'var(--theme-accent)', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>PINC Platform Licence</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Effective: 2026-01-01 | Version 3.0</p>
        </header>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>1. Definitions</h2>
          <div style={{ color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: '0.95rem' }}>
            <p style={{ marginBottom: '0.75rem' }}><strong>"PINC Platform"</strong> refers to the decentralized financial infrastructure, protocols, and associated software (including SARAI wallet) developed and maintained by the PINC Network.</p>
            <p style={{ marginBottom: '0.75rem' }}><strong>"SARAI"</strong> refers to the wallet application and user interface component of the PINC Platform.</p>
            <p style={{ marginBottom: '0.75rem' }}><strong>"User"</strong> refers to any individual or entity accessing or using the Platform.</p>
            <p style={{ marginBottom: '0.75rem' }}><strong>"Digital Assets"</strong> refers to cryptocurrencies, tokens, stablecoins, and other blockchain-based assets supported by the Platform.</p>
            <p style={{ marginBottom: '0.75rem' }}><strong>"Network"</strong> refers to the distributed node infrastructure powering the Platform.</p>
          </div>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>2. Grant of Licence</h2>
          <div style={{ color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: '0.95rem' }}>
            <p style={{ marginBottom: '0.75rem' }}>Subject to the terms of this Licence, PINC Platform grants you a worldwide, non-exclusive, non-transferable, revocable licence to:</p>
            <ul style={{ marginLeft: '1.5rem', marginBottom: '1rem' }}>
              <li style={{ marginBottom: '0.5rem' }}>Access and use the SARAI wallet application for personal or commercial purposes;</li>
              <li style={{ marginBottom: '0.5rem' }}>Interact with the PINC Network protocols for transaction processing, asset management, and decentralized finance operations;</li>
              <li style={{ marginBottom: '0.5rem' }}>Develop applications using the Platform's public APIs and SDKs;</li>
              <li style={{ marginBottom: '0.5rem' }}>Run validator or relay nodes as permitted by network consensus rules.</li>
            </ul>
            <p style={{ marginBottom: '0.75rem' }}>This licence does not grant you rights to: (a) modify, reverse engineer, or create derivative works of the core protocol; (b) use the PINC Platform or SARAI trademarks without written permission; (c) sublicense, lease, or distribute the Platform for malicious purposes.</p>
          </div>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>3. Open Source Components</h2>
          <div style={{ color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: '0.95rem' }}>
            <p style={{ marginBottom: '0.75rem' }}>The PINC Platform incorporates open-source software. The following components are licensed under their respective terms:</p>
            <ul style={{ marginLeft: '1.5rem', marginBottom: '1rem' }}>
              <li style={{ marginBottom: '0.5rem' }}><strong>Tauri</strong> — MIT Licence</li>
              <li style={{ marginBottom: '0.5rem' }}><strong>React</strong> — MIT Licence</li>
              <li style={{ marginBottom: '0.5rem' }}><strong>Rust / Cargo dependencies</strong> — Various (MIT, Apache-2.0, BSD-3-Clause)</li>
              <li style={{ marginBottom: '0.5rem' }}><strong>Solana SDK / Ethereum libraries</strong> — Apache-2.0 / MIT</li>
              <li style={{ marginBottom: '0.5rem' }}><strong>Framer Motion, Lucide, Zustand, Viem, Ethers</strong> — MIT Licence</li>
            </ul>
            <p style={{ marginBottom: '0.75rem' }}>Full dependency licences are available in the <code style={{ background: 'var(--bg-card)', padding: '0.1rem 0.3rem', borderRadius: 4, fontSize: '0.85rem' }}>dist/licences/</code> directory of each distribution.</p>
          </div>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>4. Proprietary Components</h2>
          <div style={{ color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: '0.95rem' }}>
            <p style={{ marginBottom: '0.75rem' }}>The following components are proprietary to PINC Platform and licensed under this Licence only:</p>
            <ul style={{ marginLeft: '1.5rem', marginBottom: '1rem' }}>
              <li style={{ marginBottom: '0.5rem' }}>PINC Network consensus protocol and node software</li>
              <li style={{ marginBottom: '0.5rem' }}>SARAI wallet UI/UX design, branding, and user experience flows</li>
              <li style={{ marginBottom: '0.5rem' }}>Multi-currency conversion engine and pricing algorithms</li>
              <li style={{ marginBottom: '0.5rem' }}>P2P agent coordination and reputation systems</li>
              <li style={{ marginBottom: '0.5rem' }}>Transaction fee optimization and routing logic</li>
            </ul>
            <p style={{ marginBottom: '0.75rem' }}>These components may not be copied, modified, distributed, or reverse engineered except as expressly permitted herein.</p>
          </div>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>5. User Obligations</h2>
          <div style={{ color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: '0.95rem' }}>
            <p style={{ marginBottom: '0.75rem' }}>You agree to:</p>
            <ul style={{ marginLeft: '1.5rem', marginBottom: '1rem' }}>
              <li style={{ marginBottom: '0.5rem' }}>Comply with all applicable laws and regulations in your jurisdiction;</li>
              <li style={{ marginBottom: '0.5rem' }}>Not use the Platform for illegal activities, money laundering, terrorism financing, or sanctions evasion;</li>
              <li style={{ marginBottom: '0.5rem' }}>Secure your private keys, recovery phrases, and authentication credentials;</li>
              <li style={{ marginBottom: '0.5rem' }}>Not attempt to attack, disrupt, or compromise the Network or other users;</li>
              <li style={{ marginBottom: '0.5rem' }}>Report security vulnerabilities via responsible disclosure (security@pinc.network).</li>
            </ul>
          </div>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>6. Disclaimer of Warranties</h2>
          <div style={{ color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: '0.95rem' }}>
            <p style={{ marginBottom: '0.75rem' }}>THE PLATFORM IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO:</p>
            <ul style={{ marginLeft: '1.5rem', marginBottom: '1rem' }}>
              <li style={{ marginBottom: '0.5rem' }}>Merchantability, fitness for a particular purpose, or non-infringement;</li>
              <li style={{ marginBottom: '0.5rem' }}>Uninterrupted, timely, secure, or error-free operation;</li>
              <li style={{ marginBottom: '0.5rem' }}>Accuracy, reliability, or completeness of any data, pricing, or conversion rates;</li>
              <li style={{ marginBottom: '0.5rem' }}>That defects will be corrected or that the Platform is free of viruses or harmful components.</li>
            </ul>
            <p style={{ marginBottom: '0.75rem' }}>DIGITAL ASSET TRANSACTIONS CARRY INHERENT RISKS INCLUDING TOTAL LOSS OF FUNDS. YOU ASSUME FULL RESPONSIBILITY FOR YOUR USE OF THE PLATFORM.</p>
          </div>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>7. Limitation of Liability</h2>
          <div style={{ color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: '0.95rem' }}>
            <p style={{ marginBottom: '0.75rem' }}>TO THE MAXIMUM EXTENT PERMITTED BY LAW, PINC PLATFORM SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOSS OF PROFITS, DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, ARISING FROM:</p>
            <ul style={{ marginLeft: '1.5rem', marginBottom: '1rem' }}>
              <li style={{ marginBottom: '0.5rem' }}>Your use or inability to use the Platform;</li>
              <li style={{ marginBottom: '0.5rem' }}>Unauthorized access to or alteration of your transmissions or data;</li>
              <li style={{ marginBottom: '0.5rem' }}>Statements or conduct of any third party on the Platform;</li>
              <li style={{ marginBottom: '0.5rem' }}>Any other matter relating to the Platform.</li>
            </ul>
            <p style={{ marginBottom: '0.75rem' }}>TOTAL LIABILITY SHALL NOT EXCEED THE GREATER OF: (A) FEES PAID BY YOU IN THE 12 MONTHS PRECEDING THE CLAIM; OR (B) $100 USD.</p>
          </div>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>8. Termination</h2>
          <div style={{ color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: '0.95rem' }}>
            <p style={{ marginBottom: '0.75rem' }}>This Licence terminates automatically if you breach any term. PINC Platform may suspend or terminate your access at any time for violations. Upon termination, your licence rights cease immediately. Sections 3, 4, 6, 7, 9, and 10 survive termination.</p>
          </div>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>9. Governing Law & Dispute Resolution</h2>
          <div style={{ color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: '0.95rem' }}>
            <p style={{ marginBottom: '0.75rem' }}>This Licence is governed by the laws of the Republic of Estonia (EU), without regard to conflict of laws principles. Disputes shall be resolved by binding arbitration in Tallinn, Estonia, in English, under the Rules of the Arbitration Institute of the Stockholm Chamber of Commerce. Notwithstanding the foregoing, PINC Platform may seek injunctive relief in any competent jurisdiction.</p>
          </div>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>10. General Provisions</h2>
          <div style={{ color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: '0.95rem' }}>
            <p style={{ marginBottom: '0.75rem' }}><strong>Entire Agreement:</strong> This Licence constitutes the entire agreement between you and PINC Platform.</p>
            <p style={{ marginBottom: '0.75rem' }}><strong>Severability:</strong> If any provision is unenforceable, the remainder remains in effect.</p>
            <p style={{ marginBottom: '0.75rem' }}><strong>No Waiver:</strong> Failure to enforce a right does not waive it.</p>
            <p style={{ marginBottom: '0.75rem' }}><strong>Assignment:</strong> You may not assign this Licence. PINC Platform may assign freely.</p>
            <p style={{ marginBottom: '0.75rem' }}><strong>Notices:</strong> Notices to you via the Platform UI or email. Notices to PINC Platform at legal@pinc.network.</p>
            <p style={{ marginBottom: '0.75rem' }}><strong>Export Controls:</strong> You comply with all export control laws. The Platform may not be used in embargoed jurisdictions.</p>
          </div>
        </section>

        <section style={{ marginBottom: '2rem', padding: '1.5rem', background: 'rgba(212,175,55,0.08)', border: '1px solid var(--theme-accent)', borderRadius: 12 }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--theme-accent)', marginBottom: '1rem' }}>Appendix A: Stablecoin Conversion & Fee Schedule</h2>
          <div style={{ color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: '0.95rem' }}>
            <p style={{ marginBottom: '0.75rem' }}><strong>55 Supported Stablecoins:</strong> USDT, USDC, DAI, BUSD, TUSD, USDP, GUSD, HUSD, USDK, USDS, USDX, MIM, LUSD, USDD, USDP, EURS, EURT, EURC, stETH, rETH, cbETH, wstETH, sfrxETH, mETH, WBTC, renBTC, hBTC, sBTC, tBTC, WBTC.e, BTCB, and 25 additional algorithmic/regional stablecoins.</p>
            <p style={{ marginBottom: '0.75rem' }}><strong>Conversion Model:</strong> 1:1 peg maintenance with dynamic haircut. Example: 1 USDT → 0.98 USD (2% spread). User receives 0.98 USD worth of target asset. Platform retains 2-3% spread as revenue.</p>
            <p style={{ marginBottom: '0.75rem' }}><strong>Withdrawal Pricing:</strong> User requests 1 USD withdrawal → Platform provides 0.97-0.98 USD equivalent (2-3% below spot). This spread covers network fees, liquidity provision, and platform revenue.</p>
            <p style={{ marginBottom: '0.75rem' }}><strong>Deposit Crediting:</strong> 1 USD deposit → Credited as 1.00 USD internal balance. No haircut on deposits.</p>
            <p style={{ marginBottom: '0.75rem' }}><strong>Cross-Chain Routing:</strong> Optimal path selection across 8+ networks (Ethereum, Solana, BSC, Polygon, Arbitrum, Optimism, Base, Tron). Fees included in spread.</p>
          </div>
        </section>

        <footer style={{ textAlign: 'center', marginTop: '3rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
          <p>PINC Platform — Decentralized Finance Infrastructure</p>
          <p><a href="mailto:legal@pinc.network" style={{ color: 'var(--theme-accent)' }}>legal@pinc.network</a> | <a href="https://pinc.network" style={{ color: 'var(--theme-accent)' }}>pinc.network</a></p>
        </footer>
      </div>
    </div>
  );
}