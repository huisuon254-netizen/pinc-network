import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { motion } from 'framer-motion';
import {
  Shield, Key, Smartphone, Laptop, Trash2, Plus, Eye, EyeOff,
  Fingerprint, Lock, Unlock, AlertTriangle, CheckCircle, XCircle,
  Clock, Monitor, RefreshCw, ShieldAlert, ShieldCheck
} from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import { SecurityLog, Device } from '../../types';

interface IdentityInfo {
  id: string;
  has_master_key: boolean;
  has_recovery: boolean;
  has_seed_phrase: boolean;
}

export default function SecurityPage() {
  const { identity, securityLogs, devices, refreshSecurity } = useAppStore();
  const [identityInfo, setIdentityInfo] = useState<IdentityInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSeedPhrase, setShowSeedPhrase] = useState(false);
  const [recoveryMethod, setRecoveryMethod] = useState<'seed' | 'private_key'>('seed');
  const [updatingMethod, setUpdatingMethod] = useState(false);
  const [showAddDevice, setShowAddDevice] = useState(false);
  const [devicePairingCode, setDevicePairingCode] = useState('');
  const [deviceQrBase64, setDeviceQrBase64] = useState('');
  const [linkingDevice, setLinkingDevice] = useState(false);

  useEffect(() => {
    loadSecurityData();
  }, []);

  const loadSecurityData = async () => {
    setLoading(true);
    try {
      const [hasIdentity, logs, devs] = await Promise.all([
        invoke<boolean>('cmd_has_identity'),
        invoke<SecurityLog[]>('cmd_get_security_logs'),
        invoke<Device[]>('cmd_get_devices'),
      ]);

      if (hasIdentity) {
        const info = await invoke<IdentityInfo>('cmd_get_identity');
        setIdentityInfo(info);
      }

      refreshSecurity();
    } catch (err) {
      console.error('Failed to load security data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewRecoveryPhrase = async () => {
    setShowSeedPhrase(!showSeedPhrase);
  };

  const handleUpdateRecoveryMethod = async () => {
    setUpdatingMethod(true);
    try {
      await invoke('cmd_update_recovery_method', { method: recoveryMethod });
      await loadSecurityData();
    } catch (err) {
      console.error('Failed to update recovery method:', err);
    } finally {
      setUpdatingMethod(false);
    }
  };

  const handleRemoveDevice = async (deviceId: string) => {
    try {
      await invoke('cmd_remove_device', { deviceId });
      await loadSecurityData();
    } catch (err) {
      console.error('Failed to remove device:', err);
    }
  };

  const startDeviceLink = async () => {
    setLinkingDevice(true);
    try {
      const code = await invoke<{ code: string; expires_in_secs: number }>('cmd_generate_pairing_code');
      setDevicePairingCode(code.code);
      const qr = await invoke<string>('cmd_generate_qr_png', {
        data: JSON.stringify({ code: code.code, type: 'device_link' })
      });
      setDeviceQrBase64(qr);
      setShowAddDevice(true);
    } catch (e) {
      console.error('Failed to generate device link code:', e);
    }
    setLinkingDevice(false);
  };

  const truncateId = (id: string) => {
    if (!id) return '—';
    return id.length > 20 ? `${id.slice(0, 8)}...${id.slice(-8)}` : id;
  };

  const formatTimestamp = (ts: number) => {
    if (!ts) return '—';
    try { return new Date(ts * 1000).toLocaleString(); } catch { return '—'; }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'var(--neon-green)';
      case 'failed': return 'var(--neon-red)';
      case 'warning': return 'var(--neon-yellow)';
      default: return 'var(--text-muted)';
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'success': return 'badge badge-online';
      case 'failed': return 'badge badge-offline';
      case 'warning': return 'badge badge-pending';
      default: return 'badge badge-info';
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px' }}>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.2em', marginBottom: '0.25rem' }}>
            SECURITY CENTER
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Shield size={24} style={{ color: 'var(--electric-blue)' }} />
            <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>Security Dashboard</div>
            <span className="badge badge-info">ACTIVE</span>
          </div>
        </div>

        {/* Identity Information */}
        <div className="pinc-card" style={{ marginBottom: '1rem' }}>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.12em', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Fingerprint size={14} />
            IDENTITY INFORMATION
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>User ID</div>
              <div style={{ 
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '0.85rem',
                color: 'var(--electric-blue)',
                background: 'var(--bg-secondary)',
                padding: '0.5rem',
                borderRadius: '4px',
                border: '1px solid var(--border)'
              }}>
                {truncateId(identity?.id || '—')}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Master Key Status</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {identityInfo?.has_master_key ? (
                  <span className="badge badge-online">
                    <Lock size={12} />
                    ACTIVE
                  </span>
                ) : (
                  <span className="badge badge-offline">
                    <Unlock size={12} />
                    INACTIVE
                  </span>
                )}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Recovery Status</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {identityInfo?.has_recovery ? (
                  <span className="badge badge-online">
                    <CheckCircle size={12} />
                    Configured
                  </span>
                ) : (
                  <span className="badge badge-pending">
                    <AlertTriangle size={12} />
                    Not Configured
                  </span>
                )}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Seed Phrase Status</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {identityInfo?.has_seed_phrase ? (
                  <span className="badge badge-online">
                    <ShieldCheck size={12} />
                    Saved
                  </span>
                ) : (
                  <span className="badge badge-pending">
                    <ShieldAlert size={12} />
                    Not Saved
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={handleViewRecoveryPhrase}
            className="pinc-btn"
            style={{ marginTop: '0.5rem' }}
          >
            {showSeedPhrase ? <EyeOff size={16} /> : <Eye size={16} />}
            {showSeedPhrase ? 'Hide Recovery Phrase' : 'View Recovery Phrase'}
          </button>

          {showSeedPhrase && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              style={{
                marginTop: '1rem',
                padding: '1rem',
                background: 'var(--bg-secondary)',
                borderRadius: '4px',
                border: '1px solid var(--neon-yellow)'
              }}
            >
              <div style={{ fontSize: '0.72rem', color: 'var(--neon-yellow)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertTriangle size={14} />
                WARNING: Never share your recovery phrase
              </div>
              <div style={{ 
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '0.8rem',
                color: 'var(--text-primary)',
                wordBreak: 'break-all'
              }}>
                ••••••••••••••••••••••••••••••••
              </div>
            </motion.div>
          )}
        </div>

        {/* Devices Section */}
        <div className="pinc-card" style={{ marginBottom: '1rem' }}>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.12em', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Smartphone size={14} />
            DEVICES
          </div>

          {devices.filter(d => d.type === 'primary').map(device => (
            <div
              key={device.id}
              style={{
                padding: '1rem',
                marginBottom: '1rem',
                background: 'rgba(57, 255, 20, 0.05)',
                border: '1px solid var(--neon-green)',
                borderRadius: '8px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Laptop size={20} style={{ color: 'var(--neon-green)' }} />
                  <div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                      {device.name}
                      {device.is_current && (
                        <span style={{ 
                          marginLeft: '0.5rem',
                          fontSize: '0.65rem',
                          color: 'var(--neon-green)',
                          background: 'rgba(57, 255, 20, 0.1)',
                          padding: '0.15rem 0.5rem',
                          borderRadius: '3px'
                        }}>
                          CURRENT
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      Last active: {formatTimestamp(device.last_active)}
                    </div>
                  </div>
                </div>
                <span className="badge badge-online">PRIMARY</span>
              </div>
            </div>
          ))}

          {devices.filter(d => d.type === 'linked').map(device => (
            <div
              key={device.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.75rem',
                marginBottom: '0.5rem',
                background: 'var(--bg-secondary)',
                borderRadius: '4px',
                border: '1px solid var(--border)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Monitor size={18} style={{ color: 'var(--text-muted)' }} />
                <div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-primary)' }}>
                    {device.name}
                  </div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                    Last active: {formatTimestamp(device.last_active)}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="badge badge-info">LINKED</span>
                <button
                  onClick={() => handleRemoveDevice(device.id)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--neon-red)',
                    cursor: 'pointer',
                    padding: '0.25rem',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}

          {devices.length === 0 && (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.72rem' }}>
              <Smartphone size={24} style={{ margin: '0 auto 0.5rem', opacity: 0.3 }} />
              No devices registered
            </div>
          )}

          <button
            onClick={startDeviceLink}
            disabled={linkingDevice}
            className="pinc-btn"
            style={{ marginTop: '1rem', width: '100%' }}
          >
            <Plus size={16} />
            {linkingDevice ? 'Generating Code...' : 'Add New Device'}
          </button>

          {showAddDevice && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              style={{
                marginTop: '1rem',
                padding: '1.25rem',
                background: 'var(--bg-secondary)',
                borderRadius: '8px',
                border: '1px solid var(--electric-blue)',
                textAlign: 'center'
              }}
            >
              {deviceQrBase64 && (
                <div style={{ marginBottom: '1rem' }}>
                  <img
                    src={`data:image/png;base64,${deviceQrBase64}`}
                    alt="Device pairing QR code"
                    style={{ width: '180px', height: '180px', borderRadius: '8px' }}
                  />
                </div>
              )}

              <div style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '1.1rem',
                color: 'var(--electric-blue)',
                background: 'var(--bg-primary)',
                padding: '0.75rem 1rem',
                borderRadius: '6px',
                border: '1px solid var(--border)',
                marginBottom: '0.75rem',
                letterSpacing: '0.15em',
                fontWeight: 700
              }}>
                {devicePairingCode}
              </div>

              <button
                onClick={() => {
                  navigator.clipboard.writeText(devicePairingCode);
                }}
                style={{
                  background: 'transparent',
                  border: '1px solid var(--border)',
                  color: 'var(--text-muted)',
                  padding: '0.35rem 0.75rem',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.7rem',
                  marginBottom: '1rem'
                }}
              >
                Copy Code
              </button>

              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1rem' }}>
                Scan this QR or enter the code on the device you want to link.
              </div>

              <button
                onClick={() => {
                  setShowAddDevice(false);
                  setDevicePairingCode('');
                  setDeviceQrBase64('');
                }}
                style={{
                  background: 'transparent',
                  border: '1px solid var(--border)',
                  color: 'var(--text-muted)',
                  padding: '0.5rem 1.5rem',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.72rem'
                }}
              >
                Close
              </button>
            </motion.div>
          )}

          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.75rem', lineHeight: 1.6 }}>
            Device binding ensures that your identity can only be accessed from authorized devices. 
            Each device is cryptographically bound to your identity using Ed25519 keys.
          </div>
        </div>

        {/* Security Logs Section */}
        <div className="pinc-card" style={{ marginBottom: '1rem' }}>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.12em', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Clock size={14} />
            SECURITY LOGS
          </div>

          {securityLogs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.72rem' }}>
              <ShieldCheck size={24} style={{ margin: '0 auto 0.5rem', opacity: 0.3 }} />
              No security events recorded
            </div>
          ) : (
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {securityLogs.map((log, index) => (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1.5fr auto 1fr auto',
                    alignItems: 'center',
                    gap: '1rem',
                    padding: '0.75rem',
                    marginBottom: '0.5rem',
                    background: 'var(--bg-secondary)',
                    borderRadius: '4px',
                    border: '1px solid var(--border)',
                    fontSize: '0.72rem'
                  }}
                >
                  <div style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                    {log.action}
                  </div>
                  <div style={{ color: 'var(--text-secondary)', fontFamily: "'JetBrains Mono', monospace" }}>
                    {log.details}
                  </div>
                  <span className={getStatusBadgeClass(log.status)}>
                    {log.status.toUpperCase()}
                  </span>
                  <div style={{ color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace" }}>
                    {formatTimestamp(log.timestamp)}
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace", textAlign: 'right' }}>
                    {log.ip_address}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Recovery Methods Section */}
        <div className="pinc-card" style={{ marginBottom: '1rem' }}>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.12em', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Key size={14} />
            RECOVERY METHODS
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div
              onClick={() => setRecoveryMethod('seed')}
              style={{
                padding: '1rem',
                background: recoveryMethod === 'seed' ? 'rgba(0, 212, 255, 0.1)' : 'var(--bg-secondary)',
                border: `1px solid ${recoveryMethod === 'seed' ? 'var(--electric-blue)' : 'var(--border)'}`,
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <input
                  type="radio"
                  checked={recoveryMethod === 'seed'}
                  onChange={() => setRecoveryMethod('seed')}
                  style={{ accentColor: 'var(--electric-blue)' }}
                />
                <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                  Seed Phrase Only
                </span>
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Recover your identity using your 24-word seed phrase. Simple and secure.
              </div>
            </div>

            <div
              onClick={() => setRecoveryMethod('private_key')}
              style={{
                padding: '1rem',
                background: recoveryMethod === 'private_key' ? 'rgba(0, 212, 255, 0.1)' : 'var(--bg-secondary)',
                border: `1px solid ${recoveryMethod === 'private_key' ? 'var(--electric-blue)' : 'var(--border)'}`,
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <input
                  type="radio"
                  checked={recoveryMethod === 'private_key'}
                  onChange={() => setRecoveryMethod('private_key')}
                  style={{ accentColor: 'var(--electric-blue)' }}
                />
                <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                  Private Key + Master Key
                </span>
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Two-factor recovery using your private key and master key for enhanced security.
              </div>
            </div>
          </div>

          <div style={{ 
            fontSize: '0.72rem', 
            color: 'var(--text-muted)', 
            marginBottom: '1rem',
            padding: '0.5rem',
            background: 'var(--bg-secondary)',
            borderRadius: '4px'
          }}>
            Current method: <span style={{ color: 'var(--electric-blue)' }}>
              {identityInfo?.has_seed_phrase ? 'Seed Phrase Only' : 'Private Key + Master Key'}
            </span>
          </div>

          <button
            onClick={handleUpdateRecoveryMethod}
            disabled={updatingMethod}
            className="pinc-btn"
            style={{ width: '100%' }}
          >
            <RefreshCw size={16} />
            {updatingMethod ? 'Updating...' : 'Update Recovery Method'}
          </button>
        </div>

        <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
          <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
            PINC Security v1.0 — Protected by Ed25519 & XChaCha20-Poly1305
          </p>
        </div>
      </motion.div>
    </div>
  );
}
