"use client"

import { useEffect, useState, useMemo } from "react"
import { MapContainer, TileLayer, ZoomControl } from "react-leaflet"
import { useTheme } from "next-themes"
import { DEFAULT_MAP_CONFIG } from "@/lib/map/types"
import { HeatmapLayer } from "./heatmap-layer"
import { AlertTriangle, Flame, Car, Info, Loader2 } from "lucide-react"
import "leaflet/dist/leaflet.css"

const TILE_LAYERS = {
  dark: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
  light: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
}

const RISK_CATEGORIES = ["robo", "incendio", "accidente"]

interface Report {
  id: string
  latitude: number
  longitude: number
  category: string
  created_at: string
}

export function PostalCodesMap() {
  const [mounted, setMounted] = useState(false)
  const [reports, setReports] = useState<Report[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { resolvedTheme } = useTheme()

  useEffect(() => {
    setMounted(true)
  }, [])

  // Cargar reportes desde la API
  useEffect(() => {
    async function fetchReports() {
      try {
        setIsLoading(true)
        const response = await fetch("/api/reports")
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || "Error al cargar reportes")
        }

        setReports(data.reports || [])
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido")
      } finally {
        setIsLoading(false)
      }
    }

    fetchReports()
  }, [])

  // Filtrar solo reportes de riesgo
  const riskReports = useMemo(() => {
    return reports.filter((report) => RISK_CATEGORIES.includes(report.category))
  }, [reports])

  // Contar por categoría
  const categoryCounts = useMemo(() => {
    return {
      robo: riskReports.filter((r) => r.category === "robo").length,
      incendio: riskReports.filter((r) => r.category === "incendio").length,
      accidente: riskReports.filter((r) => r.category === "accidente").length,
    }
  }, [riskReports])

  const tileUrl = mounted
    ? resolvedTheme === "dark"
      ? TILE_LAYERS.dark
      : TILE_LAYERS.light
    : TILE_LAYERS.light

  const bgColor = mounted
    ? resolvedTheme === "dark"
      ? "oklch(0.13 0.01 240)"
      : "oklch(0.96 0.005 240)"
    : "oklch(0.96 0.005 240)"

  return (
    <div className="relative w-full h-full">
      {mounted && (
        <MapContainer
          key="postal-codes-map"
          center={DEFAULT_MAP_CONFIG.center}
          zoom={DEFAULT_MAP_CONFIG.zoom}
          minZoom={DEFAULT_MAP_CONFIG.minZoom}
          maxZoom={DEFAULT_MAP_CONFIG.maxZoom}
          zoomControl={false}
          className="w-full h-full"
          style={{ background: bgColor }}
        >
          <TileLayer
            key={tileUrl}
            url={tileUrl}
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>'
            subdomains="abcd"
            maxZoom={20}
          />
          <ZoomControl position="bottomleft" />
          
          {/* Heatmap layer */}
          {!isLoading && riskReports.length > 0 && (
            <HeatmapLayer reports={riskReports} />
          )}
        </MapContainer>
      )}

      {/* Panel de leyenda */}
      <div className="absolute top-4 right-4 z-[999] bg-background/95 backdrop-blur-sm border border-border rounded-xl shadow-lg p-4 max-w-[280px]">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-destructive/15 flex items-center justify-center">
            <AlertTriangle className="w-4 h-4 text-destructive" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-foreground">Mapa de Riesgo</h3>
            <p className="text-[10px] text-muted-foreground">Basado en reportes ciudadanos</p>
          </div>
        </div>

        {/* Estado de carga */}
        {isLoading && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
            <Loader2 className="w-3 h-3 animate-spin" />
            Cargando datos...
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="text-xs text-destructive py-2">
            Error: {error}
          </div>
        )}

        {/* Contadores por categoría */}
        {!isLoading && !error && (
          <>
            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded bg-orange-500/20 flex items-center justify-center">
                    <AlertTriangle className="w-3 h-3 text-orange-500" />
                  </div>
                  <span className="text-muted-foreground">Robos / Asaltos</span>
                </div>
                <span className="font-mono font-medium text-foreground">{categoryCounts.robo}</span>
              </div>
              
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded bg-red-500/20 flex items-center justify-center">
                    <Flame className="w-3 h-3 text-red-500" />
                  </div>
                  <span className="text-muted-foreground">Incendios</span>
                </div>
                <span className="font-mono font-medium text-foreground">{categoryCounts.incendio}</span>
              </div>
              
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded bg-red-600/20 flex items-center justify-center">
                    <Car className="w-3 h-3 text-red-600" />
                  </div>
                  <span className="text-muted-foreground">Accidentes</span>
                </div>
                <span className="font-mono font-medium text-foreground">{categoryCounts.accidente}</span>
              </div>
            </div>

            {/* Gradiente de intensidad */}
            <div className="border-t border-border pt-3">
              <p className="text-[10px] text-muted-foreground mb-2">Intensidad de riesgo</p>
              <div className="h-2 rounded-full overflow-hidden" style={{
                background: "linear-gradient(to right, #22c55e, #eab308, #f97316, #ef4444, #dc2626)"
              }} />
              <div className="flex justify-between mt-1">
                <span className="text-[9px] text-muted-foreground">Bajo</span>
                <span className="text-[9px] text-muted-foreground">Alto</span>
              </div>
            </div>

            {/* Info */}
            <div className="mt-3 pt-3 border-t border-border">
              <div className="flex items-start gap-2 text-[10px] text-muted-foreground">
                <Info className="w-3 h-3 mt-0.5 shrink-0" />
                <p>
                  El mapa de calor se genera automaticamente basado en la ubicacion y 
                  frecuencia de reportes. Las zonas mas rojas indican mayor concentracion 
                  de incidentes.
                </p>
              </div>
            </div>

            {riskReports.length === 0 && (
              <div className="text-xs text-muted-foreground text-center py-4">
                No hay reportes de riesgo disponibles
              </div>
            )}
          </>
        )}
      </div>

      <div className="absolute bottom-2 right-2 z-[999] text-[10px] text-muted-foreground/50 font-mono pointer-events-none">
        NoFear Durango
      </div>
    </div>
  )
}
