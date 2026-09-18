// Deterministic color per user id, so the same user always gets the same
// avatar color, and different users are visually distinct from each other.
const PALETTE = [
  '#7C3AED', '#2563EB', '#059669', '#DC2626',
  '#D97706', '#DB2777', '#0891B2', '#65A30D',
];

export function getAvatarColor(uid) {
  if (!uid) return PALETTE[0];
  let hash = 0;
  for (let i = 0; i < uid.length; i++) {
    hash = (hash << 5) - hash + uid.charCodeAt(i);
    hash |= 0;
  }
  return PALETTE[Math.abs(hash) % PALETTE.length];
}
