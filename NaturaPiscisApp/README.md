# 🐟 NaturaPiscis - App Móvil

App móvil para productores acuícolas desarrollada con React Native y Expo.

## 📱 Características

- ✅ **Monitoreo en tiempo real** - Sensores de pH, temperatura, oxígeno, turbidez
- ✅ **Control de dispositivos IoT** - Bomba, aireador, alimentador, etc.
- ✅ **Notificaciones push** - Alertas críticas 24/7
- ✅ **Gestión de pedidos** - Seguimiento de ventas
- ✅ **Modo offline** - Funciona sin conexión
- ✅ **Biometría** - Login con huella/Face ID

## 🚀 Instalación

### Requisitos
- Node.js 18+
- Android Studio (para emulador) o dispositivo físico
- Expo CLI

### Pasos

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar IP del backend
# Editar src/constants/config.js y cambiar API_BASE_URL

# 3. Iniciar la app
npx expo start --android
```

## 📁 Estructura del Proyecto

```
NaturaPiscis-App/
├── App.jsx                    # Punto de entrada
├── app.json                   # Configuración de Expo
├── package.json
│
└── src/
    ├── api/                   # Servicios de API
    │   ├── axios.config.js
    │   └── services/
    │       ├── auth.service.js
    │       ├── sensor.service.js
    │       ├── device.service.js
    │       ├── order.service.js
    │       └── producer.service.js
    │
    ├── components/            # Componentes reutilizables
    │   ├── common/
    │   │   ├── Button.jsx
    │   │   ├── Card.jsx
    │   │   ├── Input.jsx
    │   │   ├── Loading.jsx
    │   │   └── EmptyState.jsx
    │   ├── layout/
    │   └── features/
    │
    ├── screens/               # Pantallas
    │   ├── auth/
    │   │   └── LoginScreen.jsx
    │   └── producer/
    │       ├── HomeScreen.jsx
    │       ├── OrdersScreen.jsx
    │       ├── DevicesScreen.jsx
    │       ├── AlertsScreen.jsx
    │       └── ProfileScreen.jsx
    │
    ├── navigation/            # Navegación
    │   └── AppNavigator.jsx
    │
    ├── contexts/              # Estado global
    │   ├── AuthContext.jsx
    │   ├── NotificationContext.jsx
    │   └── ThemeContext.jsx
    │
    ├── constants/             # Constantes
    │   ├── colors.js
    │   ├── config.js
    │   └── theme.js
    │
    └── assets/                # Recursos
        ├── images/
        └── sounds/
```

## 🔧 Configuración

### Backend API

Edita `src/constants/config.js`:

```javascript
export const API_BASE_URL = __DEV__ 
  ? 'http://10.0.2.2:3001/api'      // Emulador Android
  // 'http://192.168.X.X:3001/api'  // Dispositivo físico
  : 'https://api.naturapiscis.com/api';
```

### Firebase (opcional)

Para sensores en tiempo real, configura Firebase en `src/constants/config.js`:

```javascript
export const FIREBASE_CONFIG = {
  apiKey: "TU_API_KEY",
  authDomain: "tu-proyecto.firebaseapp.com",
  databaseURL: "https://tu-proyecto.firebaseio.com",
  projectId: "tu-proyecto",
  // ...
};
```

## 📲 Notificaciones Push

La app soporta notificaciones push para alertas críticas de sensores.

### Canales de Android
- `alerts` - Alertas críticas (bypassDnD, prioridad MAX)
- `orders` - Nuevos pedidos (prioridad HIGH)
- `default` - General

## 🎨 Tema

La app usa un tema oscuro igual al de la web:

- Fondo: `#0f172a` (slate-900)
- Primario: `#3b82f6` (blue-500)
- Texto: `#ffffff`

## 📦 Compilar para producción

```bash
# Generar APK
npx expo build:android -t apk

# Generar AAB (Play Store)
npx expo build:android -t app-bundle
```

## 👥 Equipo

Proyecto de tesis - Universidad Franz Tamayo, Bolivia

---

Hecho con ❤️ para NaturaPiscis
