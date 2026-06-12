import React, { useState, useEffect, useRef, useCallback } from 'react';

interface Transaction {
  id: string;
  type: 'deposit' | 'withdraw' | 'send' | 'receive';
  amount: number;
  currency: string;
  date: string;
  status: 'completed' | 'pending' | 'failed';
  from?: string;
  to?: string;
  memo?: string;
  txHash?: string;
  fee?: number;
}

const MOCK_TRANSACTIONS: Transaction[] = [
  { id: '1', type: 'deposit', amount: 100, currency: 'USD', date: '2026-01-15T10:30:00Z', status: 'completed', from: 'Bank Account ****4521' },
  { id: '2', type: 'withdraw', amount: 50, currency: 'USD', date: '2026-01-14T14:20:00Z', status: 'completed', to: 'Bank Account ****4521' },
  { id: '3', type: 'send', amount: 25, currency: 'BTC', date: '2026-01-13T09:15:00Z', status: 'pending', to: 'pinc1q...8f3k', memo: 'Payment for services' },
  { id: '4', type: 'receive', amount: 75, currency: 'ETH', date: '2026-01-12T16:45:00Z', status: 'completed', from: 'pinc1a...2x9m' },
  { id: '5', type: 'deposit', amount: 200, currency: 'USD', date: '2026-01-11T11:00:00Z', status: 'completed', from: 'Crypto Exchange' },
  { id: '6', type: 'send', amount: 10, currency: 'BTC', date: '2026-01-10T08:30:00Z', status: 'failed', to: 'pinc1z...5t7n', txHash: '0xabc123...def456' },
  { id: '7', type: 'withdraw', amount: 150, currency: 'USD', date: '2026-01-09T13:10:00Z', status: 'completed', to: 'Crypto Wallet', fee: 2.5 },
];

function AnimatedBalance({ value, currency }: { value: number; currency: string }) {
  const [display, setDisplay] = useState(0);
  const frameRef = useRef<number>();
  const startRef = useRef<number>();

  useEffect(() => {
    const duration = 1200;
    const start = display;
    const diff = value - start;

    const animate = (timestamp: number) => {
      if (!startRef.current) startRef.current = timestamp;
      const progress = Math.min((timestamp - startRef.current) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(start + diff * eased);
      if (progress < 1) frameRef.current = requestAnimationFrame(animate);
    };

    frameRef.current = requestAnimationFrame(animate);
    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current); };
  }, [value]);

  return (
    <span className="tabular-nums">
      {display.toFixed(2)} {currency}
    </span>
  );
}

function QRCode({ address }: { address: string }) {
  const size = 160;
  const cellSize = 4;
  const modules = Math.floor(size / cellSize);

  const cells: boolean[][] = [];
  for (let y = 0; y < modules; y++) {
    cells[y] = [];
    for (let x = 0; x < modules; x++) {
      cells[y][x] = false;
    }
  }

  const addFinderPattern = (startX: number, startY: number) => {
    for (let y = 0; y < 7; y++) {
      for (let x = 0; x < 7; x++) {
        const isEdge = x === 0 || x === 6 || y === 0 || y === 6;
        const isInner = x >= 2 && x <= 4 && y >= 2 && y <= 4;
        cells[startY + y][startX + x] = isEdge || isInner;
      }
    }
  };

  addFinderPattern(1, 1);
  addFinderPattern(modules - 8, 1);
  addFinderPattern(1, modules - 8);

  for (let i = 8; i < modules - 8; i++) {
    cells[6][i] = i % 2 === 0;
    cells[i][6] = i % 2 === 0;
  }

  let seed = 0;
  for (let i = 0; i < address.length; i++) seed = ((seed << 5) - seed + address.charCodeAt(i)) | 0;
  const pseudoRandom = () => { seed = (seed * 16807 + 0) % 2147483647; return (seed & 0x7fffffff) / 2147483647; };

  for (let y = 0; y < modules; y++) {
    for (let x = 0; x < modules; x++) {
      if (cells[y][x]) continue;
      const inFinder1 = x < 9 && y < 9;
      const inFinder2 = x >= modules - 9 && y < 9;
      const inFinder3 = x < 9 && y >= modules - 9;
      const onTiming = x === 6 || y === 6;
      if (!inFinder1 && !inFinder2 && !inFinder3 && !onTiming) {
        cells[y][x] = pseudoRandom() > 0.55;
      }
    }
  }

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="rounded-lg">
      <rect width={size} height={size} fill="#1e1b2e" />
      {cells.map((row, y) =>
        row.map((filled, x) =>
          filled ? (
            <rect
              key={`${x}-${y}`}
              x={x * cellSize}
              y={y * cellSize}
              width={cellSize}
              height={cellSize}
              fill="#c084fc"
              rx={1}
            />
          ) : null
        )
      )}
    </svg>
  );
}

