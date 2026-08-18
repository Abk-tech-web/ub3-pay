// Reads Firebase config from EXPO_PUBLIC_ env vars — these values are not
// secret (every Firebase web/app config ships inside the client bundle by
// design); real protection comes from Firestore Security Rules, not from
// hiding this config. See .env for the actual values.
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

if (!firebaseConfig.apiKey) {
  // Loud warning rather than a silent crash — a missing .env is the most
  // common cause of "auth just doesn't work" during setup.
  console.warn(
    '[firebase] EXPO_PUBLIC_FIREBASE_* env vars are missing. Check your .env file and restart the Expo server (env vars only load on startup).'
  );
}

export const firebaseApp = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

// React Native needs explicit persistence setup (AsyncStorage) or auth
// state won't survive an app restart — getAuth() alone doesn't persist here.
let authInstance;
try {
  authInstance = initializeAuth(firebaseApp, { persistence: getReactNativePersistence(AsyncStorage) });
} catch (e) {
  // initializeAuth throws if already initialized (e.g. Fast Refresh) — fall back to getAuth.
  authInstance = getAuth(firebaseApp);
}
export const auth = authInstance;

export const db = getFirestore(firebaseApp);
