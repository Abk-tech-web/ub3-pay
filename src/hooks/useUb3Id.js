import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { apiGet } from '../services/api';

export default function useUb3Id() {
  const [id, setId] = useState('');
  useFocusEffect(useCallback(() => {
    let alive = true;
    apiGet('/ub3id/me')
      .then((r) => { if (alive && r && r.ub3Id) setId(r.ub3Id); })
      .catch(() => {});
    return () => { alive = false; };
  }, []));
  return id;
}
