// TODO(integration): replace submitBvn/submitDocument/submitLiveness with
// a real licensed vendor SDK/API call (Smile ID / VerifyMe / Prembly) — do
// not attempt in-house BVN or document verification. See
// docs/TODO_INTEGRATIONS.md. Status IS now real Firestore state, even
// though the verification decision itself is still mocked.
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from './firebase';

export async function submitBvn(bvn) {
  await delay(800);
  return { matched: true, nameOnRecord: 'Mock User' };
}

export async function submitDocument(documentType, imageUri) {
  await delay(1200);
  return { authentic: true, status: 'pending' };
}

export async function submitLiveness(selfieUri) {
  await delay(1000);
  return { faceMatchScore: 0.94, passed: true };
}

export async function getKycStatus(uid) {
  const snap = await getDoc(doc(db, 'users', uid));
  return { status: snap.exists() ? snap.data().kycStatus ?? 'unverified' : 'unverified' };
}

// TODO(integration): this should be a Cloud Function triggered by the
// vendor's webhook, not something the client calls directly — a client
// should never be able to mark its own KYC as approved in a real deployment.
export async function setKycStatus(uid, status) {
  await updateDoc(doc(db, 'users', uid), { kycStatus: status });
}

function delay(ms) {
  return new Promise((res) => setTimeout(res, ms));
}
