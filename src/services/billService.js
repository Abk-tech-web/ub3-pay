// TODO(integration): VTpass / ClubKonnect for real airtime & data delivery.
// This is a functional mock end-to-end flow (network -> amount -> confirm ->
// "delivered") so the UI/UX is fully built; only the actual delivery call
// to a VTU aggregator is stubbed. See docs/TODO_INTEGRATIONS.md.

export const NETWORKS = [
  { id: 'mtn', name: 'MTN', logoUrl: 'https://raw.githubusercontent.com/josephajibodu/utility-providers-assets/main/network-providers/mtn.png' },
  { id: 'airtel', name: 'Airtel', logoUrl: 'https://wsrv.nl/?url=https://raw.githubusercontent.com/josephajibodu/utility-providers-assets/main/network-providers/airtel.svg&output=png' },
  { id: 'glo', name: 'Glo', logoUrl: 'https://wsrv.nl/?url=https://raw.githubusercontent.com/josephajibodu/utility-providers-assets/main/network-providers/glo.svg&output=png' },
  { id: '9mobile', name: '9mobile', logoUrl: 'https://wsrv.nl/?url=https://raw.githubusercontent.com/josephajibodu/utility-providers-assets/main/network-providers/9mobile.svg&output=png' },
];

export const DATA_PLANS = {
  mtn: {
    daily: [
      { id: 'mtn_d_1gb', label: '1GB - 1 day', priceNgn: 500 },
      { id: 'mtn_d_2_5gb', label: '2.5GB - 2 days', priceNgn: 900 },
    ],
    weekly: [
      { id: 'mtn_w_1gb', label: '1GB - 7 days', priceNgn: 800 },
      { id: 'mtn_w_3_5gb', label: '3.5GB - 7 days', priceNgn: 1500 },
    ],
    monthly: [
      { id: 'mtn_1gb', label: '1GB - 30 days', priceNgn: 850 },
      { id: 'mtn_2gb', label: '2GB - 30 days', priceNgn: 1600 },
      { id: 'mtn_5gb', label: '5GB - 30 days', priceNgn: 3500 },
    ],
  },
  airtel: {
    daily: [
      { id: 'airtel_d_1gb', label: '1GB - 1 day', priceNgn: 500 },
    ],
    weekly: [
      { id: 'airtel_w_1_5gb', label: '1.5GB - 7 days', priceNgn: 1000 },
    ],
    monthly: [
      { id: 'airtel_1gb', label: '1GB - 30 days', priceNgn: 800 },
      { id: 'airtel_3gb', label: '3GB - 30 days', priceNgn: 2100 },
    ],
  },
  glo: {
    daily: [
      { id: 'glo_d_1gb', label: '1GB - 1 day', priceNgn: 450 },
    ],
    weekly: [
      { id: 'glo_w_2gb', label: '2GB - 7 days', priceNgn: 900 },
    ],
    monthly: [
      { id: 'glo_1_5gb', label: '1.5GB - 30 days', priceNgn: 750 },
      { id: 'glo_4_5gb', label: '4.5GB - 30 days', priceNgn: 2000 },
    ],
  },
  '9mobile': {
    daily: [
      { id: '9m_d_1gb', label: '1GB - 1 day', priceNgn: 500 },
    ],
    weekly: [
      { id: '9m_w_1_5gb', label: '1.5GB - 7 days', priceNgn: 1000 },
    ],
    monthly: [
      { id: '9m_1_5gb', label: '1.5GB - 30 days', priceNgn: 900 },
    ],
  },
};

export async function buyAirtime(uid, network, phone, amountNgn) {
  await delay(900);
  return { id: 'airtime_' + Date.now(), status: 'delivered' };
}

export async function buyData(uid, network, phone, planId) {
  await delay(900);
  return { id: 'data_' + Date.now(), status: 'delivered' };
}

function delay(ms) {
  return new Promise((res) => setTimeout(res, ms));
}