function StatusBadge({ status }: { status: Transaction['status'] }) {
  const styles = {
    completed: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    pending: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    failed: 'bg-red-500/20 text-red-400 border-red-500/30',
  };
  return (
    <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${styles[status]}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function TypeIcon({ type }: { type: Transaction['type'] }) {
  const icons = {
    deposit: '↓',
    withdraw: '↑',
    send: '→',
    receive: '←',
  };
  const colors = {
    deposit: 'bg-emerald-500/20 text-emerald-400',
    withdraw: 'bg-amber-500/20 text-amber-400',
    send: 'bg-red-500/20 text-red-400',
    receive: 'bg-blue-500/20 text-blue-400',
  };
  return (
    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${colors[type]}`}>
      {icons[type]}
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }, [text]);

  return (
    <button
      onClick={handleCopy}
      className="px-3 py-1.5 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 text-sm font-medium transition-all duration-200 border border-purple-500/30"
    >
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
}

export default function PaymentPage() {
  const [balance] = useState(1247.50);
  const [balanceCurrency] = useState('USD');
  const [transactions] = useState<Transaction[]>(MOCK_TRANSACTIONS);
  const [txFilter, setTxFilter] = useState<'all' | Transaction['type']>('all');
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  const [activeTab, setActiveTab] = useState<'send' | 'receive' | 'deposit' | 'withdraw'>('send');
  const [depositMethod, setDepositMethod] = useState<'agent' | 'crypto'>('agent');
  const [withdrawMethod, setWithdrawMethod] = useState<'agent' | 'crypto'>('agent');

  const [sendAmount, setSendAmount] = useState('');
  const [sendAddress, setSendAddress] = useState('');
  const [sendMemo, setSendMemo] = useState('');

  const [depositAmount, setDepositAmount] = useState('');
  const [depositAgentId, setDepositAgentId] = useState('');
  const [depositCryptoAddress, setDepositCryptoAddress] = useState('');

  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawAddress, setWithdrawAddress] = useState('');
  const [withdrawAgentId, setWithdrawAgentId] = useState('');

  const walletAddress = 'pinc1qw508d6qejxtdg4y5r3zarvary0c5xw7kygt080';
  const [sendStatus, setSendStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  const filteredTx = transactions.filter((tx) => txFilter === 'all' || tx.type === txFilter);

  const handleSend = useCallback(async () => {
    if (!sendAmount || !sendAddress) return;
    setSendStatus('sending');
    await new Promise((r) => setTimeout(r, 1500));
    setSendStatus('sent');
    setTimeout(() => { setSendStatus('idle'); setSendAmount(''); setSendAddress(''); setSendMemo(''); }, 2000);
  }, [sendAmount, sendAddress, sendMemo]);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffH = Math.floor(diffMs / 3600000);
    const diffD = Math.floor(diffMs / 86400000);

    if (diffH < 1) return 'Just now';
    if (diffH < 24) return `${diffH}h ago`;
    if (diffD < 7) return `${diffD}d ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0816] via-[#130e24] to-[#0d0b1a] text-white p-4 md:p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-500 bg-clip-text text-transparent">
          Wallet
        </h1>
        <p className="text-gray-400 text-sm mt-1">Manage your funds and transactions</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-[#1a1528]/80 backdrop-blur-xl rounded-2xl border border-purple-500/20 p-6 shadow-lg shadow-purple-500/5">
            <div className="text-gray-400 text-sm font-medium mb-1">Total Balance</div>
            <div className="text-4xl font-bold text-white mb-1">
              <AnimatedBalance value={balance} currency={balanceCurrency} />
            </div>
            <div className="flex items-center gap-2 text-sm text-emerald-400 mt-2">
              <span className="bg-emerald-500/20 px-2 py-0.5 rounded-full text-xs font-medium">+12.5%</span>
              <span className="text-gray-500">this week</span>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="bg-purple-500/10 rounded-xl p-3 border border-purple-500/20">
                <div className="text-gray-400 text-xs">Savings</div>
                <div className="text-white font-semibold text-sm">$820.00</div>
              </div>
              <div className="bg-pink-500/10 rounded-xl p-3 border border-pink-500/20">
                <div className="text-gray-400 text-xs">Investments</div>
                <div className="text-white font-semibold text-sm">$427.50</div>
              </div>
            </div>
          </div>

          <div className="mt-4 bg-[#1a1528]/80 backdrop-blur-xl rounded-2xl border border-purple-500/20 p-4 shadow-lg shadow-purple-500/5">
            <div className="text-xs text-gray-400 font-medium mb-2">QUICK ACTIONS</div>
            <div className="grid grid-cols-2 gap-2">
              {(['send', 'receive', 'deposit', 'withdraw'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                    activeTab === tab
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/25'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          {activeTab === 'send' && (
            <div className="bg-[#1a1528]/80 backdrop-blur-xl rounded-2xl border border-purple-500/20 p-6 shadow-lg shadow-purple-500/5">
              <h2 className="text-lg font-bold text-white mb-4">Send Funds</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1.5">Recipient Address</label>
                  <input
                    type="text"
                    value={sendAddress}
                    onChange={(e) => setSendAddress(e.target.value)}
                    placeholder="pinc1q... (wallet address)"
                    className="w-full bg-[#0d0b1a] border border-purple-500/30 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1.5">Amount (USD)</label>
                  <input
                    type="number"
                    value={sendAmount}
                    onChange={(e) => setSendAmount(e.target.value)}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    className="w-full bg-[#0d0b1a] border border-purple-500/30 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all text-2xl font-semibold"
                  />
                  <div className="flex justify-between mt-1.5">
                    <span className="text-xs text-gray-500">Available: ${balance.toFixed(2)}</span>
                    <div className="flex gap-1.5">
                      {['25%', '50%', '75%', 'MAX'].map((pct) => (
                        <button
                          key={pct}
                          onClick={() => {
                            const val = pct === 'MAX' ? balance : balance * (parseInt(pct) / 100);
                            setSendAmount(val.toFixed(2));
                          }}
                          className="text-xs px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 transition-colors"
                        >
                          {pct}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1.5">Memo (Optional)</label>
                  <input
                    type="text"
                    value={sendMemo}
                    onChange={(e) => setSendMemo(e.target.value)}
                    placeholder="Payment note..."
                    className="w-full bg-[#0d0b1a] border border-purple-500/30 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all"
                  />
                </div>
                <button
                  onClick={handleSend}
                  disabled={!sendAmount || !sendAddress || sendStatus === 'sending'}
                  className={`w-full py-3.5 rounded-xl font-bold text-white transition-all duration-300 ${
                    sendStatus === 'sent'
                      ? 'bg-emerald-500 shadow-lg shadow-emerald-500/25'
                      : sendStatus === 'sending'
                      ? 'bg-purple-600/50 cursor-wait'
                      : !sendAmount || !sendAddress
                      ? 'bg-gray-600/50 cursor-not-allowed text-gray-400'
                      : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40'
                  }`}
                >
                  {sendStatus === 'sending' ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                      Sending...
                    </span>
                  ) : sendStatus === 'sent' ? (
                    'Sent Successfully!'
                  ) : (
                    `Send $${sendAmount || '0.00'}`
                  )}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'receive' && (
            <div className="bg-[#1a1528]/80 backdrop-blur-xl rounded-2xl border border-purple-500/20 p-6 shadow-lg shadow-purple-500/5">
              <h2 className="text-lg font-bold text-white mb-4">Receive Funds</h2>
              <div className="flex flex-col items-center gap-6">
                <div className="bg-[#0d0b1a] p-4 rounded-2xl border border-purple-500/30">
                  <QRCode address={walletAddress} />
                </div>
                <div className="w-full">
                  <label className="block text-sm font-medium text-gray-400 mb-1.5">Your Wallet Address</label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-[#0d0b1a] border border-purple-500/30 rounded-xl px-4 py-3 text-white text-sm font-mono overflow-x-auto">
                      {walletAddress}
                    </div>
                    <CopyButton text={walletAddress} />
                  </div>
                </div>
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 w-full">
                  <p className="text-amber-300 text-sm">
                    Only send funds to this address on the PINC network. Sending from other networks may result in permanent loss.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'deposit' && (
            <div className="bg-[#1a1528]/80 backdrop-blur-xl rounded-2xl border border-purple-500/20 p-6 shadow-lg shadow-purple-500/5">
              <h2 className="text-lg font-bold text-white mb-4">Deposit Funds</h2>
              <div className="flex gap-2 mb-6 bg-[#0d0b1a] p-1 rounded-xl">
                {(['agent', 'crypto'] as const).map((method) => (
                  <button
                    key={method}
                    onClick={() => setDepositMethod(method)}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                      depositMethod === method
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {method === 'agent' ? 'Agent Deposit' : 'Crypto Deposit'}
                  </button>
                ))}
              </div>
              {depositMethod === 'agent' ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1.5">Agent ID</label>
                    <input
                      type="text"
                      value={depositAgentId}
                      onChange={(e) => setDepositAgentId(e.target.value)}
                      placeholder="Enter agent ID"
                      className="w-full bg-[#0d0b1a] border border-purple-500/30 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1.5">Amount (USD)</label>
                    <input
                      type="number"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      placeholder="0.00"
                      min="0"
                      className="w-full bg-[#0d0b1a] border border-purple-500/30 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all text-2xl font-semibold"
                    />
                  </div>
                  <button
                    disabled={!depositAgentId || !depositAmount}
                    className="w-full py-3.5 rounded-xl font-bold text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 disabled:bg-gray-600/50 disabled:cursor-not-allowed disabled:text-gray-400 transition-all duration-300"
                  >
                    Request Agent Deposit
                  </button>
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                    <p className="text-blue-300 text-sm">
                      Contact a verified PINC agent to deposit cash or bank transfer. Funds will be credited within 15 minutes.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1.5">Deposit Address</label>
                    <div className="flex bg-[#0d0b1a] border border-purple-500/30 rounded-xl overflow-hidden">
                      <select className="bg-transparent text-white px-4 py-3 border-r border-purple-500/30 focus:outline-none appearance-none cursor-pointer">
                        <option value="BTC" className="bg-[#0d0b1a]">BTC</option>
                        <option value="ETH" className="bg-[#0d0b1a]">ETH</option>
                        <option value="USDT" className="bg-[#0d0b1a]">USDT</option>
                      </select>
                      <input
                        type="text"
                        value={depositCryptoAddress}
                        onChange={(e) => setDepositCryptoAddress(e.target.value)}
                        placeholder="Enter crypto wallet address"
                        className="flex-1 bg-transparent text-white px-4 py-3 placeholder-gray-500 focus:outline-none"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col items-center gap-3">
                    <div className="bg-[#0d0b1a] p-4 rounded-2xl border border-purple-500/30">
                      <QRCode address={walletAddress} />
                    </div>
                    <div className="w-full">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-[#0d0b1a] border border-purple-500/30 rounded-xl px-4 py-3 text-white text-sm font-mono overflow-x-auto">
                          {walletAddress}
                        </div>
                        <CopyButton text={walletAddress} />
                      </div>
                    </div>
                  </div>
                  <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
                    <p className="text-emerald-300 text-sm">
                      Send any supported cryptocurrency to this address. Confirmations typically complete within 10-30 minutes depending on network congestion.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'withdraw' && (
            <div className="bg-[#1a1528]/80 backdrop-blur-xl rounded-2xl border border-purple-500/20 p-6 shadow-lg shadow-purple-500/5">
              <h2 className="text-lg font-bold text-white mb-4">Withdraw Funds</h2>
              <div className="flex gap-2 mb-6 bg-[#0d0b1a] p-1 rounded-xl">
                {(['agent', 'crypto'] as const).map((method) => (
                  <button
                    key={method}
                    onClick={() => setWithdrawMethod(method)}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                      withdrawMethod === method
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {method === 'agent' ? 'Agent Withdraw' : 'Crypto Withdraw'}
                  </button>
                ))}
              </div>
              {withdrawMethod === 'agent' ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1.5">Agent ID</label>
                    <input
                      type="text"
                      value={withdrawAgentId}
                      onChange={(e) => setWithdrawAgentId(e.target.value)}
                      placeholder="Enter agent ID"
                      className="w-full bg-[#0d0b1a] border border-purple-500/30 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1.5">Amount (USD)</label>
                    <input
                      type="number"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      placeholder="0.00"
                      min="0"
                      className="w-full bg-[#0d0b1a] border border-purple-500/30 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all text-2xl font-semibold"
                    />
                    <span className="text-xs text-gray-500 mt-1 block">Available: ${balance.toFixed(2)}</span>
                  </div>
                  <button
                    disabled={!withdrawAgentId || !withdrawAmount || Number(withdrawAmount) > balance}
                    className="w-full py-3.5 rounded-xl font-bold text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 disabled:bg-gray-600/50 disabled:cursor-not-allowed disabled:text-gray-400 transition-all duration-300"
                  >
                    Request Cash Withdrawal
                  </button>
                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
                    <p className="text-amber-300 text-sm">
                      Schedule a cash pickup with a verified PINC agent. Processing takes 1-24 hours depending on agent availability.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1.5">Recipient Address</label>
                    <input
                      type="text"
                      value={withdrawAddress}
                      onChange={(e) => setWithdrawAddress(e.target.value)}
                      placeholder="Enter crypto wallet address"
                      className="w-full bg-[#0d0b1a] border border-purple-500/30 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1.5">Network</label>
                    <select className="w-full bg-[#0d0b1a] border border-purple-500/30 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all appearance-none cursor-pointer">
                      <option value="BTC" className="bg-[#0d0b1a]">Bitcoin (BTC)</option>
                      <option value="ETH" className="bg-[#0d0b1a]">Ethereum (ETH)</option>
                      <option value="USDT-ERC20" className="bg-[#0d0b1a]">USDT (ERC-20)</option>
                      <option value="USDT-TRC20" className="bg-[#0d0b1a]">USDT (TRC-20)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1.5">Amount (USD)</label>
                    <input
                      type="number"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      placeholder="0.00"
                      min="0"
                      className="w-full bg-[#0d0b1a] border border-purple-500/30 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all text-2xl font-semibold"
                    />
                    <div className="flex justify-between mt-1.5">
                      <span className="text-xs text-gray-500">Available: ${balance.toFixed(2)}</span>
                      <span className="text-xs text-gray-500">Fee: ~$2.50</span>
                    </div>
                  </div>
                  <button
                    disabled={!withdrawAddress || !withdrawAmount || Number(withdrawAmount) > balance}
                    className="w-full py-3.5 rounded-xl font-bold text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 disabled:bg-gray-600/50 disabled:cursor-not-allowed disabled:text-gray-400 transition-all duration-300"
                  >
                    Withdraw to Crypto
                  </button>
                  <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4">
                    <p className="text-purple-300 text-sm">
                      Withdrawals are processed within 30 minutes. Network fees apply and vary based on blockchain congestion.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="bg-[#1a1528]/80 backdrop-blur-xl rounded-2xl border border-purple-500/20 p-6 shadow-lg shadow-purple-500/5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white">Transaction History</h2>
              <div className="flex gap-1 bg-[#0d0b1a] p-1 rounded-lg">
                {(['all', 'deposit', 'withdraw', 'send', 'receive'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setTxFilter(f)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                      txFilter === f
                        ? 'bg-purple-600 text-white'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              {filteredTx.map((tx) => (
                <button
                  key={tx.id}
                  onClick={() => setSelectedTx(tx)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-all duration-200 text-left group"
                >
                  <TypeIcon type={tx.type} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium text-sm capitalize">{tx.type}</span>
                      <StatusBadge status={tx.status} />
                    </div>
                    <div className="text-gray-500 text-xs mt-0.5">
                      {tx.type === 'send' ? `To ${tx.to}` : tx.type === 'receive' ? `From ${tx.from}` : tx.from || tx.to || '—'}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className={`font-semibold text-sm ${
                      tx.type === 'receive' || tx.type === 'deposit' ? 'text-emerald-400' : 'text-red-400'
                    }`}>
                      {tx.type === 'receive' || tx.type === 'deposit' ? '+' : '-'}{tx.amount} {tx.currency}
                    </div>
                    <div className="text-gray-500 text-xs">{formatDate(tx.date)}</div>
                  </div>
                  <svg className="w-4 h-4 text-gray-600 group-hover:text-purple-400 transition-colors shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ))}
              {filteredTx.length === 0 && (
                <div className="text-center py-8 text-gray-500 text-sm">No transactions found</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {selectedTx && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedTx(null)}
        >
          <div
            className="bg-[#1a1528] border border-purple-500/30 rounded-2xl p-6 w-full max-w-md shadow-2xl shadow-purple-500/10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-white">Transaction Details</h3>
              <button
                onClick={() => setSelectedTx(null)}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col items-center gap-3 mb-6">
              <TypeIcon type={selectedTx.type} />
              <div className="text-3xl font-bold text-white">
                {selectedTx.type === 'receive' || selectedTx.type === 'deposit' ? '+' : '-'}
                {selectedTx.amount} {selectedTx.currency}
              </div>
              <StatusBadge status={selectedTx.status} />
            </div>

            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-white/5">
                <span className="text-gray-400 text-sm">Type</span>
                <span className="text-white text-sm font-medium capitalize">{selectedTx.type}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/5">
                <span className="text-gray-400 text-sm">Date</span>
                <span className="text-white text-sm font-medium">
                  {new Date(selectedTx.date).toLocaleString('en-US', {
                    month: 'short', day: 'numeric', year: 'numeric',
                    hour: '2-digit', minute: '2-digit',
                  })}
                </span>
              </div>
              {selectedTx.from && (
                <div className="flex justify-between py-2 border-b border-white/5">
                  <span className="text-gray-400 text-sm">From</span>
                  <span className="text-white text-sm font-medium font-mono">{selectedTx.from}</span>
                </div>
              )}
              {selectedTx.to && (
                <div className="flex justify-between py-2 border-b border-white/5">
                  <span className="text-gray-400 text-sm">To</span>
                  <span className="text-white text-sm font-medium font-mono">{selectedTx.to}</span>
                </div>
              )}
              {selectedTx.memo && (
                <div className="flex justify-between py-2 border-b border-white/5">
                  <span className="text-gray-400 text-sm">Memo</span>
                  <span className="text-white text-sm font-medium">{selectedTx.memo}</span>
                </div>
              )}
              {selectedTx.fee !== undefined && (
                <div className="flex justify-between py-2 border-b border-white/5">
                  <span className="text-gray-400 text-sm">Fee</span>
                  <span className="text-white text-sm font-medium">${selectedTx.fee.toFixed(2)}</span>
                </div>
              )}
              {selectedTx.txHash && (
                <div className="py-2">
                  <span className="text-gray-400 text-sm block mb-1">Transaction Hash</span>
                  <div className="flex items-center gap-2">
                    <span className="text-purple-300 text-xs font-mono break-all">{selectedTx.txHash}</span>
                    <CopyButton text={selectedTx.txHash} />
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setSelectedTx(null)}
                className="flex-1 py-2.5 rounded-xl bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 text-sm font-medium transition-all"
              >
                Close
              </button>
              <button className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium transition-all">
                View on Explorer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
