// src/hooks/useOffline.js
// Lightweight offline detection using periodic fetch — no extra dependencies needed
import { useState, useEffect, useRef } from 'react';

const CHECK_URL = 'https://www.google.com/generate_204';
const CHECK_INTERVAL_MS = 8000;
const CHECK_TIMEOUT_MS  = 4000;

const checkConnection = async () => {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), CHECK_TIMEOUT_MS);
    const res = await fetch(CHECK_URL, { method: 'HEAD', signal: ctrl.signal, cache: 'no-store' });
    clearTimeout(timer);
    return res.status < 500;
  } catch {
    return false;
  }
};

const useOffline = () => {
  const [isOffline, setIsOffline] = useState(false);
  const intervalRef = useRef(null);

  const runCheck = async () => {
    const online = await checkConnection();
    setIsOffline(!online);
  };

  useEffect(() => {
    runCheck();
    intervalRef.current = setInterval(runCheck, CHECK_INTERVAL_MS);
    return () => clearInterval(intervalRef.current);
  }, []);

  return isOffline;
};

export default useOffline;
