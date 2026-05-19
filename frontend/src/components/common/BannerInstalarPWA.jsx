// ============================================================
// src/components/common/BannerInstalarPWA.jsx
// Banner que aparece en la parte inferior para instalar la PWA
//
// Agregar en DashboardConsumidor.jsx o WelcomeMenu.jsx:
//   import BannerInstalarPWA from '../components/common/BannerInstalarPWA'
//   <BannerInstalarPWA />
// ============================================================
import { useState } from 'react'
import { Download, X, Smartphone } from 'lucide-react'
import { usePWAInstall } from '../../hooks/usePWAInstall'

const BannerInstalarPWA = () => {
  const { canInstall, install, isInstalled } = usePWAInstall()
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem('pwa-banner-dismissed') === 'true'
  )

  const handleDismiss = () => {
    setDismissed(true)
    localStorage.setItem('pwa-banner-dismissed', 'true')
  }

  const handleInstall = async () => {
    const ok = await install()
    if (ok) handleDismiss()
  }

  if (!canInstall || isInstalled || dismissed) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 max-w-md mx-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-teal-200 p-4 flex items-center gap-4">
        {/* Ícono */}
        <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center flex-shrink-0">
          <Smartphone className="h-6 w-6 text-teal-600" />
        </div>

        {/* Texto */}
        <div className="flex-1 min-w-0">
          <p className="font-bold text-gray-900 text-sm">Instalar NaturaPiscis</p>
          <p className="text-xs text-gray-500 mt-0.5">
            Accede más rápido desde tu pantalla de inicio
          </p>
        </div>

        {/* Acciones */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={handleInstall}
            className="flex items-center gap-1.5 px-3 py-2 bg-teal-600 text-white rounded-xl text-xs font-semibold hover:bg-teal-700 transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            Instalar
          </button>
          <button
            onClick={handleDismiss}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-4 w-4 text-gray-400" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default BannerInstalarPWA