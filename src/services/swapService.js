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

export async function executeCryptoToNgn(uid, symbol, chainId, amountCrypto, quote) {
  // TODO(integration): debit in-app crypto balance, credit NGN balance,
  // write an immutable transactions/{id} record keyed by idempotencyKey,
  // and credit quote.revenueNgn to the connected revenue wallet ledger.
  await delay(900);
  return { id: 'swap_' + Date.now(), status: 'completed' };
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
  await delay(900);
  return { id: 'swap_' + Date.now(), status: 'completed' };
}

function delay(ms) {
  return new Promise((res) => setTimeout(res, ms));
}
