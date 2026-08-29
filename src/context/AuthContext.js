import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import * as authService from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // null = signed out, undefined = still checking
  const [authChecked, setAuthChecked] = useState(false);
  const [loading, setLoading] = useState(false);

  // Subscribes to real Firebase auth state on mount — this is what makes
  // "stay signed in after closing the app" actually work.
  useEffect(() => {
    const unsubscribe = authService.subscribeToAuthState(async (firebaseUser) => {
      if (firebaseUser) {
        const profile = await authService.getUserProfile(firebaseUser.uid);
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          emailVerified: firebaseUser.emailVerified,
          kycStatus: profile?.kycStatus ?? 'unverified',
        });
      } else {
        setUser(null);
      }
      setAuthChecked(true);
    });
    return unsubscribe;
  }, []);

  const signIn = useCallback(async (email, password) => {
    setLoading(true);
    try {
      await authService.signInWithEmail(email, password);
      // onAuthStateChanged above picks up the resulting user — no need to setUser here.
    } finally {
      setLoading(false);
    }
  }, []);

  const signUp = useCallback(async (email, password) => {
    setLoading(true);
    try {
      await authService.signUpWithEmail(email, password);
    } finally {
      setLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    await authService.signOut();
  }, []);

  const refreshKycStatus = useCallback(async () => {
    if (!user) return;
    const profile = await authService.getUserProfile(user.uid);
    setUser((prev) => (prev ? { ...prev, kycStatus: profile?.kycStatus ?? prev.kycStatus } : prev));
  }, [user]);

  const refreshBvnStatus = useCallback(async () => {
    if (!user) return;
    const profile = await authService.getUserProfile(user.uid);
    const bvnVerified = profile?.bvnVerified ?? false;
    setUser((prev) => (prev ? { ...prev, bvnVerified } : prev));
    return bvnVerified;
  }, [user]);

  const refreshEmailVerified = useCallback(async () => {
    const verified = await authService.refreshEmailVerifiedStatus();
    setUser((prev) => (prev ? { ...prev, emailVerified: verified } : prev));
    return verified;
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, authChecked, loading, signIn, signUp, signOut, refreshKycStatus, refreshEmailVerified, refreshBvnStatus, setUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
