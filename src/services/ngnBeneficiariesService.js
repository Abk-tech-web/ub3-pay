import { apiGet, apiPost, apiDelete } from './api';

export async function getNgnRecents() {
  const data = await apiGet('/ngn-beneficiaries/recents');
  return data.recents || [];
}

export async function getNgnFavourites() {
  const data = await apiGet('/ngn-beneficiaries/favourites');
  return data.favourites || [];
}

export async function addNgnFavourite(payload) {
  return apiPost('/ngn-beneficiaries/favourites', payload);
}

export async function removeNgnFavourite(id) {
  return apiDelete('/ngn-beneficiaries/favourites/' + id);
}
