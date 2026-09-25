import { apiGet } from './api';

// TODO(integration): Paystack / Flutterwave / Monnify virtual account API.
// Webhook handling (deposit confirmation) belongs server-side, not here —
// this module is only the client-facing read/request surface.

export async function getNairaAccount(uid) {
  await delay(400);
  return {
    accountNumber: '9012345678',
    bankName: 'Providus Bank (via Paystack)',
    accountName: 'UB3 PAY / MOCK USER',
  };
}

export async function getDepositHistory(uid) {
  const data = await apiGet('/ngn-deposits');
  return data.deposits || [];
}

export async function initiateNgnWithdrawal(uid, amountNgn, bankDetails) {
  await delay(700);
  return { id: 'wd_' + Date.now(), status: 'processing' };
}

function delay(ms) {
  return new Promise((res) => setTimeout(res, ms));
}
