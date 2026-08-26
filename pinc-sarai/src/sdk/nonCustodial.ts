// @ts-nocheck
// Non-custodial SDKs — ethers.js / viem, @solana/web3.js, WalletConnect Web3Wallet
// Free public RPCs: cloudflare-eth.com, polygon-rpc.com, base.org
// DexScreener/CoinGecko demo, ChangeNOW/StealthEX aggregators
// Smart contract escrow on Base/Solana instead of DB — agent locks crypto into contract, user hands cash, contract unlocks to user's non-custodial wallet (xpub)

// Public RPCs (free, no API key)
export const PUBLIC_RPCS = {
  ethereum: "https://cloudflare-eth.com",
  polygon: "https://polygon-rpc.com",
  base: "https://mainnet.base.org",
  bsc: "https://bsc-dataseed.binance.org",
  arbitrum: "https://arb1.arbitrum.io/rpc",
} as const;

// Ethers.js v6 demo — non-custodial wallet via xpub-derived address (watch-only SARAI, ADMIN holds xpub)
export async function getEthersProvider(chain: keyof typeof PUBLIC_RPCS = "ethereum") {
  const { JsonRpcProvider } = await import("ethers");
  return new JsonRpcProvider(PUBLIC_RPCS[chain]);
}

export async function getEthersAddressFromXpubMock(xpub: string, index: number): Promise<string> {
  // In production: derive from xpub via bip32. Mock deterministic for demo
  const { sha256 } = await import("ethers");
  const hash = sha256(new TextEncoder().encode(`${xpub}:${index}`));
  return `0x${hash.slice(2, 42)}`;
}

// viem demo
export async function getViemClient(chain: keyof typeof PUBLIC_RPCS = "ethereum") {
  const { createPublicClient, http } = await import("viem");
  const { mainnet, polygon, base } = await import("viem/chains");
  const chainMap: any = { ethereum: mainnet, polygon, base };
  return createPublicClient({ chain: chainMap[chain] ?? mainnet, transport: http(PUBLIC_RPCS[chain]) });
}

// Solana web3.js demo — free RPC via https://api.mainnet-beta.solana.com (or public)
export async function getSolanaConnection() {
  const { Connection, clusterApiUrl } = await import("@solana/web3.js");
  return new Connection(clusterApiUrl("mainnet-beta"), "confirmed");
}

export async function deriveSolanaAddressFromXpubMock(xpub: string, index: number): Promise<string> {
  const { PublicKey } = await import("@solana/web3.js");
  // Mock: hash xpub+index -> 32 bytes -> PublicKey
  const enc = new TextEncoder().encode(`${xpub}:${index}:sol`);
  const hash = await crypto.subtle.digest("SHA-256", enc);
  const bytes = new Uint8Array(hash);
  // Use first 32 bytes as fake pubkey
  return new PublicKey(bytes).toBase58();
}

// WalletConnect Web3Wallet (stub — requires projectId)
export async function initWalletConnect(projectId: string = "stub_pinc_walletconnect_project_id") {
  // Dynamic import to avoid bundling if not installed
  try {
    const { SignClient } = await import("@walletconnect/sign-client" as any);
    const client = await (SignClient as any).init({ projectId });
    return client;
  } catch {
    console.warn("WalletConnect Web3Wallet stub: install @walletconnect/sign-client for full support");
    return {
      stub: true,
      projectId,
      connect: async () => ({ topic: "stub", pairingTopic: "stub" }),
      on: () => {},
    } as any;
  }
}

// DexScreener / CoinGecko demo
export async function fetchDexScreenerPrice(chain: string, tokenAddress: string): Promise<number | null> {
  try {
    const res = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}`);
    const json: any = await res.json();
    const price = parseFloat(json?.pairs?.[0]?.priceUsd ?? "");
    return isFinite(price) ? price : null;
  } catch {
    return null;
  }
}

export async function fetchCoinGeckoPrice(coinId: string = "usd-coin", vs: string = "usd"): Promise<number | null> {
  try {
    const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=${vs}`);
    const json: any = await res.json();
    return json?.[coinId]?.[vs] ?? null;
  } catch {
    return null;
  }
}

// ChangeNOW / StealthEX aggregators (swap)
export async function fetchChangeNowQuote(from: string, to: string, amount: number): Promise<{ rate: number; fee: number; estimated: number } | null> {
  // Stub demo — real would call https://api.changenow.io/v1/exchange-amount/{amount}/{from}_{to}?api_key=...
  // For containment demo we return deterministic mock based on aggregator spec
  void from; void to;
  const feeRate = 0.005; // 0.5%
  return { rate: 1.0 - feeRate, fee: amount * feeRate, estimated: amount * (1 - feeRate) };
}

export async function fetchStealthExQuote(from: string, to: string, amount: number): Promise<{ rate: number; fee: number; estimated: number } | null> {
  void from; void to;
  const feeRate = 0.004;
  return { rate: 1.0 - feeRate, fee: amount * feeRate, estimated: amount * (1 - feeRate) };
}

// Smart contract escrow on Base/Solana instead of DB
// Agent locks crypto into contract, user hands cash, contract unlocks to user's non-custodial wallet (xpub)
// Base (EVM) escrow ABI snippet + Solana program stub
export const BASE_ESCROW_ABI = [
  "function lock(address token, uint256 amount, bytes32 xpubHash) external",
  "function unlock(bytes32 xpubHash, address to) external",
  "function refund(bytes32 xpubHash) external",
] as const;

export async function lockBaseEscrowViaEthers(opts: { token: string; amount: string; xpub: string; rpc?: keyof typeof PUBLIC_RPCS }) {
  const provider: any = await getEthersProvider(opts.rpc ?? "base");
  // In production: use WalletConnect signer + contract address from env
  const escrowAddress = (import.meta as any).env?.VITE_BASE_ESCROW_ADDRESS ?? "0x0000000000000000000000000000000000000001";
  console.log("[Base Escrow LOCK]", { escrowAddress, token: opts.token, amount: opts.amount, xpubHash: opts.xpub.slice(0, 16) + "...", rpc: PUBLIC_RPCS[opts.rpc ?? "base"] });
  void provider;
  // Return mock tx hash
  return { txHash: `0x${Array.from(crypto.getRandomValues(new Uint8Array(32))).map(b=>b.toString(16).padStart(2,"0")).join("")}`, escrowAddress, xpub: opts.xpub };
}

export async function unlockBaseEscrowViaEthers(opts: { xpub: string; to: string }) {
  console.log("[Base Escrow UNLOCK]", opts);
  return { txHash: `0x${Array.from(crypto.getRandomValues(new Uint8Array(32))).map(b=>b.toString(16).padStart(2,"0")).join("")}` };
}

// Solana program stub
export const SOLANA_ESCROW_PROGRAM_ID = "EscRow1111111111111111111111111111111111111";

export async function lockSolanaEscrowViaWeb3(opts: { amountLamports: number; xpub: string }) {
  const conn: any = await getSolanaConnection();
  console.log("[Solana Escrow LOCK]", { program: SOLANA_ESCROW_PROGRAM_ID, amount: opts.amountLamports, xpub: opts.xpub.slice(0,16)+"...", rpc: conn.rpcEndpoint });
  return { signature: `sol-${Date.now()}-${Math.random().toString(16).slice(2)}` };
}

// SDK export for rates (150 countries)
export { fetchCoinGeckoPrice as fetchFxRateViaCoinGecko } from "./nonCustodial";
