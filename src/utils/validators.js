export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isStrongPassword(password) {
  // min 8 chars, at least one number and one letter
  return password.length >= 8 && /[a-zA-Z]/.test(password) && /[0-9]/.test(password);
}

export function isValidPin(pin) {
  return /^\d{6}$/.test(pin);
}

export function isValidBvn(bvn) {
  return /^\d{11}$/.test(bvn);
}

export function isPositiveAmount(value) {
  const n = parseFloat(value);
  return !Number.isNaN(n) && n > 0;
}
