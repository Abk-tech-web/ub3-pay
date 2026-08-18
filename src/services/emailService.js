// TODO(integration): route every call below through SendGrid / Postmark /
// SES using EMAIL_API_KEY, EMAIL_FROM_ADDRESS, EMAIL_FROM_NAME from .env.
// Configure SPF/DKIM/DMARC on the sending domain before going live so mail
// lands in the primary inbox. Never use Firebase's default sender identity.

export async function sendOtp(email, code) {
  console.log(`[mock email] OTP ${code} → ${email}`);
  return { queued: true };
}

export async function sendPasswordResetLink(email, link) {
  console.log(`[mock email] password reset link → ${email}`);
  return { queued: true };
}

export async function sendKycStatusUpdate(email, status) {
  console.log(`[mock email] KYC status "${status}" → ${email}`);
  return { queued: true };
}

export async function sendTransactionAlert(email, transaction) {
  console.log(`[mock email] transaction alert → ${email}`, transaction.id);
  return { queued: true };
}
