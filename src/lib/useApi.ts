import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { get } from './api';

/**
 * Loads `path` whenever the screen gains focus (so lists refresh after
 * submitting or approving on another screen). Pass null to skip loading.
 */
export function useApi<T>(path: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(
    async (mode: 'initial' | 'refresh' = 'initial') => {
      if (!path) {
        setLoading(false);
        return;
      }
      if (mode === 'refresh') setRefreshing(true);
      try {
        setData(await get<T>(path));
        setError(null);
      } catch (e: any) {
        setError(e?.message ?? 'Something went wrong.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [path],
  );

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  return { data, error, loading, refreshing, reload: () => load('refresh'), setData };
}
