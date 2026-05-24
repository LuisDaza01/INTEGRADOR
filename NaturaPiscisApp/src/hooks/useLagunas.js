// src/hooks/useLagunas.js
import { useState, useEffect, useCallback, useRef } from 'react';
import { AppState } from 'react-native';
import { subscribeToLaguna, toggleBomba, SENSOR_THRESHOLDS, AUTOMATION_RULES } from '../config/firebase';
import { useNotifications } from '../contexts/NotificationContext';
import api from '../api/axios.config';

const NOTIFICATION_COOLDOWN = 5 * 60 * 1000;

// ── Procesar lecturas crudas de Firebase ──────────────────────
const procesarDatos = (data, lagunaId, lagunaName) => {
  if (!data) return null;

  const sensors = [];
  const lagunaAlerts = [];

  if (data.temperatura !== undefined) {
    const temp = parseFloat(data.temperatura);
    const th = SENSOR_THRESHOLDS.temperatura;
    let status = 'normal';
    let msg = null;
    if (temp >= 36)          { status = 'critical'; msg = `¡Temp crítica! ${temp.toFixed(1)}°C`; }
    else if (temp > th.max)  { status = 'warning';  msg = `Temp alta: ${temp.toFixed(1)}°C`; }
    else if (temp < th.min)  { status = 'warning';  msg = `Temp baja: ${temp.toFixed(1)}°C`; }
    if (msg) lagunaAlerts.push({ id: `${lagunaId}-temp-${status}`, lagunaId, type: 'temperatura', status, message: msg, value: temp });
    sensors.push({ id: 'temperatura', type: 'temperatura', label: th.label, value: temp.toFixed(1), unit: th.unit, icon: th.icon, color: th.color, status, minValue: th.min, maxValue: th.max });
  }

  if (data.ph !== undefined) {
    const ph = parseFloat(data.ph);
    const th = SENSOR_THRESHOLDS.ph;
    let status = 'normal';
    let msg = null;
    if (ph < th.critical_min || ph > th.critical_max) { status = 'critical'; msg = `pH crítico: ${ph.toFixed(2)}`; }
    else if (ph < th.min || ph > th.max)              { status = 'warning';  msg = `pH fuera de rango: ${ph.toFixed(2)}`; }
    if (msg) lagunaAlerts.push({ id: `${lagunaId}-ph-${status}`, lagunaId, type: 'ph', status, message: msg, value: ph });
    sensors.push({ id: 'ph', type: 'ph', label: th.label, value: ph.toFixed(2), unit: th.unit, icon: th.icon, color: th.color, status, minValue: th.min, maxValue: th.max });
  }

  if (data.turbidez !== undefined) {
    const turb = parseFloat(data.turbidez);
    const th = SENSOR_THRESHOLDS.turbidez;
    let status = 'normal';
    let msg = null;
    if (turb > th.critical) { status = 'critical'; msg = `Turbidez muy alta: ${turb.toFixed(0)} NTU`; }
    else if (turb > th.max) { status = 'warning';  msg = `Turbidez alta: ${turb.toFixed(0)} NTU`; }
    if (msg) lagunaAlerts.push({ id: `${lagunaId}-turb-${status}`, lagunaId, type: 'turbidez', status, message: msg, value: turb });
    sensors.push({ id: 'turbidez', type: 'turbidez', label: th.label, value: turb.toFixed(0), unit: th.unit, icon: th.icon, color: th.color, status, minValue: th.min, maxValue: th.max });
  }

  if (data.nivel !== undefined) {
    const nivelOk = data.nivel === true || data.nivel === 1;
    if (!nivelOk) lagunaAlerts.push({ id: `${lagunaId}-nivel-critical`, lagunaId, type: 'nivel', status: 'critical', message: '¡Nivel de agua bajo!' });
    sensors.push({ id: 'nivel', type: 'nivel', label: SENSOR_THRESHOLDS.nivel.label, value: nivelOk ? 'OK' : 'BAJO', unit: '', icon: SENSOR_THRESHOLDS.nivel.icon, color: SENSOR_THRESHOLDS.nivel.color, status: nivelOk ? 'normal' : 'critical', isBoolean: true, boolValue: nivelOk });
  }

  return { id: lagunaId, name: lagunaName, sensors, alerts: lagunaAlerts, bomba: data.bomba === true, rawData: data };
};

