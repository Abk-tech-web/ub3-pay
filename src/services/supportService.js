import { apiGet, apiPost } from './api';

const imageCache = new Map();

export function cacheImage(id, data) {
  if (id) imageCache.set(id, data);
}

export async function getImage(id) {
  if (imageCache.has(id)) return imageCache.get(id);
  const r = await apiGet('/support/image/' + encodeURIComponent(id));
  const d = { base64: r.base64, mime: r.mime || 'image/jpeg' };
  imageCache.set(id, d);
  return d;
}

export const getMyChat = (after) => apiGet('/support/me?after=' + (after || 0));
export const sendMyMessage = (body) => apiPost('/support/message', body);
export const getInbox = () => apiGet('/support/admin/chats');
export const getAdminChat = (uid, after) => apiGet('/support/admin/chat/' + encodeURIComponent(uid) + '?after=' + (after || 0));
export const sendAdminReply = (uid, body) => apiPost('/support/admin/reply/' + encodeURIComponent(uid), body);
export const setChatStatus = (uid, status) => apiPost('/support/admin/status/' + encodeURIComponent(uid), { status: status });
