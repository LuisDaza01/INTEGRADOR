// services/sensorService.js
import { useState, useEffect } from "react"
import { subscribeToSensorData, getHistoricalData, unsubscribeFromSensorData } from '../config/firebase'

// Rangos óptimos para Tambaqui (Colossoma macropomum) basados en investigación
const SENSOR_RANGES = {
  temperatura: { min: 25, max: 34, unit: '°C' }, // Rango de supervivencia del tambaqui
  ph: { min: 6.5, max: 8.5, unit: '' }, // Rango óptimo para tambaqui
  turbidez: { min: 0, max: 50, unit: 'NTU' } // Rango para agua clara
}

// Función para procesar datos raw de Firebase
const processSensorData = (rawData, trendStore = {}) => {
  if (!rawData) return null

  const now = Date.now()

  return {
    temperatura: {
      value: parseFloat(rawData.temperatura || 0).toFixed(1),
      unit: SENSOR_RANGES.temperatura.unit,
      minValue: SENSOR_RANGES.temperatura.min,
      maxValue: SENSOR_RANGES.temperatura.max,
      isOutOfRange: rawData.temperatura < SENSOR_RANGES.temperatura.min ||
                    rawData.temperatura > SENSOR_RANGES.temperatura.max,
      trend: determineTrend(rawData.temperatura, 'temperatura', trendStore),
      lastUpdated: formatLastUpdate(now),
      raw: rawData.temperatura
    },
    ph: {
      value: parseFloat(rawData.ph || 7).toFixed(1),
      unit: SENSOR_RANGES.ph.unit,
      minValue: SENSOR_RANGES.ph.min,
      maxValue: SENSOR_RANGES.ph.max,
      isOutOfRange: rawData.ph < SENSOR_RANGES.ph.min ||
                    rawData.ph > SENSOR_RANGES.ph.max,
      trend: determineTrend(rawData.ph, 'ph', trendStore),
      lastUpdated: formatLastUpdate(now),
      raw: rawData.ph
    },
    turbidez: {
      value: parseFloat(rawData.turbidez || 0).toFixed(1),
      unit: SENSOR_RANGES.turbidez.unit,
      minValue: SENSOR_RANGES.turbidez.min,
      maxValue: SENSOR_RANGES.turbidez.max,
      isOutOfRange: rawData.turbidez < SENSOR_RANGES.turbidez.min ||
                    rawData.turbidez > SENSOR_RANGES.turbidez.max,
      trend: determineTrend(rawData.turbidez, 'turbidez', trendStore),
      lastUpdated: formatLastUpdate(now),
      raw: rawData.turbidez
    }
  }
}

// Tendencias por instancia de SensorDataManager para evitar contaminación entre sesiones
const determineTrend = (currentValue, sensorType, store) => {
  if (store[sensorType] === undefined) {
    store[sensorType] = currentValue
    return 'stable'
  }

  const diff = currentValue - store[sensorType]
  store[sensorType] = currentValue

  if (Math.abs(diff) < 0.1) return 'stable'
  return diff > 0 ? 'up' : 'down'
}

const formatLastUpdate = (timestamp) => {
  const now = Date.now()
  const diff = now - timestamp
  const seconds = Math.floor(diff / 1000)
  
  if (seconds < 10) return 'Ahora mismo'
  if (seconds < 60) return `Hace ${seconds} segundos`
  
  const minutes = Math.floor(seconds / 60)
  if (minutes === 1) return 'Hace 1 minuto'
  if (minutes < 60) return `Hace ${minutes} minutos`
  
  const hours = Math.floor(minutes / 60)
  if (hours === 1) return 'Hace 1 hora'
  return `Hace ${hours} horas`
}

// Clase para manejar la conexión con Firebase
export class SensorDataManager {
  constructor() {
    this.listeners = []
    this.isConnected = false
    this.unsubscribe = null
    this.lastData = null
    this.connectionCallbacks = []
    this.trendStore = {}
  }

