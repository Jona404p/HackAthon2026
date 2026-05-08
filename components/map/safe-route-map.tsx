"use client"

import { useState, useCallback, useEffect, useMemo } from "react"
import { MapContainer, TileLayer, ZoomControl, useMap, useMapEvents, Polyline, CircleMarker, Tooltip, Circle } from "react-leaflet"
import L from "leaflet"
import { useTheme } from "next-themes"
import "leaflet/dist/leaflet.css"
import "leaflet.heat"
import { DEFAULT_MAP_CONFIG } from "@/lib/map/types"
import type { Coordinate, RouteResult, Report } from "@/lib/map/safe-routing"
import { calculateRiskAtPoint } from "@/lib/map/safe-routing"

// Tile layers - usamos un estilo mas limpio/minimalista
const TILE_LAYERS = {
  dark: "https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png",
  light: "https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png",
}

// Categorias de riesgo para el heatmap
const RISK_CATEGORIES = ["robo", "incendio", "accidente"]
const CATEGORY_WEIGHTS: Record<string, number> = {
  robo: 1.0,
  incendio: 0.8,
  accidente: 0.6,
}

interface SafeRouteMapProps {
  reports: Report[]
  route: RouteResult | null
  origin: Coordinate | null
  destination: Coordinate | null
  userLocation: Coordinate | null
  isSelectingOrigin: boolean
  isSelectingDestination: boolean
  onSelectOrigin: (coord: Coordinate) => void
  onSelectDestination: (coord: Coordinate) => void
  showHeatmap?: boolean
}

// Componente para manejar clics en el mapa
function ClickHandler({
  isSelectingOrigin,
  isSelectingDestination,
  onSelectOrigin,
  onSelectDestination,
}: {
  isSelectingOrigin: boolean
  isSelectingDestination: boolean
  onSelectOrigin: (coord: Coordinate) => void
  onSelectDestination: (coord: Coordinate) => void
}) {
  const map = useMap()

  useMapEvents({
    click(e) {
      if (isSelectingOrigin) {
        onSelectOrigin({ lat: e.latlng.lat, lng: e.latlng.lng })
      } else if (isSelectingDestination) {
        onSelectDestination({ lat: e.latlng.lat, lng: e.latlng.lng })
      }
    },
  })

  useEffect(() => {
    const container = map.getContainer()
    if (isSelectingOrigin || isSelectingDestination) {
      container.style.cursor = "crosshair"
    } else {
      container.style.cursor = ""
    }
    return () => {
      container.style.cursor = ""
    }
  }, [isSelectingOrigin, isSelectingDestination, map])

  return null
}

// Componente para el mapa de calor
function HeatmapOverlay({ reports, enabled }: { reports: Report[]; enabled: boolean }) {
  const map = useMap()

  useEffect(() => {
    if (!map || !enabled || reports.length === 0) return

    const riskReports = reports.filter((report) => RISK_CATEGORIES.includes(report.category))

    if (riskReports.length === 0) return

    const heatPoints: [number, number, number][] = riskReports.map((report) => {
      const weight = CATEGORY_WEIGHTS[report.category] || 0.5
      const reportDate = new Date(report.created_at)
      const now = new Date()
      const daysSinceReport = Math.max(1, (now.getTime() - reportDate.getTime()) / (1000 * 60 * 60 * 24))
      const timeDecay = Math.max(0.3, 1 - daysSinceReport / 60)
      const intensity = weight * timeDecay
      return [report.latitude, report.longitude, intensity]
    })

    // @ts-expect-error - leaflet.heat extends L
    const heatLayer = L.heatLayer(heatPoints, {
      radius: 40,
      blur: 30,
      maxZoom: 17,
      max: 1.0,
      minOpacity: 0.35,
      gradient: {
        0.0: "rgba(34, 197, 94, 0.4)",   // Verde - bajo riesgo
        0.25: "rgba(234, 179, 8, 0.5)",  // Amarillo - riesgo moderado
        0.5: "rgba(249, 115, 22, 0.6)",  // Naranja - riesgo medio-alto
        0.75: "rgba(239, 68, 68, 0.7)",  // Rojo - alto riesgo
        1.0: "rgba(220, 38, 38, 0.8)",   // Rojo oscuro - muy alto riesgo
      },
    })

    heatLayer.addTo(map)

    return () => {
      map.removeLayer(heatLayer)
    }
  }, [map, reports, enabled])

  return null
}

