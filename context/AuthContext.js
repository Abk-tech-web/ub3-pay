import React, { createContext, useContext, useState, useCallback } from 'react';
import * as authService from '../services/authService';
import * as kycService from '../services/kycService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  const signIn = useCallback(async (email, password) => {
    setLoading(true);
    try {
      const u = await authService.signInWithEmail(email, password);
      setUser(u);
      return u;
    } finally {
      setLoading(false);
    }
  }, []);

  const signInWithGoogle = useCallback(async () => {
    setLoading(true);
    try {
      const u = await authService.signInWithGoogle();
      setUser(u);
      return u;
    } finally {
      setLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    await authService.signOut();
    setUser(null);
  }, []);

  const refreshKycStatus = useCallback(async () => {
    if (!user) return;
    const { status } = await kycService.getKycStatus(user.uid);
    setUser((prev) => (prev ? { ...prev, kycStatus: status } : prev));
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signInWithGoogle, signOut, refreshKycStatus, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