  // Conectar a Firebase y suscribirse a cambios
  connect(onDataReceived, onConnectionChange) {
    console.log('🔄 Conectando a Firebase...')
    
    if (onConnectionChange) {
      this.connectionCallbacks.push(onConnectionChange)
    }

    this.unsubscribe = subscribeToSensorData((data, error) => {
      if (error) {
        console.error('❌ Error de conexión Firebase:', error)
        this.isConnected = false
        this.notifyConnectionChange(false)
        return
      }

      if (data) {
        console.log('📊 Datos recibidos:', data)
        this.isConnected = true
        this.lastData = data
        
        // Procesar datos y enviar al callback
        const processedData = processSensorData(data, this.trendStore)
        if (onDataReceived) {
          onDataReceived(processedData, {
            isConnected: true,
            bomba: data.bomba === true,
            rawData: data,
            timestamp: Date.now()
          })
        }
        
        this.notifyConnectionChange(true)
      } else {
        console.log('⚠️ No hay datos disponibles')
        this.isConnected = false
        this.notifyConnectionChange(false)
      }
    })

    return this.unsubscribe
  }

  // Desconectar de Firebase
  disconnect() {
    console.log('🛑 Desconectando de Firebase...')
    
    if (this.unsubscribe) {
      unsubscribeFromSensorData(this.unsubscribe)
      this.unsubscribe = null
    }
    
    this.isConnected = false
    this.connectionCallbacks = []
    this.trendStore = {}
    this.notifyConnectionChange(false)
  }

  // Notificar cambios de conexión
  notifyConnectionChange(connected) {
    this.connectionCallbacks.forEach(callback => {
      try {
        callback(connected)
      } catch (error) {
        console.error('Error en callback de conexión:', error)
      }
    })
  }

  // Obtener datos históricos
  async getHistorical(timeRange = '24h') {
    try {
      console.log(`📈 Obteniendo datos históricos (${timeRange})...`)
      const data = await getHistoricalData(timeRange)
      
      return data.map(item => ({
        timestamp: item.timestamp,
        temperatura: item.temperatura,
        ph: item.ph,
        turbidez: item.turbidez,
        bomba: item.bomba === true
      }))
    } catch (error) {
      console.error('❌ Error al obtener datos históricos:', error)
      return []
    }
  }

  // Verificar si hay alertas activas
  checkAlerts(sensorData) {
    if (!sensorData) return []
    
    const alerts = []
    
    Object.entries(sensorData).forEach(([sensorType, data]) => {
      if (data.isOutOfRange) {
        alerts.push({
          type: sensorType,
          value: data.value,
          unit: data.unit,
          range: `${data.minValue} - ${data.maxValue}`,
          severity: this.getAlertSeverity(sensorType, data.raw),
          message: this.getAlertMessage(sensorType, data.raw, data.minValue, data.maxValue)
        })
      }
    })
    
    return alerts
  }

  // Determinar severidad de la alerta
  getAlertSeverity(sensorType, value) {
    const ranges = SENSOR_RANGES[sensorType]
    if (!ranges) return 'medium'
    
    const range = ranges.max - ranges.min
    const deviation = Math.max(
      Math.abs(value - ranges.min),
      Math.abs(value - ranges.max)
    )
    
    if (deviation > range * 0.5) return 'high'
    if (deviation > range * 0.2) return 'medium'
    return 'low'
  }

  // Generar mensaje de alerta específico para tambaqui
  getAlertMessage(sensorType, value, min, max) {
    const messages = {
      temperatura: value > max 
        ? `Temperatura crítica (${value}°C). El tambaqui puede morir por estrés térmico. Active sistemas de enfriamiento inmediatamente.`
        : value < min
        ? `Temperatura muy baja (${value}°C). El tambaqui reduce su metabolismo y alimentación drásticamente.`
        : `Temperatura fuera del rango óptimo para tambaqui.`,
      ph: value > max
        ? `pH muy alcalino (${value}). Puede causar irritación branquial y problemas respiratorios en tambaqui.`
        : `pH muy ácido (${value}). Puede ser tóxico para el tambaqui y afectar su crecimiento.`,
      turbidez: value > max
        ? `Turbidez alta (${value} NTU). Visibilidad reducida y posible contaminación que afecta la alimentación del tambaqui.`
        : `Turbidez muy baja (${value} NTU). Agua demasiado clara para el tambaqui.`
    }
    
    return messages[sensorType] || `Valor fuera de rango: ${value}`
  }

