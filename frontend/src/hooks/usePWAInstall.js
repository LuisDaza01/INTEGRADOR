// ============================================================
// src/hooks/usePWAInstall.js
// Hook para manejar el prompt de instalación de la PWA
//
// Uso:
//   const { canInstall, install, isInstalled } = usePWAInstall()
//   {canInstall && <button onClick={install}>Instalar app</button>}
// ============================================================
import { useState, useEffect } from 'react'

export const usePWAInstall = () => {
  const [installPrompt, setInstallPrompt] = useState(null)
  const [canInstall, setCanInstall]       = useState(false)
  const [isInstalled, setIsInstalled]     = useState(false)

  useEffect(() => {
    // Detectar si ya está instalada
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
      return
    }

    // Capturar el evento beforeinstallprompt
    const handler = (e) => {
      e.preventDefault()
      setInstallPrompt(e)
      setCanInstall(true)
    }

    window.addEventListener('beforeinstallprompt', handler)

    // Detectar cuando se instala
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true)
      setCanInstall(false)
      setInstallPrompt(null)
    })

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const install = async () => {
    if (!installPrompt) return false
    installPrompt.prompt()
    const { outcome } = await installPrompt.userChoice
    if (outcome === 'accepted') {
      setCanInstall(false)
      setInstallPrompt(null)
      return true
    }
    return false
  }

  return { canInstall, install, isInstalled }
}

export default usePWAInstall