import { apiGet, apiPost } from "./api";

export const NETWORKS = [
  { id: "mtn", name: "MTN", logoUrl: "https://raw.githubusercontent.com/josephajibodu/utility-providers-assets/main/network-providers/mtn.png" },
  { id: "airtel", name: "Airtel", logoUrl: "https://wsrv.nl/?url=https://raw.githubusercontent.com/josephajibodu/utility-providers-assets/main/network-providers/airtel.svg&output=png" },
  { id: "glo", name: "Glo", logoUrl: "https://wsrv.nl/?url=https://raw.githubusercontent.com/josephajibodu/utility-providers-assets/main/network-providers/glo.svg&output=png" },
  { id: "9mobile", name: "9mobile", logoUrl: "https://wsrv.nl/?url=https://raw.githubusercontent.com/josephajibodu/utility-providers-assets/main/network-providers/9mobile.svg&output=png" },
];

// Maps our network id to VTpass's data serviceID naming
const DATA_SERVICE_IDS = {
  mtn: "mtn-data",
  airtel: "airtel-data",
  glo: "glo-data",
  "9mobile": "etisalat-data",
};

export async function getDataVariations(networkId) {
  const serviceID = DATA_SERVICE_IDS[networkId];
  const result = await apiGet(`/data/variations/${serviceID}`);
  // VTpass returns { content: { variations: [{ variation_code, name, variation_amount }] } }
  const variations = result?.content?.variations || [];
  return variations.map((v) => ({
    id: v.variation_code,
    label: v.name,
    priceNgn: parseFloat(v.variation_amount),
  }));
}

export async function buyAirtime(uid, network, phone, amountNgn) {
  return apiPost("/airtime", { uid, phone, amount: amountNgn, serviceID: network });
}

export async function buyData(uid, network, phone, variationCode) {
  const serviceID = DATA_SERVICE_IDS[network];
  return apiPost("/data", { uid, phone, serviceID, variation_code: variationCode });
}
