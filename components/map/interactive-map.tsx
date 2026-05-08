"use client"

import { useState, useCallback } from "react"
import { MapContainer, TileLayer, ZoomControl } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import { LayerControl } from "./layer-control"
import { LAYER_REGISTRY } from "@/lib/map/layer-registry"
import { DEFAULT_MAP_CONFIG } from "@/lib/map/types"
import type { MapLayer } from "@/lib/map/types"

export function InteractiveMap() {
  const [layers, setLayers] = useState<MapLayer[]>(LAYER_REGISTRY)

  const handleToggle = useCallback((id: MapLayer["id"]) => {
    setLayers((prev) =>
      prev.map((l) => (l.id === id ? { ...l, enabled: !l.enabled } : l))
    )
  }, [])

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
        {/* Dark tile layer via CartoDB Dark Matter */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>'
          subdomains="abcd"
          maxZoom={20}
        />

        {/* Custom zoom control position */}
        <ZoomControl position="bottomleft" />

        {/* Render each active layer via its registered Component */}
        {layers.map(({ id, Component, enabled }) => (
          <Component key={id} enabled={enabled} />
        ))}
      </MapContainer>

      {/* Layer toggle panel — rendered outside MapContainer for z-index control */}
      <LayerControl layers={layers} onToggle={handleToggle} />

      {/* Attribution overlay */}
      <div className="absolute bottom-2 right-2 z-[999] text-[10px] text-muted-foreground/60 font-mono pointer-events-none">
        NoFear Durango v0.1
      </div>
    </div>
  )
}
