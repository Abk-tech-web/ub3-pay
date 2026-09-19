import { apiPost } from './api';
import { getCryptoToNgnRate, getNgnToCryptoRate, getMarginPerUsd, getUsdPrice } from './rateService';

// Both directions require an explicit confirm step — see quoteXxx vs
// executeXxx below. Nothing here auto-converts on deposit.
//
// The "fee" shown to the user IS the revenue margin baked into the rate
// (see rateService) — surfaced here as an explicit line item so it's
// transparent, and so it can be booked to the revenue wallet on execute.

export async function quoteCryptoToNgn(symbol, amountCrypto) {
  const rate = await getCryptoToNgnRate(symbol);
  const usd = await getUsdPrice(symbol);
  const marginPerUsd = getMarginPerUsd();
  const amountNgn = amountCrypto * rate;
  const revenueNgn = amountCrypto * usd * marginPerUsd;
  return { rate, amountNgn, revenueNgn };
}

const CHAIN_BY_SYMBOL = { SOL: 'solana', ETH: 'ethereum', MATIC: 'polygon', AVAX: 'avalanche' };

function resolveChain(symbol, chainId) {
  const c = chainId || CHAIN_BY_SYMBOL[symbol];
  if (!c) throw new Error(symbol + ' swaps are not available yet');
  return c;
}

// Real swap: the backend computes the rate and moves the funds; its payout replaces the quote figure.
export async function executeCryptoToNgn(uid, symbol, chainId, amountCrypto, quote) {
  const data = await apiPost('/sell', { chainId: resolveChain(symbol, chainId), cryptoAmount: Number(amountCrypto) });
  if (quote && data.ngnPayout != null) quote.amountNgn = Number(data.ngnPayout);
  return { id: data.txHash || 'swap_' + Date.now(), status: 'completed', txHash: data.txHash };
}

export async function quoteNgnToCrypto(symbol, amountNgn) {
  const rate = await getNgnToCryptoRate(symbol);
  const usd = await getUsdPrice(symbol);
  const marginPerUsd = getMarginPerUsd();
  const amountCrypto = amountNgn / rate;
  const revenueNgn = amountCrypto * usd * marginPerUsd;
  return { rate, amountCrypto, revenueNgn };
}

export async function executeNgnToCrypto(uid, symbol, chainId, amountNgn, quote, destination = 'in_app') {
  const data = await apiPost('/buy', { chainId: resolveChain(symbol, chainId), ngnAmount: Number(amountNgn) });
  const got = data.cryptoAmount != null ? data.cryptoAmount : data.amountCrypto;
  if (quote && got != null) quote.amountCrypto = Number(got);
  return { id: data.txHash || 'swap_' + Date.now(), status: 'completed', txHash: data.txHash };
}

function delay(ms) {
  return new Promise((res) => setTimeout(res, ms));
}