  // Obtener estadísticas del día
  async getDailyStats() {
    try {
      const data = await this.getHistorical('24h')
      if (data.length === 0) return null
      
      const stats = {
        temperatura: this.calculateStats(data, 'temperatura'),
        ph: this.calculateStats(data, 'ph'),
        turbidez: this.calculateStats(data, 'turbidez'),
        bombaUptime: this.calculateBombaUptime(data)
      }
      
      return stats
    } catch (error) {
      console.error('Error al calcular estadísticas:', error)
      return null
    }
  }

  calculateStats(data, parameter) {
    const values = data.map(item => item[parameter]).filter(v => v != null)
    if (values.length === 0) return null
    
    const sorted = values.sort((a, b) => a - b)
    return {
      min: Math.min(...values),
      max: Math.max(...values),
      avg: values.reduce((sum, v) => sum + v, 0) / values.length,
      median: sorted[Math.floor(sorted.length / 2)],
      count: values.length
    }
  }

  calculateBombaUptime(data) {
    if (data.length === 0) return 0
    
    const bombaOnCount = data.filter(item => item.bomba === true).length
    return (bombaOnCount / data.length) * 100
  }
}

// Instancia global del manager
export const sensorManager = new SensorDataManager()

// Hook personalizado para usar en componentes React
export const useSensorData = () => {
  const [data, setData] = useState(null)
  const [isConnected, setIsConnected] = useState(false)
  const [alerts, setAlerts] = useState([])
  const [bombaStatus, setBombaStatus] = useState({ isOn: false, lastChanged: null })
  
  useEffect(() => {
    console.log('🚀 Inicializando hook useSensorData para cultivo de Tambaqui')
    
    const unsubscribe = sensorManager.connect(
      (sensorData, metadata) => {
        console.log('📡 Datos procesados recibidos en hook:', sensorData)
        setData(sensorData)
        setBombaStatus({
          isOn: metadata.bomba,
          lastChanged: metadata.timestamp
        })
        
        // Verificar alertas específicas para tambaqui
        const currentAlerts = sensorManager.checkAlerts(sensorData)
        setAlerts(currentAlerts)
        console.log('🚨 Alertas detectadas para tambaqui:', currentAlerts)
      },
      (connected) => {
        console.log('🔌 Estado de conexión:', connected)
        setIsConnected(connected)
      }
    )
    
    return () => {
      console.log('🔄 Limpiando hook useSensorData')
      sensorManager.disconnect()
    }
  }, [])
  
  const refreshData = () => {
    console.log('🔄 Refrescando datos manualmente')
    sensorManager.disconnect()
    setTimeout(() => {
      sensorManager.connect(
        (sensorData, metadata) => {
          setData(sensorData)
          setBombaStatus({
            isOn: metadata.bomba,
            lastChanged: metadata.timestamp
          })
          setAlerts(sensorManager.checkAlerts(sensorData))
        },
        setIsConnected
      )
    }, 1000)
  }
  
  return {
    data,
    isConnected,
    alerts,
    bombaStatus,
    refreshData,
    manager: sensorManager
  }
}

// Función de utilidad para simular datos de tambaqui (para testing sin Firebase)
export const generateMockTambaquiData = () => {
  const mockData = {
    temperatura: 25 + Math.random() * 9, // 25-34°C (rango del tambaqui)
    ph: 6.5 + Math.random() * 2, // 6.5-8.5
    turbidez: Math.random() * 60, // 0-60 NTU
    bomba: Math.random() > 0.7 // 30% probabilidad de estar encendida
  }
  
  return processSensorData(mockData)
}

