import { getCryptoToNgnRate, getNgnToCryptoRate } from './rateService';

// Both directions require an explicit confirm step — see quoteXxx vs
// executeXxx below. Nothing here auto-converts on deposit.

export async function quoteCryptoToNgn(symbol, amountCrypto) {
  const rate = await getCryptoToNgnRate(symbol);
  const amountNgn = amountCrypto * rate;
  return { rate, amountNgn, feeNgn: amountNgn * 0.005 };
}

export async function executeCryptoToNgn(uid, symbol, chainId, amountCrypto, quote) {
  // TODO(integration): debit in-app crypto balance, credit NGN balance,
  // write an immutable transactions/{id} record keyed by idempotencyKey.
  await delay(900);
  return { id: 'swap_' + Date.now(), status: 'completed' };
}

export async function quoteNgnToCrypto(symbol, amountNgn) {
  const rate = await getNgnToCryptoRate(symbol);
  const amountCrypto = amountNgn / rate;
  return { rate, amountCrypto, feeNgn: amountNgn * 0.005 };
}

export async function executeNgnToCrypto(uid, symbol, chainId, amountNgn, quote, destination = 'in_app') {
  await delay(900);
  return { id: 'swap_' + Date.now(), status: 'completed' };
}

function delay(ms) {
  return new Promise((res) => setTimeout(res, ms));
}