export const useLagunas = ({ enabled = true } = {}) => {
  const [lagunasMeta, setLagunasMeta]   = useState([]);  // lagunas del backend
  const [sensorData, setSensorData]     = useState({});  // { [lagunaId]: processedData }
  const [alerts, setAlerts]             = useState([]);
  const [isConnected, setIsConnected]   = useState(false);
  const [isLoading, setIsLoading]       = useState(true);
  const [lastUpdate, setLastUpdate]     = useState(null);

  const { sendLocalNotification } = useNotifications();
  const cooldownRef    = useRef(new Map());
  const notifRef       = useRef(sendLocalNotification);
  const unsubscribesRef = useRef([]);
  const [isForeground, setIsForeground] = useState(AppState.currentState === 'active');

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      setIsForeground(state === 'active');
    });
    return () => sub.remove();
  }, []);

  const active = enabled && isForeground;

  useEffect(() => { notifRef.current = sendLocalNotification; }, [sendLocalNotification]);

  // Notifica solo cuando la regla acaba de activarse (transición off→on),
  // y respeta un cooldown si vuelve a dispararse después de haberse limpiado.
  const ruleStateRef = useRef(new Map()); // key -> 'active' | 'inactive'

  const canNotify = useCallback((key) => {
    const last = cooldownRef.current.get(key);
    const now = Date.now();
    if (!last || now - last > NOTIFICATION_COOLDOWN) {
      cooldownRef.current.set(key, now);
      return true;
    }
    return false;
  }, []);

  const runAutomation = useCallback(async (data, codigo) => {
    for (const [ruleId, rule] of Object.entries(AUTOMATION_RULES)) {
      try {
        const key       = `${codigo}-${ruleId}`;
        const triggered = !!rule.condition(data);
        const wasActive = ruleStateRef.current.get(key) === 'active';

        if (!triggered) {
          if (wasActive) ruleStateRef.current.set(key, 'inactive');
          continue;
        }

        // Acción siempre que la regla está activa (idempotente; toggleBomba sólo
        // actúa si no está ya encendida).
        if (rule.action === 'ENCENDER_BOMBA' && !data.bomba) {
          await toggleBomba(codigo, true);
        }

        // Notificar sólo en la transición inactivo→activo y respetando cooldown.
        const isTransition = !wasActive;
        if (isTransition && rule.notification && notifRef.current && canNotify(key)) {
          const body = typeof rule.notification.body === 'function'
            ? rule.notification.body(data)
            : rule.notification.body;
          notifRef.current(rule.notification.title, body, {
            type:     'automation',
            rule:     ruleId,
            priority: rule.notification.priority,
          });
        }

        ruleStateRef.current.set(key, 'active');
      } catch (e) {
        // Errores de automation son críticos (puede comprometer al cultivo). Notificar al productor además de loggear.
        if (__DEV__) console.warn(`Error automatización ${ruleId}:`, e?.message);
        try {
          notifRef.current?.(
            '⚠️ Error en automatización',
            `No se pudo ejecutar "${ruleId}" en ${laguna?.nombre || 'una laguna'}. Revisa manualmente.`,
            { type: 'automation_error', rule: ruleId, priority: 'high' }
          );
        } catch (_) { /* notif no disponible */ }
      }
    }
  }, [canNotify]);

  // ── Cargar lagunas del backend ────────────────────────────────
  const fetchLagunas = useCallback(async () => {
    try {
      const res = await api.get('/lagunas');
      const data = res.data?.data || res.data || [];
      setLagunasMeta(Array.isArray(data) ? data : []);
    } catch (e) {
      if (__DEV__) console.warn('Error cargando lagunas:', e?.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchLagunas(); }, [fetchLagunas]);

  // ── Suscribirse a Firebase por cada laguna con código ─────────
  useEffect(() => {
    unsubscribesRef.current.forEach(fn => fn());
    unsubscribesRef.current = [];

    if (!active) {
      setIsConnected(false);
      return;
    }

    const conCodigo = lagunasMeta.filter(l => l.codigo_dispositivo);
    if (!conCodigo.length) return;

    conCodigo.forEach(laguna => {
      const unsub = subscribeToLaguna(laguna.codigo_dispositivo, (data, error) => {
        try {
          if (error) {
            setIsConnected(false);
            return;
          }
          if (data) {
            setIsConnected(true);
            setLastUpdate(new Date());
            const processed = procesarDatos(data, laguna.id, laguna.nombre);
            if (processed) {
              setSensorData(prev => ({ ...prev, [laguna.id]: processed }));
              setAlerts(prev => {
                const sinEsta = prev.filter(a => a.lagunaId !== laguna.id);
                return [...sinEsta, ...processed.alerts];
              });
              runAutomation(data, laguna.codigo_dispositivo);
            }
          }
        } catch (err) {
          if (__DEV__) console.warn('useLagunas callback error:', err?.message);
        }
      });
      unsubscribesRef.current.push(unsub);
    });

    return () => {
      unsubscribesRef.current.forEach(fn => fn());
      unsubscribesRef.current = [];
    };
  }, [lagunasMeta, runAutomation, active]);

  const controlBomba = async (lagunaId, state) => {
    const laguna = lagunasMeta.find(l => l.id === lagunaId);
    if (!laguna?.codigo_dispositivo) return false;
    try {
      await toggleBomba(laguna.codigo_dispositivo, state);
      return true;
    } catch (e) {
      if (__DEV__) console.warn('Error bomba:', e?.message);
      return false;
    }
  };

  const vincularCodigo = async (lagunaId, codigo) => {
    await api.put(`/lagunas/${lagunaId}/dispositivo`, { codigo });
    await fetchLagunas();
  };

  const lagunasArray = lagunasMeta.map(l => ({
    ...l,
    ...(sensorData[l.id] || { sensors: [], alerts: [], bomba: false, rawData: null }),
    conectado: !!sensorData[l.id],
  }));

  const getSummary = () => ({
    totalLagunas:   lagunasArray.length,
    totalAlerts:    alerts.length,
    criticalAlerts: alerts.filter(a => a.status === 'critical').length,
    bombasActivas:  lagunasArray.filter(l => l.bomba).length,
    sensoresOk:     lagunasArray.flatMap(l => l.sensors).filter(s => s.status === 'normal').length,
    sensoresTotal:  lagunasArray.flatMap(l => l.sensors).length,
  });

  const lagunas = {};
  lagunasArray.forEach(l => { lagunas[l.id] = l; });

  return {
    lagunas,
    lagunasArray,
    laguna: lagunasArray[0] || null,
    isConnected,
    isLoading,
    alerts,
    lastUpdate,
    controlBomba,
    vincularCodigo,
    fetchLagunas,
    refresh: fetchLagunas,
    getSummary,
    SENSOR_THRESHOLDS,
  };
};

export const useSensors = (opts) => {
  const { laguna, isConnected, isLoading, alerts, controlBomba, lastUpdate, refresh } = useLagunas(opts);
  return {
    sensors:      laguna?.sensors     || [],
    rawData:      laguna?.rawData     || null,
    isConnected,
    isLoading,
    alerts,
    bombaStatus:  laguna?.bomba       || false,
    lastUpdate,
    controlBomba: (state) => controlBomba(laguna?.id, state),
    refresh,
  };
};

export default useLagunas;
