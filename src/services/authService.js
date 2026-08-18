// Real Firebase Authentication — no more mock session objects.
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  reload,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase';

// Creates the Firestore users/{uid} profile doc on first sign-up. Kept
// separate from Auth itself since Auth only knows email/password — every
// other field (kycStatus, etc.) lives in Firestore.
async function createUserProfile(uid, email) {
  await setDoc(doc(db, 'users', uid), {
    uid,
    email,
    kycStatus: 'unverified',
    createdAt: serverTimestamp(),
  });
}

export async function getUserProfile(uid) {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? snap.data() : null;
}

export async function signUpWithEmail(email, password) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await createUserProfile(cred.user.uid, email);
  // Real verification email from Firebase — no custom SendGrid/OTP wired
  // up yet, so this uses Firebase's built-in link-based verification
  // rather than a 6-digit code (Firebase Auth doesn't do numeric email
  // OTPs natively — only link-based verification or phone SMS codes).
  await sendEmailVerification(cred.user);
  return cred.user;
}

export async function signInWithEmail(email, password) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

export async function resendVerificationEmail() {
  if (auth.currentUser) await sendEmailVerification(auth.currentUser);
}

// Firebase doesn't push verification status to the client automatically —
// call this after the user says "I clicked the link" to pull fresh state.
export async function refreshEmailVerifiedStatus() {
  if (!auth.currentUser) return false;
  await reload(auth.currentUser);
  return auth.currentUser.emailVerified;
}

export async function requestPasswordReset(email) {
  await sendPasswordResetEmail(auth, email);
}

export async function signOut() {
  await firebaseSignOut(auth);
}

// Subscribes to real Firebase auth state — fires on sign-in, sign-out,
// and app restart with a persisted session. Returns the unsubscribe fn.
export function subscribeToAuthState(callback) {
  return onAuthStateChanged(auth, callback);
}
