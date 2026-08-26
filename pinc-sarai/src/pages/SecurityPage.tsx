import { useEffect } from 'react';
import ThemeBackground from '../components/theme/ThemeBackground';

export default function SecurityPage() {
  useEffect(() => {
    document.title = 'Security | PINC Platform';
  }, []);

  return (
    <div style={{ position: 'relative', minHeight: '100vh', padding: '2rem 1rem' }}>
      <ThemeBackground />
      <div style={{ maxWidth: 900, margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <header style={{ marginBottom: '2rem', textAlign: 'center' }}>
          <h1 style={{ fontFamily: 'monospace', fontSize: '2rem', fontWeight: 800, color: 'var(--theme-accent)', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>Security</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>PINC Platform security architecture, audits, and responsible disclosure</p>
        </header>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Architecture Overview</h2>
          <div style={{ color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: '0.95rem' }}>
            <p style={{ marginBottom: '0.75rem' }}>PINC Platform implements a defense-in-depth security model across all layers:</p>
            <ul style={{ marginLeft: '1.5rem', marginBottom: '1rem' }}>
              <li style={{ marginBottom: '0.5rem' }}><strong>Client-Side:</strong> Private keys never leave the device. Encrypted storage using OS keychain/Keystore. Biometric authentication (Face ID, Touch ID, Windows Hello, Android BiometricPrompt).</li>
              <li style={{ marginBottom: '0.5rem' }}><strong>Network Layer:</strong> All P2P communication encrypted with Noise protocol. Certificate pinning for API endpoints. Tor/.onion support for metadata privacy.</li>
              <li style={{ marginBottom: '0.5rem' }}><strong>Protocol Layer:</strong> Formal verification of consensus critical paths. Slashing conditions for validator misbehavior. Rate limiting and DoS protection at consensus layer.</li>
              <li style={{ marginBottom: '0.5rem' }}><strong>Smart Contracts:</strong> Audited by Trail of Bits and Sigma Prime. Upgradeability via timelock multisig (7-day delay). Emergency pause circuit breaker.</li>
            </ul>
          </div>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Audits & Assessments</h2>
          <div style={{ color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: '0.95rem' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)' }}>
                  <th style={{ textAlign: 'left', padding: '0.75rem', color: 'var(--text-primary)' }}>Component</th>
                  <th style={{ textAlign: 'left', padding: '0.75rem', color: 'var(--text-primary)' }}>Auditor</th>
                  <th style={{ textAlign: 'left', padding: '0.75rem', color: 'var(--text-primary)' }}>Date</th>
                  <th style={{ textAlign: 'left', padding: '0.75rem', color: 'var(--text-primary)' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '0.75rem' }}>PINC Consensus Core</td>
                  <td style={{ padding: '0.75rem' }}>Trail of Bits</td>
                  <td style={{ padding: '0.75rem' }}>2025-11</td>
                  <td style={{ padding: '0.75rem', color: 'var(--neon-green)' }}>Passed</td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '0.75rem' }}>SARAI Wallet (Rust/Tauri)</td>
                  <td style={{ padding: '0.75rem' }}>Sigma Prime</td>
                  <td style={{ padding: '0.75rem' }}>2025-12</td>
                  <td style={{ padding: '0.75rem', color: 'var(--neon-green)' }}>Passed</td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '0.75rem' }}>Stablecoin Conversion Engine</td>
                  <td style={{ padding: '0.75rem' }}>OpenZeppelin</td>
                  <td style={{ padding: '0.75rem' }}>2026-01</td>
                  <td style={{ padding: '0.75rem', color: 'var(--theme-accent)' }}>In Progress</td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '0.75rem' }}>P2P Agent Protocol</td>
                  <td style={{ padding: '0.75rem' }}>Cure53</td>
                  <td style={{ padding: '0.75rem' }}>2026-02</td>
                  <td style={{ padding: '0.75rem', color: 'var(--theme-accent)' }}>Scheduled</td>
                </tr>
              </tbody>
            </table>
            <p style={{ marginTop: '1rem' }}>Full audit reports available at <a href="https://github.com/pinc-network/audits" style={{ color: 'var(--theme-accent)' }}>github.com/pinc-network/audits</a>.</p>
          </div>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Bug Bounty & Responsible Disclosure</h2>
          <div style={{ color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: '0.95rem' }}>
            <p style={{ marginBottom: '0.75rem' }}>PINC Platform operates a bug bounty program via Immunefi. We encourage responsible disclosure of security vulnerabilities.</p>
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '1.5rem', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem' }}>Report a Vulnerability</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Email (PGP Encrypted)</div>
                  <div style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}><a href="mailto:security@pinc.network" style={{ color: 'var(--theme-accent)' }}>security@pinc.network</a></div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>PGP: <a href="/security/pinc-security.pgp" style={{ color: 'var(--theme-accent)' }}>Download Key</a></div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Bug Bounty Platform</div>
                  <div style={{ fontSize: '0.85rem' }}><a href="https://immunefi.com/bounty/pinc-network" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--theme-accent)' }}>immunefi.com/bounty/pinc-network</a></div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Up to $100,000 for critical bugs</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Response SLA</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--neon-green)' }}>Initial triage: 24 hours</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Fix target: 90 days (critical: 14 days)</div>
                </div>
              </div>
            </div>
            <p style={{ marginBottom: '0.75rem' }}><strong>Scope:</strong> Smart contracts, wallet applications, P2P protocol, consensus, cryptography, key management.</p>
            <p style={{ marginBottom: '0.75rem' }}><strong>Out of Scope:</strong> Social engineering, physical attacks, DoS on public endpoints (rate limited), third-party integrations.</p>
            <p style={{ marginBottom: '0.75rem' }}><strong>Safe Harbor:</strong> We will not pursue legal action against researchers who follow responsible disclosure, act in good faith, and do not access user data.</p>
          </div>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Cryptographic Primitives</h2>
          <div style={{ color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: '0.95rem' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)' }}>
                  <th style={{ textAlign: 'left', padding: '0.75rem', color: 'var(--text-primary)' }}>Purpose</th>
                  <th style={{ textAlign: 'left', padding: '0.75rem', color: 'var(--text-primary)' }}>Algorithm</th>
                  <th style={{ textAlign: 'left', padding: '0.75rem', color: 'var(--text-primary)' }}>Library</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '0.75rem' }}>Key Derivation</td>
                  <td style={{ padding: '0.75rem' }}>Argon2id (memory-hard)</td>
                  <td style={{ padding: '0.75rem' }}>argon2 (Rust)</td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '0.75rem' }}>Encryption (at rest)</td>
                  <td style={{ padding: '0.75rem' }}>XChaCha20-Poly1305</td>
                  <td style={{ padding: '0.75rem' }}>libsodium / sodiumoxide</td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '0.75rem' }}>Signatures</td>
                  <td style={{ padding: '0.75rem' }}>Ed25519 / secp256k1</td>
                  <td style={{ padding: '0.75rem' }}>ed25519-dalek / k256</td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '0.75rem' }}>Key Agreement</td>
                  <td style={{ padding: '0.75rem' }}>X25519 (Noise IK)</td>
                  <td style={{ padding: '0.75rem' }}>snow (Noise framework)</td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '0.75rem' }}>Hashing</td>
                  <td style={{ padding: '0.75rem' }}>BLAKE3 / SHA-256</td>
                  <td style={{ padding: '0.75rem' }}>blake3 / sha2</td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '0.75rem' }}>Randomness</td>
                  <td style={{ padding: '0.75rem' }}>ChaCha20 (CSPRNG)</td>
                  <td style={{ padding: '0.75rem' }}>rand_chacha / getrandom</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Key Management</h2>
          <div style={{ color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: '0.95rem' }}>
            <p style={{ marginBottom: '0.75rem' }}>SARAI uses hierarchical deterministic (HD) key derivation (BIP-44/BIP-32/BIP-39):</p>
            <ul style={{ marginLeft: '1.5rem', marginBottom: '1rem' }}>
              <li style={{ marginBottom: '0.5rem' }}>Master seed: 256-bit entropy (24-word BIP-39 mnemonic)</li>
              <li style={{ marginBottom: '0.5rem' }}>Derivation path: m/44'/coin_type'/account'/change/address_index</li>
              <li style={{ marginBottom: '0.5rem' }}>Coin types: 60 (Ethereum), 501 (Solana), 195 (Tron), 60+ (EVM chains)</li>
              <li style={{ marginBottom: '0.5rem' }}>Encrypted storage: Master key encrypted with user passphrase + device-bound key (Secure Enclave / TEE / StrongBox)</li>
              <li style={{ marginBottom: '0.5rem' }}>Backup: Encrypted QR code export, Shamir Secret Sharing (SLIP-39) optional</li>
            </ul>
          </div>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Incident Response</h2>
          <div style={{ color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: '0.95rem' }}>
            <p style={{ marginBottom: '0.75rem' }}>In the event of a security incident:</p>
            <ol style={{ marginLeft: '1.5rem', marginBottom: '1rem' }}>
              <li style={{ marginBottom: '0.5rem' }}>Detection: Automated monitoring (Prometheus/Grafana) + community reports</li>
              <li style={{ marginBottom: '0.5rem' }}>Triage: Security team assesses severity (CVSS 4.0)</li>
              <li style={{ marginBottom: '0.5rem' }}>Containment: Emergency pause / circuit breaker if protocol-level</li>
              <li style={{ marginBottom: '0.5rem' }}>Resolution: Patch development, testing, coordinated disclosure</li>
              <li style={{ marginBottom: '0.5rem' }}>Communication: Transparent post-mortem within 30 days</li>
            </ol>
            <p style={{ marginBottom: '0.75rem' }}>Security advisories published at <a href="https://github.com/pinc-network/security-advisories" style={{ color: 'var(--theme-accent)' }}>github.com/pinc-network/security-advisories</a>.</p>
          </div>
        </section>

        <footer style={{ textAlign: 'center', marginTop: '3rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
          <p>PINC Platform Security Team</p>
          <p><a href="mailto:security@pinc.network" style={{ color: 'var(--theme-accent)' }}>security@pinc.network</a> | <a href="https://pinc.network/security" style={{ color: 'var(--theme-accent)' }}>pinc.network/security</a></p>
        </footer>
      </div>
    </div>
  );
}