// TODO(integration): VTpass / ClubKonnect for real airtime & data delivery.
// This is a functional mock end-to-end flow (network → amount → confirm →
// "delivered") so the UI/UX is fully built; only the actual delivery call
// to a VTU aggregator is stubbed. See docs/TODO_INTEGRATIONS.md.

export const NETWORKS = [
  { id: 'mtn', name: 'MTN' },
  { id: 'airtel', name: 'Airtel' },
  { id: 'glo', name: 'Glo' },
  { id: '9mobile', name: '9mobile' },
];

export const DATA_PLANS = {
  mtn: [
    { id: 'mtn_1gb', label: '1GB — 30 days', priceNgn: 850 },
    { id: 'mtn_2gb', label: '2GB — 30 days', priceNgn: 1600 },
    { id: 'mtn_5gb', label: '5GB — 30 days', priceNgn: 3500 },
  ],
  airtel: [
    { id: 'airtel_1gb', label: '1GB — 30 days', priceNgn: 800 },
    { id: 'airtel_3gb', label: '3GB — 30 days', priceNgn: 2100 },
  ],
  glo: [
    { id: 'glo_1_5gb', label: '1.5GB — 30 days', priceNgn: 750 },
    { id: 'glo_4_5gb', label: '4.5GB — 30 days', priceNgn: 2000 },
  ],
  '9mobile': [
    { id: '9m_1_5gb', label: '1.5GB — 30 days', priceNgn: 900 },
  ],
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
