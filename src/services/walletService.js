import { apiPost } from './api';

async function withdrawFunds({ uid, amount, account_number, bank_code, name, reason }) {
  return apiPost('/withdraw', { uid, amount, account_number, bank_code, name, reason });
}

export { withdrawFunds };
