// Configuration for the operational wallets a real deployment needs:
// - Revenue wallet: receives the margin/fee revenue this app generates
// - Liquidity wallet: the pool crypto buys/sells settle against
// - Naira settlement account: where NGN volume settles
//
// IMPORTANT: setting an address here only stores a reference — it does
// NOT connect a signing key or move real funds. Actually routing revenue
// to these wallets requires a wallet-infra/custody provider (Fireblocks,
// Coinbase MPC, etc. — see README "Key management") wired into
// walletService.js. This screen is the config surface for when that
// integration exists.
import * as SecureStore from 'expo-secure-store';

const KEYS = {
  revenue: 'wallet_config_revenue',
  liquidity: 'wallet_config_liquidity',
  naira: 'wallet_config_naira',
};

export async function getWalletConfig() {
  const [revenue, liquidity, naira] = await Promise.all([
    SecureStore.getItemAsync(KEYS.revenue),
    SecureStore.getItemAsync(KEYS.liquidity),
    SecureStore.getItemAsync(KEYS.naira),
  ]);
  return { revenueWallet: revenue ?? '', liquidityWallet: liquidity ?? '', nairaAccount: naira ?? '' };
}

export async function setRevenueWallet(address) {
  await SecureStore.setItemAsync(KEYS.revenue, address);
}

export async function setLiquidityWallet(address) {
  await SecureStore.setItemAsync(KEYS.liquidity, address);
}

export async function setNairaSettlementAccount(details) {
  await SecureStore.setItemAsync(KEYS.naira, details);
}
