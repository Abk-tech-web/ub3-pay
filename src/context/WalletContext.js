import React, { createContext, useContext, useState, useCallback } from 'react';
import * as walletService from '../services/walletService';

const WalletContext = createContext(null);

export function WalletProvider({ children }) {
  const [portfolio, setPortfolio] = useState({ totalUsd: 0, totalNgn: 0, assets: [] });
  const [refreshing, setRefreshing] = useState(false);

  const refreshPortfolio = useCallback(async (uid) => {
    setRefreshing(true);
    try {
      const p = await walletService.getPortfolio(uid);
      setPortfolio(p);
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
