// Mock auth service. Swap the bodies for real Firebase Auth calls once
// FIREBASE_* env vars are set — the function signatures below are the
// contract the screens are built against, so screens shouldn't need to
// change when this gets wired up for real.

let mockSession = null;

export async function signUpWithEmail(email, password) {
  // TODO(integration): firebase/auth createUserWithEmailAndPassword,
  // then trigger emailService.sendOtp(email) — never rely on Firebase's
  // built-in verification email, per spec section 5.
  await delay(600);
  return { uid: 'mock-uid-' + Date.now(), email, kycStatus: 'unverified' };
}

export async function signInWithEmail(email, password) {
  await delay(600);
  mockSession = { uid: 'mock-uid-1', email, kycStatus: 'unverified' };
  return mockSession;
}

export async function signInWithGoogle() {
  // TODO(integration): expo-auth-session Google provider → Firebase credential
  await delay(600);
  mockSession = { uid: 'mock-uid-google', email: 'demo@ub3pay.app', kycStatus: 'unverified' };
  return mockSession;
}

export async function verifyOtp(email, code) {
  await delay(400);
  return code === '000000' ? { verified: false, reason: 'expired' } : { verified: true };
}

export async function requestPasswordReset(email) {
  // TODO(integration): emailService.sendPasswordResetLink(email)
  await delay(400);
  return { sent: true };
}

export async function signOut() {
  mockSession = null;
}

function delay(ms) {
  return new Promise((res) => setTimeout(res, ms));
}
