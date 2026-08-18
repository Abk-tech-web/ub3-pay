// Mock wallet service standing in for a real MPC/HSM-backed key-management
// provider (Fireblocks, Coinbase MPC Wallet API) — see README "Key
// management" for why raw seed storage is explicitly not recommended here.
// Balances below are still mock (no real custody yet) but USD values are
// computed from LIVE prices via rateService — not hardcoded.
import { CHAINS } from '../config/chains';
import { getUsdPrice } from './rateService';
import { estimateWithdrawalFee } from './feeService';

// Mock per-chain holdings — one entry per supported chain so the whole
// 15-chain lineup is visible. Swap these for real balances once a wallet
// custody provider is wired in.
const MOCK_HOLDINGS = [
  { chainId: 'bitcoin', symbol: 'BTC', balance: '0.031' },
  { chainId: 'ethereum', symbol: 'ETH', balance: '0.82' },
  { chainId: 'ethereum', symbol: 'USDT', balance: '150.00' },
  { chainId: 'bsc', symbol: 'BNB', balance: '1.4' },
  { chainId: 'solana', symbol: 'SOL', balance: '2.4' },
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

export async function getPortfolio(uid) {
  await delay(300);
  const assets = await Promise.all(
    MOCK_HOLDINGS.map(async (h) => {
      const price = await getUsdPrice(h.symbol);
      const usdValue = price * parseFloat(h.balance);
      return { ...h, usdValue };
    })
  );
  const totalUsd = assets.reduce((sum, a) => sum + a.usdValue, 0);
  return { totalUsd, assets };
}

const API_URL = 'https://ub3-pay-backend.onrender.com';

export async function getDepositAddress(uid, chainId) {
  const response = await fetch(`${API_URL}/wallet/deposit-address/${chainId}/${uid}`);
  const data = await response.json();
  if (response.ok === false) {
    throw new Error(data.error || 'Failed to get deposit address');
  }
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
    { id: 'tx_1', type: 'deposit_crypto', symbol: 'BTC', amount: '0.01', status: 'completed', at: '2026-08-09T11:00:00Z' },
    { id: 'tx_2', type: 'swap_crypto_to_ngn', symbol: 'USDT', amount: '50', status: 'completed', at: '2026-08-05T08:30:00Z' },
  ];
}

function delay(ms) {
  return new Promise((res) => setTimeout(res, ms));
}
