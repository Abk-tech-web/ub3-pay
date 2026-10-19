import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

let LA = null;
try { LA = require('expo-local-authentication'); } catch (e) { LA = null; }

async function get(key) { try { return await SecureStore.getItemAsync(key); } catch (e) { return null; } }
async function set(key, v) { try { await SecureStore.setItemAsync(key, v); } catch (e) {} }

export async function biometricAvailable() {
  try {
    if (!LA) return false;
    const hw = await LA.hasHardwareAsync();
    const enrolled = await LA.isEnrolledAsync();
    return !!(hw && enrolled);
  } catch (e) { return false; }
}

export async function biometricLabel() {
  try {
    const types = await LA.supportedAuthenticationTypesAsync();
    if (types.includes(LA.AuthenticationType.FACIAL_RECOGNITION) && !types.includes(LA.AuthenticationType.FINGERPRINT)) {
      return Platform.OS === 'ios' ? 'Face ID' : 'Face unlock';
    }
    if (types.includes(LA.AuthenticationType.FINGERPRINT)) return 'Fingerprint';
    if (types.includes(LA.AuthenticationType.FACIAL_RECOGNITION)) return Platform.OS === 'ios' ? 'Face ID' : 'Face unlock';
  } catch (e) {}
  return 'Biometrics';
}

export async function authenticate(message) {
  try {
    if (!LA) return false;
    const r = await LA.authenticateAsync({
      promptMessage: message || 'Unlock UB3 Pay',
      cancelLabel: 'Use PIN',
      disableDeviceFallback: true,
    });
    return !!(r && r.success);
  } catch (e) { return false; }
}

export const getBioPref = (uid) => get('ub3_bio_' + uid);
export const setBioPref = (uid, v) => set('ub3_bio_' + uid, v);
export const getPinCache = (uid) => get('ub3_haspin_' + uid);
export const setPinCache = (uid, v) => set('ub3_haspin_' + uid, v);
