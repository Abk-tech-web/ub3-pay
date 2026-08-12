// Mock wallet service standing in for a real MPC/HSM-backed key-management
// provider (Fireblocks, Coinbase MPC Wallet API) — see README "Key
// management" for why raw seed storage is explicitly not recommended here.
import { CHAINS } from '../config/chains';

export async function getPortfolio(uid) {
  await delay(500);
  return {
    totalUsd: 4820.55,
    totalNgn: 4820.55 * 1610.5,
    assets: [
      { chainId: 'bitcoin', symbol: 'BTC', balance: '0.031', usdValue: 1898.76 },
      { chainId: 'ethereum', symbol: 'ETH', balance: '0.82', usdValue: 2747.15 },
      { chainId: 'ethereum', symbol: 'USDT', balance: '150.00', usdValue: 150.0 },
      { chainId: 'solana', symbol: 'SOL', balance: '2.4', usdValue: 357.4 },
    ],
  };
}

export async function getDepositAddress(uid, chainId) {
  // TODO(integration): request a deposit address from the wallet-infra
  // provider — never generate/store raw keys client-side or on a bare server.
  await delay(300);
  const chain = CHAINS[chainId];
  return { address: `mock_${chain?.adapter ?? 'addr'}_${uid.slice(0, 6)}...`, chainId };
}

export async function estimateNetworkFee(chainId, amount) {
  await delay(250);
  return { feeCrypto: '0.0004', feeUsd: 1.2 };
}

export async function validateAddress(chainId, address) {
  await delay(150);
  return address.length > 10; // TODO(integration): real per-chain checksum validation
}

export async function sendCrypto(uid, chainId, symbol, toAddress, amount) {
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
