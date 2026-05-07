"use client"

import { useState } from "react"
import { MapContainer, TileLayer, ZoomControl, Circle, Tooltip } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import { SAFE_ZONES, ZONE_TYPE_COLORS, ZONE_TYPE_LABELS, type SafeZone } from "@/lib/map/safe-zones"
import { DEFAULT_MAP_CONFIG } from "@/lib/map/types"
import { cn } from "@/lib/utils"

const ZONE_TYPES = Object.keys(ZONE_TYPE_COLORS) as SafeZone["type"][]

export function SafeZonesMap() {
  const [activeFilters, setActiveFilters] = useState<Set<SafeZone["type"]>>(
    new Set(ZONE_TYPES)
  )

  const toggleFilter = (type: SafeZone["type"]) => {
    setActiveFilters((prev) => {
      const next = new Set(prev)
      if (next.has(type)) {
        next.delete(type)
      } else {
        next.add(type)
      }
      return next
    })
  }

  const filteredZones = SAFE_ZONES.filter((z) => activeFilters.has(z.type))

  return (
    <div className="relative w-full h-full">
      <MapContainer
        center={DEFAULT_MAP_CONFIG.center}
        zoom={DEFAULT_MAP_CONFIG.zoom}
        minZoom={DEFAULT_MAP_CONFIG.minZoom}
        maxZoom={DEFAULT_MAP_CONFIG.maxZoom}
        zoomControl={false}
        className="w-full h-full"
        style={{ background: "oklch(0.13 0.01 240)" }}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>'
          subdomains="abcd"
          maxZoom={20}
        />

        <ZoomControl position="bottomleft" />

        {filteredZones.map((zone) => (
          <Circle
            key={zone.id}
            center={[zone.center.lat, zone.center.lng]}
            radius={zone.radius}
            pathOptions={{
              color: ZONE_TYPE_COLORS[zone.type],
              fillColor: ZONE_TYPE_COLORS[zone.type],
              fillOpacity: 0.25,
              weight: 2,
            }}
          >
            <Tooltip direction="top" offset={[0, -10]} sticky>
              <div className="text-xs">
                <p className="font-semibold">{zone.name}</p>
                <p className="text-muted-foreground">{ZONE_TYPE_LABELS[zone.type]}</p>
              </div>
            </Tooltip>
          </Circle>
        ))}
      </MapContainer>

      {/* Filter panel */}
      <div className="absolute top-4 right-4 z-[1000] bg-card/90 backdrop-blur-sm border border-border rounded-lg p-3 shadow-lg">
        <p className="text-xs font-semibold text-foreground mb-2 uppercase tracking-wide">
          Filtrar Zonas
        </p>
        <div className="flex flex-col gap-1.5">
          {ZONE_TYPES.map((type) => (
            <button
              key={type}
              onClick={() => toggleFilter(type)}
              className={cn(
                "flex items-center gap-2 px-2 py-1.5 rounded text-xs font-medium transition-all",
                activeFilters.has(type)
                  ? "bg-secondary text-foreground"
                  : "bg-muted/50 text-muted-foreground opacity-50"
              )}
            >
              <span
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: ZONE_TYPE_COLORS[type] }}
              />
              {ZONE_TYPE_LABELS[type]}
            </button>
          ))}
        </div>
      </div>

      {/* Attribution */}
      <div className="absolute bottom-2 right-2 z-[999] text-[10px] text-muted-foreground/60 font-mono pointer-events-none">
        SafeRoute Durango — Zonas Seguras
      </div>
    </div>
  )
}
