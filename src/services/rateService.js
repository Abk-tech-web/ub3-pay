// TODO(integration): CoinGecko or Binance API, cached server-side with a
// short TTL so portfolio and swap screens never disagree on price.

const MOCK_RATES_USD = {
  BTC: 61250.32, ETH: 3350.18, BNB: 578.4, SOL: 148.92, TRX: 0.132,
  MATIC: 0.58, SUI: 3.41, TON: 6.87, AVAX: 27.15, ADA: 0.46,
  LTC: 82.3, XRP: 0.61, USDT: 1.0, USDC: 1.0,
};
const MOCK_USD_NGN = 1610.5;

export async function getUsdRate(symbol) {
  await delay(200);
  return MOCK_RATES_USD[symbol] ?? 0;
}

export async function getUsdToNgnRate() {
  await delay(200);
  return MOCK_USD_NGN;
}

// margin is applied on top of the raw market rate — configurable per spec section 4
export async function getCryptoToNgnRate(symbol, marginBps = 150) {
  const usd = await getUsdRate(symbol);
  const usdNgn = await getUsdToNgnRate();
  const raw = usd * usdNgn;
  return raw * (1 - marginBps / 10000);
}

export async function getNgnToCryptoRate(symbol, marginBps = 150) {
  const usd = await getUsdRate(symbol);
  const usdNgn = await getUsdToNgnRate();
  const raw = usd * usdNgn;
  return raw * (1 + marginBps / 10000);
}

function delay(ms) {
  return new Promise((res) => setTimeout(res, ms));
}
