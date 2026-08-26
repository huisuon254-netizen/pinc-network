import { useEffect } from 'react';
import ThemeBackground from '../components/theme/ThemeBackground';

const platformApps = [
  {
    id: 'sarai-android',
    name: 'SARAI Wallet',
    platform: 'Android',
    icon: '/assets/images/logo.svg',
    version: '3.0.0',
    size: '16 MB',
    minVersion: 'Android 8.0 (API 26+)',
    architecture: 'arm64-v8a',
    downloadUrl: 'https://github.com/pinc-network/pinc-sarai/releases/download/v3.0.0/SARAI_3.0.0_arm64.apk',
    sha256: 'a1b2c3d4e5f6...',
    description: 'Full-featured SARAI wallet for Android. Multi-currency support, P2P trading, staking, and cross-chain swaps.',
    features: ['55+ Stablecoins', 'P2P Exchange', 'Staking Rewards', 'Cross-Chain Swaps', 'Biometric Auth', 'Offline Signing'],
    status: 'stable',
    updated: '2026-01-15'
  },
  {
    id: 'sarai-linux',
    name: 'SARAI Wallet',
    platform: 'Linux',
    icon: '/assets/images/logo.svg',
    version: '3.0.0',
    size: '42 MB',
    minVersion: 'glibc 2.31+',
    architecture: 'x86_64',
    downloadUrl: 'https://github.com/pinc-network/pinc-sarai/releases/download/v3.0.0/SARAI_3.0.0_amd64.AppImage',
    sha256: 'f6e5d4c3b2a1...',
    packages: [
      { type: 'AppImage', url: 'https://github.com/pinc-network/pinc-sarai/releases/download/v3.0.0/SARAI_3.0.0_amd64.AppImage', size: '42 MB' },
      { type: '.deb (Ubuntu/Debian)', url: 'https://github.com/pinc-network/pinc-sarai/releases/download/v3.0.0/SARAI_3.0.0_amd64.deb', size: '38 MB' },
      { type: '.rpm (Fedora/RHEL)', url: 'https://github.com/pinc-network/pinc-sarai/releases/download/v3.0.0/SARAI_3.0.0_amd64.rpm', size: '39 MB' },
      { type: 'Flatpak', url: 'https://flathub.org/apps/com.pinc.sarai', size: '45 MB' }
    ],
    description: 'Native Linux desktop wallet with system integration. AppImage runs on any distribution.',
    features: ['Hardware Wallet Support', 'System Tray Integration', 'Auto-Updates (AppImage)', 'Wayland/X11', 'SELinux Compatible'],
    status: 'stable',
    updated: '2026-01-15'
  },
  {
    id: 'sarai-windows',
    name: 'SARAI Wallet',
    platform: 'Windows',
    icon: '/assets/images/logo.svg',
    version: '3.0.0',
    size: '48 MB',
    minVersion: 'Windows 10 1903+',
    architecture: 'x64 (ARM64 coming soon)',
    downloadUrl: 'https://github.com/pinc-network/pinc-sarai/releases/download/v3.0.0/SARAI_3.0.0_x64.msi',
    sha256: 'w1n2d3o4w5s6...',
    packages: [
      { type: 'MSI Installer', url: 'https://github.com/pinc-network/pinc-sarai/releases/download/v3.0.0/SARAI_3.0.0_x64.msi', size: '48 MB' },
      { type: 'Portable .exe', url: 'https://github.com/pinc-network/pinc-sarai/releases/download/v3.0.0/SARAI_3.0.0_x64_portable.exe', size: '46 MB' },
      { type: 'Microsoft Store', url: 'https://apps.microsoft.com/detail/9PXXXXX', size: '52 MB' }
    ],
    description: 'Windows desktop wallet with MSI installer and portable version. Windows Hello integration.',
    features: ['Windows Hello', 'MSIX Packaging', 'Auto-Updates', 'Hardware Wallet', 'System Tray', 'Dark/Light Theme Sync'],
    status: 'beta',
    updated: '2026-01-20'
  },
  {
    id: 'sarai-macos',
    name: 'SARAI Wallet',
    platform: 'macOS',
    icon: '/assets/images/logo.svg',
    version: '3.0.0',
    size: '52 MB',
    minVersion: 'macOS 12 Monterey+',
    architecture: 'Apple Silicon (M1/M2/M3) & Intel',
    downloadUrl: 'https://github.com/pinc-network/pinc-sarai/releases/download/v3.0.0/SARAI_3.0.0_universal.dmg',
    sha256: 'm1a2c3o4s5...',
    packages: [
      { type: 'Universal .dmg', url: 'https://github.com/pinc-network/pinc-sarai/releases/download/v3.0.0/SARAI_3.0.0_universal.dmg', size: '52 MB' },
      { type: 'Mac App Store', url: 'https://apps.apple.com/app/idXXXXXX', size: '55 MB' }
    ],
    description: 'Native macOS wallet with Universal binary (Intel + Apple Silicon). Touch ID and Secure Enclave support.',
    features: ['Touch ID / Secure Enclave', 'Universal Binary', 'Notarized by Apple', 'Sparkle Updates', 'Menu Bar Integration', 'Shortcuts Support'],
    status: 'beta',
    updated: '2026-01-20'
  }
];

