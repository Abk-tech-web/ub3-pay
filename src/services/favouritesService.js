import { apiGet, apiPost, apiDelete } from './api';

export async function getFavourites() {
  const data = await apiGet('/favourites');
  return data.favourites || [];
}

export async function addFavourite(label, address) {
  return apiPost('/favourites', { label, address });
}

export async function removeFavourite(id) {
  return apiDelete(`/favourites/${id}`);
}

export async function getRecents() {
  const data = await apiGet('/recents');
  return data.recents || [];
}
