// TODO(integration): bitcoin chain adapter.
// Implement address derivation, balance fetch, and tx broadcast here using
// either a wallet-infra provider (recommended, see README) or a direct SDK
// (e.g. bitcoinjs-lib).
// Every adapter exports the same shape so walletService.js stays chain-agnostic.

export async function deriveAddress(uid) {
  throw new Error("bitcoin adapter not implemented — see docs/TODO_INTEGRATIONS.md");
}

export async function getBalance(address) {
  throw new Error("bitcoin adapter not implemented — see docs/TODO_INTEGRATIONS.md");
}

export async function broadcastTransaction(signedTx) {
  throw new Error("bitcoin adapter not implemented — see docs/TODO_INTEGRATIONS.md");
}