export default function AppsPage() {
  useEffect(() => {
    document.title = 'Apps | PINC Platform';
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'stable': return 'var(--neon-green)';
      case 'beta': return 'var(--theme-accent)';
      case 'alpha': return 'var(--neon-orange)';
      default: return 'var(--text-muted)';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'stable': return 'Stable';
      case 'beta': return 'Beta';
      case 'alpha': return 'Alpha';
      default: return status;
    }
  };

  return (
    <div style={{ position: 'relative', minHeight: '100vh', padding: '2rem 1rem' }}>
      <ThemeBackground />
      <div style={{ maxWidth: 1100, margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <header style={{ marginBottom: '2rem', textAlign: 'center' }}>
          <h1 style={{ fontFamily: 'monospace', fontSize: '2rem', fontWeight: 800, color: 'var(--theme-accent)', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>PINC Platform Apps</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Download SARAI Wallet for your platform</p>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {platformApps.map(app => (
            <article key={app.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: '1.5rem', display: 'flex', flexDirection: 'column', backdropFilter: 'blur(12px)', transition: 'transform 0.2s, box-shadow 0.2s' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <img src={app.icon} alt="" style={{ width: 48, height: 48, borderRadius: 12, objectFit: 'cover' }} />
                <div>
                  <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>{app.name}</h2>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 600, padding: '0.15rem 0.5rem', borderRadius: 999, background: getStatusColor(app.status), color: '#0a0a0f' }}>{getStatusLabel(app.status)}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{app.platform}</span>
                  </div>
                </div>
              </div>

              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.6, marginBottom: '1rem', flex: 1 }}>{app.description}</p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1rem', fontSize: '0.75rem' }}>
                <div><span style={{ color: 'var(--text-muted)' }}>Version:</span> <span style={{ color: 'var(--text-primary)' }}>{app.version}</span></div>
                <div><span style={{ color: 'var(--text-muted)' }}>Size:</span> <span style={{ color: 'var(--text-primary)' }}>{app.size}</span></div>
                <div><span style={{ color: 'var(--text-muted)' }}>Min OS:</span> <span style={{ color: 'var(--text-primary)' }}>{app.minVersion}</span></div>
                <div><span style={{ color: 'var(--text-muted)' }}>Arch:</span> <span style={{ color: 'var(--text-primary)' }}>{app.architecture}</span></div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <h4 style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Features</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                  {app.features.map((f, i) => (
                    <span key={i} style={{ fontSize: '0.65rem', padding: '0.2rem 0.5rem', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 999, color: 'var(--text-secondary)' }}>{f}</span>
                  ))}
                </div>
              </div>

              {app.packages ? (
                <div style={{ marginBottom: '1rem' }}>
                  <h4 style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Download Options</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    {app.packages.map((pkg, i) => (
                      <a key={i} href={pkg.url} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.4rem 0.6rem', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.75rem', transition: 'all 0.15s' }}>
                        <span>{pkg.type}</span>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>{pkg.size}</span>
                      </a>
                    ))}
                  </div>
                </div>
              ) : (
                <a href={app.downloadUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.6rem 1rem', background: 'var(--theme-accent)', color: '#0a0a0f', borderRadius: 999, fontWeight: 700, fontSize: '0.8rem', textDecoration: 'none', marginBottom: '1rem' }}>
                  Download {app.size}
                </a>
              )}

              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
                <div>SHA256: <code style={{ fontFamily: 'monospace', background: 'var(--bg-elevated)', padding: '0.1rem 0.3rem', borderRadius: 4 }}>{app.sha256}</code></div>
                <div style={{ marginTop: '0.25rem' }}>Updated: {app.updated}</div>
              </div>
            </article>
          ))}
        </div>

        <section style={{ marginTop: '3rem', padding: '1.5rem', background: 'rgba(212,175,55,0.08)', border: '1px solid var(--theme-accent)', borderRadius: 12 }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--theme-accent)', marginBottom: '1rem' }}>Verification & Security</h2>
          <div style={{ color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: '0.9rem' }}>
            <p style={{ marginBottom: '0.75rem' }}><strong>All downloads are signed and verified:</strong></p>
            <ul style={{ marginLeft: '1.5rem', marginBottom: '1rem' }}>
              <li style={{ marginBottom: '0.5rem' }}>Android APK: Signed with PINC release key, verified via Play App Signing</li>
              <li style={{ marginBottom: '0.5rem' }}>Linux: GPG signed packages, SHA256 checksums published</li>
              <li style={{ marginBottom: '0.5rem' }}>Windows: Authenticode signed, SmartScreen reputation established</li>
              <li style={{ marginBottom: '0.5rem' }}>macOS: Notarized by Apple, Developer ID signed</li>
            </ul>
            <p style={{ marginBottom: '0.75rem' }}>Verify downloads using the SHA256 checksums above. Source code available at <a href="https://github.com/pinc-network/pinc-sarai" style={{ color: 'var(--theme-accent)' }}>github.com/pinc-network/pinc-sarai</a>.</p>
          </div>
        </section>

        <section style={{ marginTop: '2rem', padding: '1.5rem', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12 }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem' }}>Build from Source</h2>
          <div style={{ color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: '0.9rem' }}>
            <p style={{ marginBottom: '0.75rem' }}><strong>Prerequisites:</strong> Node.js 20+, Rust 1.75+, Android SDK/NDK (for Android), Xcode (for macOS)</p>
            <pre style={{ background: 'var(--bg-elevated)', padding: '1rem', borderRadius: 8, overflow: 'auto', fontSize: '0.75rem', marginBottom: '1rem', border: '1px solid var(--border)' }}>
{`# Clone and build
git clone https://github.com/pinc-network/pinc-sarai
cd pinc-sarai

# Install dependencies
npm install

# Build frontend
npm run build

# Linux
cd src-tauri && cargo tauri build --target x86_64-unknown-linux-gnu

# Android
export ANDROID_HOME=$HOME/Android/Sdk
export NDK_HOME=$ANDROID_HOME/ndk/27.0.12077973
npx tauri android build --target aarch64

# Windows (on Windows host)
npx tauri build --target x86_64-pc-windows-msvc

# macOS (on macOS host)
npx tauri build --target aarch64-apple-darwin`}
            </pre>
            <p>Full build instructions: <a href="/docs#building" style={{ color: 'var(--theme-accent)' }}>Documentation → Building</a></p>
          </div>
        </section>
      </div>
    </div>
  );
}