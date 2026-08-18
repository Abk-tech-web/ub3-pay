import React, { createContext, useContext, useState, useCallback } from 'react';
import * as walletService from '../services/walletService';
import { getMidMarketUsdToNgn } from '../services/rateService';

const WalletContext = createContext(null);

export function WalletProvider({ children }) {
  const [portfolio, setPortfolio] = useState({ totalUsd: 0, totalNgn: 0, assets: [] });
  const [refreshing, setRefreshing] = useState(false);

  const refreshPortfolio = useCallback(async (uid) => {
    setRefreshing(true);
    try {
      const [p, usdNgn] = await Promise.all([walletService.getPortfolio(uid), getMidMarketUsdToNgn()]);
      setPortfolio({ ...p, totalNgn: p.totalUsd * usdNgn });
    } finally {
      setRefreshing(false);
    }
  }, []);

  return (
    <WalletContext.Provider value={{ portfolio, refreshing, refreshPortfolio }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error('useWallet must be used within WalletProvider');
  return ctx;
}
