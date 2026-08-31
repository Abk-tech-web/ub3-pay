// Mock wallet service standing in for a real MPC/HSM-backed key-management
// provider (Fireblocks, Coinbase MPC Wallet API) - see README "Key
// management" for why raw seed storage is explicitly not recommended here.
// Balances below are still mock (no real custody yet) but USD values are
// computed from LIVE prices via rateService - not hardcoded.
import { CHAINS } from '../config/chains';
import { getUsdPrice, getAllUsdPrices } from './rateService';
import { estimateWithdrawalFee } from './feeService';
import { apiPost } from './api';

// Mock per-chain holdings - one entry per supported chain so the whole
// 15-chain lineup is visible. Swap these for real balances once a wallet
// custody provider is wired in.
const MOCK_HOLDINGS = [
  { chainId: 'solana', symbol: 'SOL', balance: '2.4' },
  { chainId: 'ethereum', symbol: 'USDT', balance: '150.00' },
  { chainId: 'ethereum', symbol: 'USDC', balance: '75.00' },
  { chainId: 'bsc', symbol: 'BNB', balance: '1.4' },
  { chainId: 'bitcoin', symbol: 'BTC', balance: '0.031' },
  { chainId: 'ethereum', symbol: 'ETH', balance: '0.82' },
  { chainId: 'tron', symbol: 'TRX', balance: '820' },
  { chainId: 'polygon', symbol: 'MATIC', balance: '340' },
  { chainId: 'sui', symbol: 'SUI', balance: '95' },
  { chainId: 'ton', symbol: 'TON', balance: '18' },
  { chainId: 'avalanche', symbol: 'AVAX', balance: '6.5' },
  { chainId: 'arbitrum', symbol: 'ETH', balance: '0.05' },
  { chainId: 'optimism', symbol: 'ETH', balance: '0.03' },
  { chainId: 'base', symbol: 'ETH', balance: '0.02' },
  { chainId: 'cardano', symbol: 'ADA', balance: '410' },
  { chainId: 'litecoin', symbol: 'LTC', balance: '1.1' },
  { chainId: 'ripple', symbol: 'XRP', balance: '260' },
];
  await delay(300);
  const prices = await getAllUsdPrices();
  const assets = MOCK_HOLDINGS.map((h) => {
    const p = prices[h.symbol] || { usd: 0, change24h: 0 };
    const usdValue = p.usd * parseFloat(h.balance);
    const change24h = p.change24h;
    const pnl24hUsd = usdValue * (change24h / (100 + change24h));
    return { ...h, usdValue, change24h, pnl24hUsd };
  });
  const totalUsd = assets.reduce((sum, a) => sum + a.usdValue, 0);
  const totalPnl24hUsd = assets.reduce((sum, a) => sum + a.pnl24hUsd, 0);
  return { totalUsd, totalPnl24hUsd, assets };
}

// Groups per-chain asset rows into one row per symbol, for the Portfolio
// screen's asset list (multi-chain tokens like ETH/USDT show as a single
// row with a "N Networks" label instead of one row per chain).
export function groupAssetsBySymbol(assets) {
  const groups = {};
  for (const a of assets) {
    if (!groups[a.symbol]) {
      groups[a.symbol] = {
        symbol: a.symbol,
        chainId: a.chainId,
        balance: 0,
        usdValue: 0,
        pnl24hUsd: 0,
        networkCount: 0,
      };
    }
    const g = groups[a.symbol];
    g.balance += parseFloat(a.balance) || 0;
    g.usdValue += a.usdValue || 0;
    g.pnl24hUsd += a.pnl24hUsd || 0;
    g.networkCount += 1;
  }
  return Object.values(groups).map((g) => {
    const priorUsdValue = g.usdValue - g.pnl24hUsd;
    const change24h = priorUsdValue !== 0 ? (g.pnl24hUsd / priorUsdValue) * 100 : 0;
    return { ...g, change24h };
  });
}

const API_URL = 'https://ub3-pay-backend.onrender.com';

const depositAddressCache = {};
export async function getDepositAddress(uid, chainId) {
  const cacheKey = `${uid}_${chainId}`;
  if (depositAddressCache[cacheKey]) return depositAddressCache[cacheKey];
  const response = await fetch(`${API_URL}/wallet/deposit-address/${chainId}/${uid}`);
  const data = await response.json();
  if (response.ok === false) {
    throw new Error(data.error || 'Failed to get deposit address');
  }
  depositAddressCache[cacheKey] = data;
  return data;
}

export async function estimateNetworkFee(chainId) {
  return estimateWithdrawalFee(chainId);
}

export async function validateAddress(chainId, address) {
  await delay(150);
  return address.length > 10; // TODO(integration): real per-chain checksum validation
}

export async function sendCrypto(uid, chainId, symbol, toAddress, amount) {
  // TODO(integration): broadcast via wallet-infra provider, and credit the
  // $0.10 revenue-fee portion (see feeService) to the connected revenue wallet.
  await delay(1000);
  return { id: 'tx_' + Date.now(), status: 'processing', txHash: null };
}

export async function getTransactionHistory(uid) {
  await delay(400);
  return [
    { id: 'tx_1', type: 'deposit_crypto', symbol: 'BTC', chainId: 'bitcoin', txHash: '3a7f...9e21', amount: '0.01', direction: 'in', status: 'completed', at: '2026-08-09T11:00:00Z' },
    { id: 'tx_2', type: 'swap_crypto_to_ngn', symbol: 'USDT', chainId: 'ethereum', txHash: '0x8c2b...f471', amount: '50', direction: 'out', status: 'completed', at: '2026-08-05T08:30:00Z' },
  ];
}

async function withdrawFunds({ uid, amount, account_number, bank_code, name, reason }) {
  return apiPost('/withdraw', { uid, amount, account_number, bank_code, name, reason });
}

function delay(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

export { withdrawFunds };