// Componente para centrar el mapa en la ruta o ubicacion
function MapFitter({ 
  route, 
  origin, 
  destination, 
  userLocation 
}: { 
  route: RouteResult | null
  origin: Coordinate | null
  destination: Coordinate | null
  userLocation: Coordinate | null 
}) {
  const map = useMap()

  useEffect(() => {
    if (route && route.path.length > 1) {
      const bounds = L.latLngBounds(route.path.map((p) => [p.lat, p.lng]))
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 })
    } else if (origin && destination) {
      const bounds = L.latLngBounds([
        [origin.lat, origin.lng],
        [destination.lat, destination.lng],
      ])
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 })
    } else if (userLocation && !origin) {
      map.setView([userLocation.lat, userLocation.lng], 15)
    }
  }, [route, origin, destination, userLocation, map])

  return null
}

// Marcador de ubicacion del usuario con animacion
function UserLocationMarker({ location }: { location: Coordinate }) {
  return (
    <>
      {/* Circulo de precision */}
      <Circle
        center={[location.lat, location.lng]}
        radius={30}
        pathOptions={{
          fillColor: "#3b82f6",
          fillOpacity: 0.15,
          color: "#3b82f6",
          weight: 1,
          opacity: 0.3,
        }}
      />
      {/* Punto central con pulso */}
      <CircleMarker
        center={[location.lat, location.lng]}
        radius={8}
        pathOptions={{
          fillColor: "#3b82f6",
          fillOpacity: 1,
          color: "white",
          weight: 3,
        }}
      >
        <Tooltip direction="top" offset={[0, -10]}>
          <span className="font-medium text-xs">Tu ubicacion</span>
        </Tooltip>
      </CircleMarker>
      {/* Anillo de pulso animado (CSS animation via class) */}
      <CircleMarker
        center={[location.lat, location.lng]}
        radius={16}
        pathOptions={{
          fillColor: "transparent",
          fillOpacity: 0,
          color: "#3b82f6",
          weight: 2,
          opacity: 0.6,
        }}
        className="user-location-pulse"
      />
    </>
  )
}

