import { Alert } from 'react-native';
import { apiPost } from './api';

const MAX_B64 = 600000;

async function pickSquare() {
  let ImagePicker = null;
  try { ImagePicker = require('expo-image-picker'); } catch (e) { ImagePicker = null; }
  if (!ImagePicker || !ImagePicker.launchImageLibraryAsync) {
    Alert.alert('Photos not available', 'Please update the app to add a profile photo.');
    return null;
  }
  let res;
  try {
    res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.6, base64: true });
  } catch (e) {
    Alert.alert('Photos not available', 'Please update the app to add a profile photo.');
    return null;
  }
  if (!res || res.canceled || !res.assets || !res.assets[0]) return null;
  const a = res.assets[0];
  let b64 = a.base64 || '';
  let mime = ['image/jpeg', 'image/png', 'image/webp'].indexOf(a.mimeType) >= 0 ? a.mimeType : 'image/jpeg';
  try {
    const IM = require('expo-image-manipulator');
    const out = await IM.manipulateAsync(a.uri, [{ resize: { width: 512 } }], { compress: 0.7, format: IM.SaveFormat.JPEG, base64: true });
    if (out && out.base64) { b64 = out.base64; mime = 'image/jpeg'; }
  } catch (e) {}
  if (!b64) return null;
  if (b64.length > MAX_B64) {
    Alert.alert('Photo too large', 'Please choose a smaller photo.');
    return null;
  }
  return { base64: b64, mime: mime };
}

export function photoError(e) {
  const c = (e && (e.code || e.message)) || '';
  if (c === 'photos_not_configured') return 'Profile photos are not available right now. Please try again later.';
  if (c === 'too_many_changes') return 'You changed your photo too many times. Please try again in a few minutes.';
  if (c === 'image_too_large') return 'That photo is too large. Please choose a smaller one.';
  if (c === 'upload_failed') return 'The upload did not go through. Please try again.';
  return 'Could not update your photo. Check your connection and try again.';
}

// Returns the new photo URL, or null if the user cancelled.
export async function pickAndUploadPhoto() {
  const p = await pickSquare();
  if (!p) return null;
  const r = await apiPost('/profile-photo', { imageBase64: p.base64, mime: p.mime });
  return r.photoUrl;
}

export async function removePhoto() {
  await apiPost('/profile-photo/remove', {});
}
