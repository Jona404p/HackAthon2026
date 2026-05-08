"use client"

import { useEffect } from "react"
import { useMap } from "react-leaflet"
import L from "leaflet"
import "leaflet.heat"

// Categorías que contribuyen al mapa de calor de riesgo
const RISK_CATEGORIES = ["robo", "incendio", "accidente"]

// Peso de cada categoría para el heatmap (mayor = más intenso)
const CATEGORY_WEIGHTS: Record<string, number> = {
  robo: 1.0,      // Mayor peso - crimen directo
  incendio: 0.8,  // Alto riesgo
  accidente: 0.6, // Riesgo moderado
}

interface Report {
  id: string
  latitude: number
  longitude: number
  category: string
  created_at: string
}

interface HeatmapLayerProps {
  reports: Report[]
}

export function HeatmapLayer({ reports }: HeatmapLayerProps) {
  const map = useMap()

  useEffect(() => {
    if (!map || reports.length === 0) return

    // Filtrar solo los reportes de categorías de riesgo
    const riskReports = reports.filter((report) =>
      RISK_CATEGORIES.includes(report.category)
    )

    if (riskReports.length === 0) return

    // Convertir reportes a puntos de calor [lat, lng, intensity]
    const heatPoints: [number, number, number][] = riskReports
      .map((report) => {
        const weight = CATEGORY_WEIGHTS[report.category] || 0.5
        
        const reportDate = new Date(report.created_at)
        const now = new Date()
        const daysSinceReport = Math.max(1, (now.getTime() - reportDate.getTime()) / (1000 * 60 * 60 * 24))
        const timeDecay = Math.max(0.3, 1 - (daysSinceReport / 60))
        const intensity = weight * timeDecay

        return [report.latitude, report.longitude, intensity] as [number, number, number]
      })
      .filter(([lat, lng, intensity]) => {
        return (
          Number.isFinite(lat) &&
          Number.isFinite(lng) &&
          Math.abs(lat) <= 90 &&
          Math.abs(lng) <= 180 &&
          intensity > 0
        )
      })

    if (heatPoints.length === 0) return

    let heatLayer: L.Layer | null = null

    const addHeatLayer = () => {
      if (!map) return
      const size = map.getSize()
      if (size.x <= 0 || size.y <= 0) {
        map.invalidateSize()
        map.once('resize', () => addHeatLayer())
        return
      }

      // @ts-expect-error - leaflet.heat extends L
      heatLayer = L.heatLayer(heatPoints, {
        radius: 35,
        blur: 25,
        maxZoom: 17,
        max: 1.0,
        minOpacity: 0.4,
        gradient: {
          0.0: "#22c55e",  // Verde - bajo riesgo
          0.3: "#eab308",  // Amarillo - riesgo moderado
          0.5: "#f97316",  // Naranja - riesgo medio-alto
          0.7: "#ef4444",  // Rojo - alto riesgo
          1.0: "#dc2626",  // Rojo oscuro - muy alto riesgo
        },
      })

      heatLayer.addTo(map)
    }

    if (map._loaded && map.getSize().x > 0 && map.getSize().y > 0) {
      addHeatLayer()
    } else {
      map.whenReady(() => {
        addHeatLayer()
      })
    }

    return () => {
      if (heatLayer && map.hasLayer && map.hasLayer(heatLayer)) {
        map.removeLayer(heatLayer)
      }
    }
  }, [map, reports])

  return null
}
