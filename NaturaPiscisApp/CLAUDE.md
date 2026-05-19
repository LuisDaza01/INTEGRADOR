# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Start development server
npm start                    # or: npx expo start
npm run android              # Open on Android emulator/device
npm run ios                  # Open on iOS (macOS only)
npm run web                  # Open in browser

# Build
npx expo build:android -t apk         # APK for direct install
npx expo build:android -t app-bundle  # AAB for Play Store
```

No test suite is configured — testing is done manually via Expo Go.

## Architecture

**NaturaPiscis** is a multi-role aquaculture mobile app (React Native + Expo 54). A single codebase serves three user roles with entirely different UIs:

- **Productor** — IoT sensor monitoring, device control, order/inventory management
- **Consumidor** — product marketplace, cart, QR payment, order tracking
- **Repartidor** — delivery routing with live Google Maps directions

### Role-Based Routing

`src/navigation/AppNavigator.jsx` is the root router. On startup it checks auth state and the `user.rol` field (values: `"productor"`, `"consumidor"`, `"repartidor"`), then mounts the corresponding stack + bottom-tab navigator. Each role's screens live in `src/screens/{producer,consumer,driver}/`.

### State Management

Context API only — no Redux or Zustand.

| Context | File | Hook |
|---------|------|------|
| Auth (user, token, login/logout) | `src/contexts/AuthContext.jsx` | `useAuth()` |
| Theme (light/dark/auto, color palette) | `src/contexts/ThemeContext.jsx` | `useTheme()` |
| Push notifications (token, unread count) | `src/contexts/NotificationContext.jsx` | `useNotifications()` |

Auth tokens are persisted with `expo-secure-store`; theme preference with `AsyncStorage`.

### Real-Time Data

Two polling loops run continuously for producers:

- **`src/hooks/useLagunas.js`** — subscribes to Firebase Realtime DB via XMLHttpRequest polling (5-second intervals). Processes sensor readings (temperatura, pH, turbidez, nivel) and fires automation rules (e.g., auto-pump on temp alert). Firebase uses XHR instead of its real-time SDK for Expo Go compatibility.
- **`src/hooks/usePedidosMonitor.js`** — polls the REST API for new orders every 15 seconds and fires local notifications on new arrivals.

### API Layer

- **Base URL**: `https://naturapiscis-backend-production.up.railway.app/api` (defined in `src/constants/config.js`)
- **Client**: `src/api/axios.config.js` — Axios instance with JWT `Authorization` header injected via request interceptor and 401 auto-logout via response interceptor.
- **Services**: `src/api/services/` — one file per domain (auth, sensor, device, order, product, producer, carrito). All calls are async/await with try/catch; errors bubble up to the calling screen.

### Theme System

`src/constants/theme.js` and `src/constants/colors.js` define a Tailwind-inspired design system (spacing, font sizes, border radii, shadows). Components consume colors via `useTheme()` which returns the active palette based on system or user preference. Two palettes exist: light (`bg: #F9FAFB`) and dark (`bg: #111827`).

### Key Constants

`src/constants/config.js` holds the API URL, Firebase config, user role strings, and order status values. Change `API_BASE_URL` here when switching between local dev and Railway production.

### Maps & Driver Tracking

`src/screens/driver/TrackingPedidoScreen.jsx` uses `react-native-maps` with the Google Directions API to render turn-by-turn routes. The Google Maps API key is in `app.json` under `android.config.googleMaps.apiKey`.

### Notifications

`expo-notifications` handles both push (via Expo push token registered with the backend on login) and local notifications. Android channels are configured in `NotificationContext`: `alerts` (max priority), `orders`, and `default`.
