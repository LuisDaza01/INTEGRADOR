import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // El service worker y manifest.json van en /public
  // Vite los sirve desde la raíz automáticamente
  build: {
    // Generar sourcemaps para debug en producción
    sourcemap: false,
    // Separar chunks para mejor caching
    rollupOptions: {
      output: {
        manualChunks: {
          vendor:   ['react', 'react-dom', 'react-router-dom'],
          charts:   ['recharts'],
          motion:   ['framer-motion'],
          icons:    ['lucide-react'],
        },
      },
    },
  },
  server: {
    port: 5173,
    host: true,
  },
})