export function SafeRouteMap({
  reports,
  route,
  origin,
  destination,
  userLocation,
  isSelectingOrigin,
  isSelectingDestination,
  onSelectOrigin,
  onSelectDestination,
  showHeatmap = true,
}: SafeRouteMapProps) {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const tileUrl = mounted
    ? resolvedTheme === "dark"
      ? TILE_LAYERS.dark
      : TILE_LAYERS.light
    : TILE_LAYERS.light

  const bgColor = mounted
    ? resolvedTheme === "dark"
      ? "oklch(0.10 0.005 240)"
      : "oklch(0.98 0.002 240)"
    : "oklch(0.98 0.002 240)"

  // Calcular colores de segmentos de ruta basados en riesgo
  const routeSegments = useMemo(() => {
    if (!route || route.path.length < 2) return []
    
    const segments: { path: [number, number][]; color: string; risk: number }[] = []
    
    // Para rutas reales, usar segmentos mas pequenos para mejor precision de color
    const pathLength = route.path.length
    const segmentSize = route.isRealRoute ? Math.max(1, Math.floor(pathLength / 30)) : 1
    
    for (let i = 0; i < pathLength - 1; i += segmentSize) {
      const endIdx = Math.min(i + segmentSize, pathLength - 1)
      const segmentPath: [number, number][] = []
      
      for (let j = i; j <= endIdx; j++) {
        segmentPath.push([route.path[j].lat, route.path[j].lng])
      }
      
      // Calcular riesgo promedio del segmento
      const midIdx = Math.floor((i + endIdx) / 2)
      const midpoint = route.path[midIdx]
      const segmentRisk = calculateRiskAtPoint(midpoint, reports)
      
      // Color basado en riesgo
      let color = "#22c55e" // Verde - seguro
      if (segmentRisk > 0.6) {
        color = "#ef4444" // Rojo - alto riesgo
      } else if (segmentRisk > 0.4) {
        color = "#f97316" // Naranja - riesgo medio
      } else if (segmentRisk > 0.2) {
        color = "#eab308" // Amarillo - riesgo bajo-medio
      }
      
      segments.push({
        path: segmentPath,
        color,
        risk: segmentRisk,
      })
    }
    
    return segments
  }, [route, reports])

  return (
    <div className="relative w-full h-full">
      {/* CSS para animacion de pulso */}
      <style jsx global>{`
        @keyframes pulse-ring {
          0% {
            transform: scale(1);
            opacity: 0.6;
          }
          100% {
            transform: scale(2);
            opacity: 0;
          }
        }
        .user-location-pulse path {
          animation: pulse-ring 2s ease-out infinite;
          transform-origin: center;
        }
      `}</style>

      <MapContainer
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
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          subdomains="abcd"
          maxZoom={20}
        />

        <ZoomControl position="bottomleft" />

        <ClickHandler
          isSelectingOrigin={isSelectingOrigin}
          isSelectingDestination={isSelectingDestination}
          onSelectOrigin={onSelectOrigin}
          onSelectDestination={onSelectDestination}
        />

        <HeatmapOverlay reports={reports} enabled={showHeatmap} />

        <MapFitter 
          route={route} 
          origin={origin} 
          destination={destination} 
          userLocation={userLocation}
        />

        {/* Marcador de ubicacion del usuario */}
        {userLocation && <UserLocationMarker location={userLocation} />}

        {/* Linea de fondo para la ruta (sombra) */}
        {route && route.path.length > 1 && (
          <Polyline
            positions={route.path.map((p) => [p.lat, p.lng])}
            pathOptions={{
              color: "#000",
              weight: 9,
              opacity: 0.15,
              lineCap: "round",
              lineJoin: "round",
            }}
          />
        )}

        {/* Renderizar segmentos de ruta con colores de riesgo */}
        {routeSegments.map((segment, index) => (
          <Polyline
            key={index}
            positions={segment.path}
            pathOptions={{
              color: segment.color,
              weight: 6,
              opacity: 0.95,
              lineCap: "round",
              lineJoin: "round",
            }}
          />
        ))}

        {/* Marcador de origen */}
        {origin && (
          <CircleMarker
            center={[origin.lat, origin.lng]}
            radius={10}
            pathOptions={{
              fillColor: "#22c55e",
              fillOpacity: 1,
              color: "white",
              weight: 3,
            }}
          >
            <Tooltip permanent direction="top" offset={[0, -10]}>
              <span className="font-medium text-xs">Origen</span>
            </Tooltip>
          </CircleMarker>
        )}

        {/* Marcador de destino */}
        {destination && (
          <CircleMarker
            center={[destination.lat, destination.lng]}
            radius={10}
            pathOptions={{
              fillColor: "#ef4444",
              fillOpacity: 1,
              color: "white",
              weight: 3,
            }}
          >
            <Tooltip permanent direction="top" offset={[0, -10]}>
              <span className="font-medium text-xs">Destino</span>
            </Tooltip>
          </CircleMarker>
        )}
      </MapContainer>

      {/* Overlay de seleccion */}
      {(isSelectingOrigin || isSelectingDestination) && (
        <div className="absolute inset-x-0 top-4 z-[1000] flex justify-center pointer-events-none">
          <div className="bg-primary text-primary-foreground px-5 py-2.5 rounded-full shadow-xl flex items-center gap-2.5 text-sm font-medium">
            <span className="w-2 h-2 rounded-full bg-primary-foreground animate-pulse shrink-0" />
            {isSelectingOrigin ? "Haz clic para seleccionar el punto de origen" : "Haz clic para seleccionar el destino"}
          </div>
        </div>
      )}

      {/* Leyenda del mapa de calor */}
      {showHeatmap && (
        <div className="absolute bottom-20 left-4 z-[999] bg-card/95 backdrop-blur-sm rounded-lg p-3 shadow-lg border border-border">
          <p className="text-xs font-medium text-foreground mb-2">Nivel de Riesgo</p>
          <div className="flex items-center gap-1">
            <div className="w-4 h-2 rounded-sm bg-green-500" />
            <div className="w-4 h-2 rounded-sm bg-yellow-500" />
            <div className="w-4 h-2 rounded-sm bg-orange-500" />
            <div className="w-4 h-2 rounded-sm bg-red-500" />
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
            <span>Bajo</span>
            <span>Alto</span>
          </div>
        </div>
      )}

      {/* Indicador de ubicacion */}
      {userLocation && (
        <div className="absolute top-4 left-4 z-[999] bg-blue-500/90 text-white px-3 py-1.5 rounded-full shadow-lg text-xs font-medium flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
          Ubicacion activa
        </div>
      )}

      {/* Attribution */}
      <div className="absolute bottom-2 right-2 z-[999] text-[10px] text-muted-foreground/60 font-mono pointer-events-none">
        SafeRoute Durango
      </div>
    </div>
  )
}
