// src/hooks/useOfflineCache.js
// Wraps API calls with AsyncStorage cache. If a request fails, serves stale cached data.
import { useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PREFIX      = '@np_cache:';
const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

const readCache = async (key) => {
  try {
    const raw = await AsyncStorage.getItem(PREFIX + key);
    if (!raw) return null;
    return JSON.parse(raw); // { ts, data }
  } catch { return null; }
};

const writeCache = async (key, data) => {
  try {
    await AsyncStorage.setItem(PREFIX + key, JSON.stringify({ ts: Date.now(), data }));
  } catch { /* ignore write errors */ }
};

/**
 * useOfflineCache — fetch with transparent offline fallback.
 *
 * @param {string}   cacheKey  Unique stable key for this data
 * @param {Function} fetcher   Async function returning the data to cache
 * @param {Object}   opts
 *   ttl:     TTL in ms (default 5 min)
 *   enabled: boolean (default true)
 *   deps:    array — extra deps that trigger a re-fetch
 */
export const useOfflineCache = (cacheKey, fetcher, { ttl = DEFAULT_TTL, enabled = true, deps = [] } = {}) => {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [isStale, setIsStale] = useState(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  const load = useCallback(async (forceRefresh = false) => {
    if (!enabled || !mounted.current) return;
    setLoading(true);
    setError(null);

    // Serve fresh cache immediately (unless force-refresh)
    if (!forceRefresh) {
      const cached = await readCache(cacheKey);
      if (cached && Date.now() - cached.ts < ttl) {
        if (mounted.current) { setData(cached.data); setIsStale(false); setLoading(false); }
        return;
      }
    }

    // Fetch from network
    try {
      const result = await fetcher();
      await writeCache(cacheKey, result);
      if (mounted.current) { setData(result); setIsStale(false); setError(null); }
    } catch (err) {
      // Network error: try stale cache
      const cached = await readCache(cacheKey);
      if (cached && mounted.current) {
        setData(cached.data);
        setIsStale(true);
        setError(null);
      } else if (mounted.current) {
        setError(err);
      }
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, [cacheKey, ttl, enabled, fetcher]);

  useEffect(() => {
    load(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheKey, enabled, ...deps]);

  const refresh   = useCallback(() => load(true), [load]);
  const invalidate = useCallback(async () => {
    try { await AsyncStorage.removeItem(PREFIX + cacheKey); } catch { /* ignore */ }
  }, [cacheKey]);

  return { data, loading, error, isStale, refresh, invalidate };
};

/**
 * Clears all NaturaPiscis cache keys — call this on logout.
 */
export const purgeCache = async () => {
  try {
    const all = await AsyncStorage.getAllKeys();
    const npKeys = all.filter(k => k.startsWith(PREFIX));
    if (npKeys.length) await AsyncStorage.multiRemove(npKeys);
  } catch { /* ignore */ }
};

export default useOfflineCache;
