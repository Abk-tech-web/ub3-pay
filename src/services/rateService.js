// LIVE data. This file makes real network calls — no mock numbers below.
//
// Prices: CoinGecko public API (no key required, free tier — fine for
// moderate traffic; if this app scales, move to a paid tier or cache
// server-side so every client isn't hitting CoinGecko directly).
// FX:     open.er-api.com public API (no key required) for USD→NGN.
//
// Revenue model (as specified): a flat NGN 20 spread is applied per $1 of
// value converted, on top of the live mid-market rate — not a percentage.
// Example: $10 converted → NGN 200 goes to Ub3 Pay's revenue wallet.
import { CHAINS, STABLECOINS } from '../config/chains';

const COINGECKO_IDS = {
  BTC: 'bitcoin', ETH: 'ethereum', BNB: 'binancecoin', SOL: 'solana',
  TRX: 'tron', MATIC: 'matic-network', SUI: 'sui', TON: 'the-open-network',
  AVAX: 'avalanche-2', ADA: 'cardano', LTC: 'litecoin', XRP: 'ripple',
  USDT: 'tether', USDC: 'usd-coin',
};

const NGN_MARGIN_PER_USD = 20; // ₦20 revenue per $1 converted, per spec

let priceCache = { data: null, at: 0 };
let fxCache = { rate: null, at: 0 };
const CACHE_TTL_MS = 30_000;

export async function getAllUsdPrices() {
  if (priceCache.data && Date.now() - priceCache.at < CACHE_TTL_MS) {
    return priceCache.data;
  }
  const ids = Object.values(COINGECKO_IDS).join(',');
  const res = await fetch(
    `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`
  );
  if (!res.ok) throw new Error(`CoinGecko error: ${res.status}`);
  const json = await res.json();
  const bySymbol = {};
  for (const [symbol, id] of Object.entries(COINGECKO_IDS)) {
    if (json[id]) {
      bySymbol[symbol] = { usd: json[id].usd, change24h: json[id].usd_24h_change ?? 0 };
    }
  }
  priceCache = { data: bySymbol, at: Date.now() };
  return bySymbol;
}

export async function getUsdPrice(symbol) {
  const prices = await getAllUsdPrices();
  return prices[symbol]?.usd ?? 0;
}

// Live USD → NGN mid-market rate, no margin applied — this is the raw rate.
export async function getMidMarketUsdToNgn() {
  if (fxCache.rate && Date.now() - fxCache.at < CACHE_TTL_MS) {
    return fxCache.rate;
  }
  const res = await fetch('https://open.er-api.com/v6/latest/USD');
  if (!res.ok) throw new Error(`FX rate error: ${res.status}`);
  const json = await res.json();
  const rate = json?.rates?.NGN;
  if (!rate) throw new Error('NGN rate not found in FX response');
  fxCache = { rate, at: Date.now() };
  return rate;
}

// Rate a user gets buying crypto with NGN (they pay MORE naira per dollar
// of crypto than the mid rate — the ₦20 margin is revenue).
export async function getNgnToCryptoRate(symbol) {
  const usd = await getUsdPrice(symbol);
  const midUsdNgn = await getMidMarketUsdToNgn();
  const userUsdNgn = midUsdNgn + NGN_MARGIN_PER_USD;
  return usd * userUsdNgn;
}

// Rate a user gets selling crypto for NGN (they receive LESS naira per
// dollar of crypto than the mid rate — again, the ₦20 margin is revenue).
export async function getCryptoToNgnRate(symbol) {
  const usd = await getUsdPrice(symbol);
  const midUsdNgn = await getMidMarketUsdToNgn();
  const userUsdNgn = midUsdNgn - NGN_MARGIN_PER_USD;
  return usd * userUsdNgn;
}

export function getMarginPerUsd() {
  return NGN_MARGIN_PER_USD;
}

export { COINGECKO_IDS };

const CHART_TTL_MS = 60_000;
let chartCache = {};

function daysForTimeframe(tf) {
  switch (tf) {
    case '1H': return 1;
    case '1D': return 1;
    case '1W': return 7;
    case '1M': return 30;
    case '1Y': return 365;
    case 'ALL': return 'max';
    default: return 1;
  }
}

export async function getMarketChart(symbol, timeframe = '1D') {
  const id = COINGECKO_IDS[symbol];
  if (!id) throw new Error(`No CoinGecko id for symbol ${symbol}`);

  const cacheKey = `${symbol}_${timeframe}`;
  const cached = chartCache[cacheKey];
  if (cached && Date.now() - cached.at < CHART_TTL_MS) {
    return cached.data;
  }

  const days = daysForTimeframe(timeframe);
  const res = await fetch(
    `https://api.coingecko.com/api/v3/coins/${id}/market_chart?vs_currency=usd&days=${days}`
  );
  if (!res.ok) throw new Error(`CoinGecko chart error: ${res.status}`);
  const json = await res.json();
  let points = (json.prices || []).map(([timestamp, price]) => ({ timestamp, price }));

  if (timeframe === '1H') {
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    points = points.filter((p) => p.timestamp >= oneHourAgo);
  }

  chartCache[cacheKey] = { data: points, at: Date.now() };
  return points;
}
