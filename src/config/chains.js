// Data-driven chain/token registry. Add a chain by adding an entry here —
// no screen or service should hardcode a chain list elsewhere.
export const CHAINS = {
  bitcoin:   { id: 'bitcoin',   name: 'Bitcoin',    symbol: 'BTC',  standard: null,        adapter: 'bitcoin',  explorer: 'https://mempool.space/tx/' },
  ethereum:  { id: 'ethereum',  name: 'Ethereum',   symbol: 'ETH',  standard: 'ERC-20',    adapter: 'evm',      explorer: 'https://etherscan.io/tx/' },
  bsc:       { id: 'bsc',       name: 'BNB Smart Chain', symbol: 'BNB', standard: 'BEP-20', adapter: 'evm',     explorer: 'https://bscscan.com/tx/' },
  solana:    { id: 'solana',    name: 'Solana',     symbol: 'SOL',  standard: 'SPL',       adapter: 'solana',   explorer: 'https://solscan.io/tx/' },
  tron:      { id: 'tron',      name: 'Tron',       symbol: 'TRX',  standard: 'TRC-20',    adapter: 'tron',     explorer: 'https://tronscan.org/#/transaction/' },
  polygon:   { id: 'polygon',   name: 'Polygon',    symbol: 'MATIC',standard: null,        adapter: 'evm',      explorer: 'https://polygonscan.com/tx/' },
  sui:       { id: 'sui',       name: 'Sui',        symbol: 'SUI',  standard: null,        adapter: 'sui',      explorer: 'https://suiscan.xyz/tx/' },
  ton:       { id: 'ton',       name: 'TON',        symbol: 'TON',  standard: null,        adapter: 'ton',      explorer: 'https://tonscan.org/tx/' },
  avalanche: { id: 'avalanche', name: 'Avalanche',  symbol: 'AVAX', standard: 'C-Chain',   adapter: 'evm',      explorer: 'https://snowtrace.io/tx/' },
  arbitrum:  { id: 'arbitrum',  name: 'Arbitrum',   symbol: 'ETH',  standard: null,        adapter: 'evm',      explorer: 'https://arbiscan.io/tx/' },
  optimism:  { id: 'optimism',  name: 'Optimism',   symbol: 'ETH',  standard: null,        adapter: 'evm',      explorer: 'https://optimistic.etherscan.io/tx/' },
  base:      { id: 'base',      name: 'Base',       symbol: 'ETH',  standard: null,        adapter: 'evm',      explorer: 'https://basescan.org/tx/' },
  cardano:   { id: 'cardano',   name: 'Cardano',    symbol: 'ADA',  standard: null,        adapter: 'cardano',  explorer: 'https://cardanoscan.io/transaction/' },
  litecoin:  { id: 'litecoin',  name: 'Litecoin',   symbol: 'LTC',  standard: null,        adapter: 'bitcoin',  explorer: 'https://blockchair.com/litecoin/transaction/' },
  ripple:    { id: 'ripple',    name: 'Ripple',     symbol: 'XRP',  standard: null,        adapter: 'ripple',   explorer: 'https://xrpscan.com/tx/' },
};

// Stablecoins mapped to the chains they're deployed on. `chainId` here
// must match a key in CHAINS above.
export const STABLECOINS = [
  { symbol: 'USDT', name: 'Tether', chains: ['ethereum', 'tron', 'bsc', 'solana', 'ton'] },
  { symbol: 'USDC', name: 'USD Coin', chains: ['ethereum', 'solana', 'base', 'polygon'] },
];

export function getChain(chainId) {
  return CHAINS[chainId] ?? null;
}

export function listAssetsForChain(chainId) {
  const native = CHAINS[chainId];
  const stables = STABLECOINS.filter((s) => s.chains.includes(chainId))
    .map((s) => ({ symbol: s.symbol, name: s.name, isStable: true }));
  return native ? [{ symbol: native.symbol, name: native.name, isStable: false }, ...stables] : stables;
}
