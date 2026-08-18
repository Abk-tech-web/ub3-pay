// Withdrawal fee logic: blockchainFee (what the network actually charges)
// + a flat $0.10 revenue margin on top, per spec. The blockchain fee
// itself is still an ESTIMATE below — a real figure requires a live quote
// from the chain's RPC/wallet-infra provider (see docs/TODO_INTEGRATIONS.md).
// Only the $0.10 revenue margin is a fixed, real business rule; the
// network-fee number next to it is not live yet.
import { CHAINS } from '../config/chains';

const REVENUE_MARGIN_USD = 0.10;

// Rough placeholder network fees by chain, in USD — TODO(integration):
// replace with a real fee estimate from each chain's RPC provider.
const ESTIMATED_NETWORK_FEE_USD = {
  bitcoin: 1.20, ethereum: 2.50, bsc: 0.15, solana: 0.01, tron: 0.05,
  polygon: 0.02, sui: 0.01, ton: 0.02, avalanche: 0.10, arbitrum: 0.30,
  optimism: 0.30, base: 0.05, cardano: 0.20, litecoin: 0.05, ripple: 0.01,
};

export function getMarginUsd() {
  return REVENUE_MARGIN_USD;
}

export async function estimateWithdrawalFee(chainId) {
  await delay(200);
  const networkFeeUsd = ESTIMATED_NETWORK_FEE_USD[chainId] ?? 0.50;
  const totalFeeUsd = networkFeeUsd + REVENUE_MARGIN_USD;
  return {
    networkFeeUsd,
    revenueFeeUsd: REVENUE_MARGIN_USD,
    totalFeeUsd,
    chainName: CHAINS[chainId]?.name ?? chainId,
  };
}

function delay(ms) {
  return new Promise((res) => setTimeout(res, ms));
}
