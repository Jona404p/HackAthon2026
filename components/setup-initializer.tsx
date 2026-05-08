'use client'

import { useEffect, useRef } from 'react'

export function SetupInitializer() {
  const hasRunRef = useRef(false)

  useEffect(() => {
    if (hasRunRef.current) return
    hasRunRef.current = true

    // Verificar setup una sola vez al cargar la app
    const checkSetup = async () => {
      try {
        const response = await fetch('/api/setup', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        })

        const result = await response.json()

        if (result.status === 'ok') {
          console.log('[v0] Setup verification passed ✓')
        } else if (result.status === 'warning') {
          console.warn('[v0] Setup warning:', result.message, result.details)
        } else {
          console.error('[v0] Setup failed:', result.message, result.details)
        }
      } catch (error) {
        console.error('[v0] Setup check error:', error)
      }
    }

    // Ejecutar solo una vez, después de un pequeño delay
    const timer = setTimeout(checkSetup, 100)
    return () => clearTimeout(timer)
  }, [])

  return null
}