// Función para validar datos de sensores específicos para tambaqui
export const validateTambaquiData = (data) => {
  const errors = []
  
  if (!data) {
    errors.push('No hay datos disponibles')
    return errors
  }
  
  // Validar temperatura crítica para tambaqui
  if (data.temperatura == null || isNaN(data.temperatura)) {
    errors.push('Datos de temperatura inválidos')
  } else if (data.temperatura < 20 || data.temperatura > 40) {
    errors.push('Temperatura extrema - fuera del rango posible para tambaqui (20-40°C)')
  } else if (data.temperatura < 25 || data.temperatura > 34) {
    errors.push('⚠️ Temperatura fuera del rango óptimo para tambaqui (25-34°C)')
  }
  
  // Validar pH
  if (data.ph == null || isNaN(data.ph)) {
    errors.push('Datos de pH inválidos')
  } else if (data.ph < 0 || data.ph > 14) {
    errors.push('pH fuera del rango posible (0-14)')
  } else if (data.ph < 6.5 || data.ph > 8.5) {
    errors.push('⚠️ pH fuera del rango óptimo para tambaqui (6.5-8.5)')
  }
  
  // Validar turbidez
  if (data.turbidez == null || isNaN(data.turbidez)) {
    errors.push('Datos de turbidez inválidos')
  } else if (data.turbidez < 0) {
    errors.push('Turbidez no puede ser negativa')
  } else if (data.turbidez > 50) {
    errors.push('⚠️ Turbidez alta - puede afectar la alimentación del tambaqui')
  }
  
  return errors
}

// Función para formatear datos para exportación (sin oxígeno)
export const formatDataForExport = (historicalData) => {
  if (!Array.isArray(historicalData) || historicalData.length === 0) {
    return null
  }
  
  const headers = ['Fecha', 'Hora', 'Temperatura(°C)', 'pH', 'Turbidez(NTU)', 'Bomba', 'Estado_Tambaqui']
  
  const rows = historicalData.map(record => {
    const date = new Date(record.timestamp)
    
    // Evaluar condiciones para tambaqui
    let estadoTambaqui = 'ÓPTIMO'
    if (record.temperatura < 25 || record.temperatura > 34) {
      estadoTambaqui = 'ESTRÉS_TÉRMICO'
    } else if (record.ph < 6.5 || record.ph > 8.5) {
      estadoTambaqui = 'ESTRÉS_pH'
    } else if (record.turbidez > 50) {
      estadoTambaqui = 'AGUA_TURBIA'
    }
    
    return [
      date.toLocaleDateString('es-ES'),
      date.toLocaleTimeString('es-ES'),
      record.temperatura?.toFixed(2) || 'N/A',
      record.ph?.toFixed(2) || 'N/A',
      record.turbidez?.toFixed(2) || 'N/A',
      record.bomba ? 'ENCENDIDA' : 'APAGADA',
      estadoTambaqui
    ]
  })
  
  return {
    headers,
    rows,
    csvContent: [headers, ...rows].map(row => row.join(',')).join('\n')
  }
}

// Constantes útiles para tambaqui
export const SENSOR_UNITS = {
  temperatura: '°C',
  ph: '',
  turbidez: 'NTU'
}

export const SENSOR_NAMES = {
  temperatura: 'Temperatura',
  ph: 'pH',
  turbidez: 'Turbidez'
}

export const ALERT_LEVELS = {
  low: { color: 'yellow', text: 'Advertencia' },
  medium: { color: 'orange', text: 'Alerta' },
  high: { color: 'red', text: 'Crítico' }
}

// Información específica del tambaqui
export const TAMBAQUI_INFO = {
  nombreCientifico: 'Colossoma macropomum',
  nombreComun: 'Tambaqui, Pacú Negro, Cachama',
  temperaturaOptima: '28-31°C',
  temperaturaTolerancia: '25-34°C',
  phOptimo: '6.5-8.5',
  habitat: 'Cuenca Amazónica',
  alimentacion: 'Omnívoro (75% vegetariano)',
  pesoMaximo: '40 kg',
  caracteristicas: [
    'Resistente a bajas concentraciones de oxígeno',
    'Excelente conversión alimenticia',
    'Crecimiento rápido',
    'Alta resistencia al manejo'
  ]
}

export default SensorDataManager