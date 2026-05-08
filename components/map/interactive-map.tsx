"use client"

import { useState, useCallback, useEffect } from "react"
import { MapContainer, TileLayer, ZoomControl, useMap, useMapEvents } from "react-leaflet"
import L from "leaflet"
import { useTheme } from "next-themes"
import "leaflet/dist/leaflet.css"
import { LayerControl } from "./layer-control"
import { ReportMarkers } from "./report-markers"
import { LAYER_REGISTRY } from "@/lib/map/layer-registry"
import { DEFAULT_MAP_CONFIG } from "@/lib/map/types"
import type { MapLayer } from "@/lib/map/types"

// Tile layer URLs for different themes
const TILE_LAYERS = {
  dark: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
  light: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
}

interface InteractiveMapProps {
  initialLat?: number
  initialLng?: number
  initialZoom?: number
  // Picking mode — panel tells the map to capture the next click
  pickingLocation?: boolean
  onLocationPicked?: (lat: number, lng: number) => void
  // Focus a specific coordinate (from panel click on a report)
  focusLocation?: { lat: number; lng: number; zoom?: number } | null
  onFocusConsumed?: () => void
}

// Creates a custom teardrop pin icon
function createPendingIcon(color = "#ef4444") {
  const size = 40
  return L.divIcon({
    className: "pending-marker",
    html: `
      <div style="
        width:${size}px; height:${size}px;
        background:${color};
        border: 4px solid #fff;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        box-shadow: 0 4px 20px rgba(0,0,0,0.45);
        animation: pin-bounce 0.8s ease-in-out infinite alternate;
      "></div>
      <style>
        @keyframes pin-bounce {
          from { margin-top: 0; }
          to   { margin-top: -6px; }
        }
      </style>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  })
}

// Handles click-to-pick mode
function PickHandler({
  active,
  onPick,
}: {
  active: boolean
  onPick: (lat: number, lng: number) => void
}) {
  const map = useMap()

  useMapEvents({
    click(e) {
      if (active) {
        onPick(e.latlng.lat, e.latlng.lng)
      }
    },
  })

  useEffect(() => {
    const container = map.getContainer()
    container.style.cursor = active ? "crosshair" : ""
    return () => {
      container.style.cursor = ""
    }
  }, [active, map])

  return null
}

// Flies to a location when focusLocation changes
function FocusHandler({
  focusLocation,
  onConsumed,
}: {
  focusLocation: { lat: number; lng: number; zoom?: number } | null | undefined
  onConsumed?: () => void
}) {
  const map = useMap()

  useEffect(() => {
    if (!focusLocation) return
    map.flyTo([focusLocation.lat, focusLocation.lng], focusLocation.zoom ?? 17, { duration: 0.8 })
    onConsumed?.()
  }, [focusLocation, map, onConsumed])

  return null
}

export function InteractiveMap({
  initialLat,
  initialLng,
  initialZoom,
  pickingLocation = false,
  onLocationPicked,
  focusLocation,
  onFocusConsumed,
}: InteractiveMapProps) {
  const [layers, setLayers] = useState<MapLayer[]>(LAYER_REGISTRY)
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleToggle = useCallback((id: MapLayer["id"]) => {
    setLayers((prev) =>
      prev.map((l) => (l.id === id ? { ...l, enabled: !l.enabled } : l))
    )
  }, [])

  const center: [number, number] =
    initialLat !== undefined && initialLng !== undefined
      ? [initialLat, initialLng]
      : DEFAULT_MAP_CONFIG.center

  const zoom = initialZoom || DEFAULT_MAP_CONFIG.zoom

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
      <MapContainer
        center={center}
        zoom={zoom}
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

        <PickHandler
          active={pickingLocation}
          onPick={(lat, lng) => onLocationPicked?.(lat, lng)}
        />

        <FocusHandler
          focusLocation={focusLocation}
          onConsumed={onFocusConsumed}
        />

        {/* Render each active layer via its registered Component */}
        {layers.map(({ id, Component, enabled }) => (
          <Component key={id} enabled={enabled} />
        ))}

        {/* Report markers — reads from Supabase in realtime */}
        <ReportMarkers />
      </MapContainer>

      {/* Layer toggle panel */}
      <LayerControl layers={layers} onToggle={handleToggle} />

      {/* Attribution */}
      <div className="absolute bottom-2 right-2 z-[999] text-[10px] text-muted-foreground/60 font-mono pointer-events-none">
        NoFear Durango v0.1
      </div>
    </div>
  )
}
