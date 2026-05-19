// config/firebase.js
import { initializeApp } from 'firebase/app'
import { getDatabase, ref, onValue, off } from 'firebase/database'

// Tu configuración de Firebase (reemplaza con tus credenciales reales)
const firebaseConfig = {
  apiKey: "AIzaSyAorgZykpj8iL1HBo7GCXCWtP-m_67NpJY",
  authDomain: "examen-ac07b.firebaseapp.com",
  databaseURL: "https://examen-ac07b-default-rtdb.firebaseio.com",
  projectId: "examen-ac07b",
  storageBucket: "examen-ac07b.appspot.com",
  messagingSenderId: "123456789", // Reemplaza con tu sender ID real
  appId: "1:123456789:web:abcdef123456" // Reemplaza con tu app ID real
}

// Inicializar Firebase
const app = initializeApp(firebaseConfig)
const database = getDatabase(app)

// Función para obtener datos de sensores en tiempo real
export const subscribeToSensorData = (callback) => {
  const sensorRef = ref(database, 'laguna')
  
  const unsubscribe = onValue(sensorRef, (snapshot) => {
    const data = snapshot.val()
    if (data) {
      console.log('🔥 Datos recibidos de Firebase:', data)
      callback(data)
    } else {
      console.log('⚠️ No hay datos en Firebase')
      callback(null)
    }
  }, (error) => {
    console.error('❌ Error al leer Firebase:', error)
    callback(null, error)
  })

  return unsubscribe
}

// Función para obtener datos históricos
export const getHistoricalData = async (timeRange = '24h') => {
  try {
    // Para datos históricos, podrías usar una estructura como 'laguna/historico'
    const historialRef = ref(database, 'laguna/historico')
    
    return new Promise((resolve, reject) => {
      onValue(historialRef, (snapshot) => {
        const data = snapshot.val()
        if (data) {
          // Convertir objeto a array y filtrar por tiempo
          const dataArray = Object.entries(data).map(([key, value]) => ({
            id: key,
            timestamp: value.timestamp || Date.now(),
            ...value
          }))
          
          // Filtrar por rango de tiempo
          const now = Date.now()
          let timeLimit = now
          
          switch (timeRange) {
            case '1h':
              timeLimit = now - (60 * 60 * 1000)
              break
            case '24h':
              timeLimit = now - (24 * 60 * 60 * 1000)
              break
            case '7d':
              timeLimit = now - (7 * 24 * 60 * 60 * 1000)
              break
            case '30d':
              timeLimit = now - (30 * 24 * 60 * 60 * 1000)
              break
            default:
              timeLimit = now - (24 * 60 * 60 * 1000)
          }
          
          const filteredData = dataArray.filter(item => item.timestamp >= timeLimit)
          resolve(filteredData)
        } else {
          resolve([])
        }
      }, {
        onlyOnce: true
      })
    })
  } catch (error) {
    console.error('❌ Error al obtener datos históricos:', error)
    return []
  }
}

// Función para desconectar listeners
export const unsubscribeFromSensorData = (unsubscribeFunction) => {
  if (unsubscribeFunction) {
    unsubscribeFunction()
  }
}

export { database }
export default app