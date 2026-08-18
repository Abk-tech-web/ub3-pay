import { CHAINS } from '../config/chains';

const API_URL = 'https://ub3-pay-backend.onrender.com';

// ... getPortfolio stays the same ...

export async function getDepositAddress(uid, chainId) {
  const response = await fetch(`${API_URL}/wallet/deposit-address/${chainId}/${uid}`);
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to get deposit address');
  }
  return data; // { address, chainId }
}

// ... everything else stays the same ...
