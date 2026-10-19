import React, { useState, useEffect, useRef } from 'react';
import { View, AppState, BackHandler, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import * as walletService from '../services/walletService';
import { getPinCache, setPinCache } from '../services/biometric';
import UB3Loader from './UB3Loader';
import LockScreen from './LockScreen';
import AnnouncementPopup from './AnnouncementPopup';

const LOCK_AFTER_MS = 30000;

async function shouldLock(uid) {
  const cached = await getPinCache(uid);
  if (cached === '1') return true;
  try {
    const s = await walletService.getPinStatus();
    if (s && s.hasPin) { await setPinCache(uid, '1'); return true; }
  } catch (e) {}
  return false;
}

export default function AppLock({ children }) {
  const { user, freshLogin, signOut } = useAuth();
  const { colors } = useTheme();
  const uid = user && user.uid;
  const [phase, setPhase] = useState('checking');
  const everOpen = useRef(false);
  const bgAt = useRef(0);

  const open = () => { everOpen.current = true; setPhase('open'); };

  useEffect(() => {
    let alive = true;
    (async () => {
      if (freshLogin && freshLogin.current) {
        freshLogin.current = false;
        if (alive) open();
        return;
      }
      const lock = await shouldLock(uid);
      if (!alive) return;
      if (lock) setPhase('locked'); else open();
    })();
    return () => { alive = false; };
  }, [uid]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', async (st) => {
      if (st === 'background') {
        bgAt.current = Date.now();
      } else if (st === 'active') {
        const t = bgAt.current;
        bgAt.current = 0;
        if (t && Date.now() - t > LOCK_AFTER_MS) {
          if (await shouldLock(uid)) setPhase('locked');
        }
      }
    });
    return () => sub.remove();
  }, [uid]);

  useEffect(() => {
    if (phase !== 'locked') return undefined;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => sub.remove();
  }, [phase]);

  if (phase === 'checking') {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <UB3Loader size={96} color={colors.violet} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      {phase === 'open' || everOpen.current ? children : null}
      {phase === 'open' ? <AnnouncementPopup /> : null}
      {phase === 'locked' ? (
        <View style={StyleSheet.absoluteFill}>
          <LockScreen uid={uid} onUnlocked={open} onSignOut={signOut} />
        </View>
      ) : null}
    </View>
  );
}
