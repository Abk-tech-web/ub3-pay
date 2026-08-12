// TODO(integration): replace with a real licensed vendor SDK/API call
// (Smile ID / VerifyMe / Prembly). Do not attempt in-house BVN or document
// verification — see docs/TODO_INTEGRATIONS.md.

export async function submitBvn(bvn) {
  await delay(800);
  return { matched: true, nameOnRecord: 'Mock User' };
}

export async function submitDocument(documentType, imageUri) {
  await delay(1200);
  // Real providers auto-reject forged/tampered docs and flag borderline
  // cases for manual review rather than auto-approving.
  return { authentic: true, status: 'pending' };
}

export async function submitLiveness(selfieUri) {
  await delay(1000);
  return { faceMatchScore: 0.94, passed: true };
}

export async function getKycStatus(uid) {
  await delay(300);
  return { status: 'pending' }; // unverified | pending | approved | rejected | manual_review
}

function delay(ms) {
  return new Promise((res) => setTimeout(res, ms));
}
