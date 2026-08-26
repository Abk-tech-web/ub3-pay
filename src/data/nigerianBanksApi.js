const BANKS_URL = 'https://nigerianbanks.xyz';

let cachedBanks = null;

export async function fetchNigerianBanks() {
  if (cachedBanks) return cachedBanks;
  try {
    const res = await fetch(BANKS_URL);
    const data = await res.json();
    cachedBanks = data.map((b) => ({
      name: b.name,
      code: b.code,
      slug: b.slug,
      logo: b.logo && !b.logo.includes('default-image') ? b.logo : null,
    }));
    return cachedBanks;
  } catch (err) {
    console.error('Failed to fetch bank list', err);
    return [];
  }
}
