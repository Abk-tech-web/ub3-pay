import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as walletService from '../services/walletService';
import { getMidMarketUsdToNgn } from '../services/rateService';

const WalletContext = createContext(null);
const STORAGE_KEY = 'ub3_wallet_adjustments_v1';

function applyAdjustments(assets, adjustments) {
  return assets.map((a) => {
    const delta = adjustments[a.symbol];
    if (!delta) return a;
    const bal = parseFloat(a.balance) || 0;
    const price = bal > 0 ? a.usdValue / bal : 0;
    const newBalance = Math.max(0, bal + delta);
    return { ...a, balance: String(newBalance), usdValue: price * newBalance };
  });
}

export function WalletProvider({ children }) {
  const [portfolio, setPortfolio] = useState({ totalUsd: 0, totalNgn: 0, ngnBalance: 0, assets: [], activity: [] });
  const [refreshing, setRefreshing] = useState(false);
  const adjustmentsRef = useRef({});
  const ngnBalanceRef = useRef(0);
  const activityRef = useRef([]);
  const loadedRef = useRef(false);

  const persist = useCallback(() => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({
      ngnBalance: ngnBalanceRef.current,
      adjustments: adjustmentsRef.current,
      activity: activityRef.current,
    })).catch(() => {});
  }, []);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) {
        try {
          const saved = JSON.parse(raw);
          ngnBalanceRef.current = saved.ngnBalance ?? 0;
          adjustmentsRef.current = saved.adjustments ?? {};
          activityRef.current = saved.activity ?? [];
        } catch {}
      }
      loadedRef.current = true;
    }).catch(() => { loadedRef.current = true; });
  }, []);

  const refreshPortfolio = useCallback(async (uid) => {
    setRefreshing(true);
    try {
      const [p, usdNgn] = await Promise.all([walletService.getPortfolio(uid), getMidMarketUsdToNgn()]);
      const assets = applyAdjustments(p.assets, adjustmentsRef.current);
      const totalUsd = assets.reduce((sum, a) => sum + a.usdValue, 0);
      setPortfolio({ ...p, assets, totalUsd, totalNgn: totalUsd * usdNgn, ngnBalance: ngnBalanceRef.current, activity: activityRef.current });
    } finally {
      setRefreshing(false);
    }
  }, []);

  const adjustNgnBalance = useCallback((delta) => {
    ngnBalanceRef.current = Math.max(0, ngnBalanceRef.current + delta);
    setPortfolio((p) => ({ ...p, ngnBalance: ngnBalanceRef.current }));
    persist();
  }, [persist]);

  const adjustCryptoBalance = useCallback((symbol, delta) => {
    adjustmentsRef.current[symbol] = (adjustmentsRef.current[symbol] || 0) + delta;
    setPortfolio((prev) => {
      const assets = applyAdjustments(prev.assets, { [symbol]: delta });
      const totalUsd = assets.reduce((sum, a) => sum + a.usdValue, 0);
      return { ...prev, assets, totalUsd };
    });
    persist();
  }, [persist]);

  const addActivity = useCallback((entry) => {
    activityRef.current = [entry, ...activityRef.current];
    setPortfolio((p) => ({ ...p, activity: activityRef.current }));
    persist();
  }, [persist]);

  return (
    <WalletContext.Provider value={{ portfolio, refreshing, refreshPortfolio, adjustNgnBalance, adjustCryptoBalance, addActivity }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error('useWallet must be used within WalletProvider');
  return ctx;
}
