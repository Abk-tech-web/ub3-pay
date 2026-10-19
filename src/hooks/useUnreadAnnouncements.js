import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import * as SecureStore from 'expo-secure-store';
import { useAuth } from '../context/AuthContext';
import { apiGet } from '../services/api';

// Number of active announcements newer than the last one this user has seen.
export default function useUnreadAnnouncements() {
  const { user } = useAuth();
  const uid = user && user.uid;
  const [count, setCount] = useState(0);

  useFocusEffect(useCallback(() => {
    if (!uid) return undefined;
    let alive = true;
    (async () => {
      try {
        let seen = 0;
        try { seen = Number(await SecureStore.getItemAsync('ub3_ann_seen_' + uid)) || 0; } catch (e) {}
        const r = await apiGet('/announcements');
        const n = ((r && r.items) || []).filter((i) => i.active !== false && i.createdAt > seen).length;
        if (alive) setCount(n);
      } catch (e) {}
    })();
    return () => { alive = false; };
  }, [uid]));

  return count;
}
