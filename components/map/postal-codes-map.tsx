"use client"

import { useState, useEffect, useCallback } from "react"
import { MapContainer, TileLayer, ZoomControl, GeoJSON, Tooltip } from "react-leaflet"
import type { Layer, PathOptions } from "leaflet"
import type { Feature } from "geojson"
import osmtogeojson from "osmtogeojson"
import "leaflet/dist/leaflet.css"
import {
  POSTAL_CODES,
  CP_LOOKUP,
  SECURITY_COLORS,
  SECURITY_LABELS,
  type SecurityLevel,
} from "@/lib/map/postal-codes"
import { getPostalCodeCoordinates, generateCirclePolygon } from "@/lib/map/postal-codes-coords"
import { DEFAULT_MAP_CONFIG } from "@/lib/map/types"
import { cn } from "@/lib/utils"

// Build the Overpass query fetching all postal code boundaries at once
function buildOverpassQuery(cps: string[]): string {
  const cpList = cps.map((cp) => `"postal_code"="${cp}"`).join(" ")
  return `
    [out:json][timeout:60];
    (
      relation["boundary"="postal_code"](area["name"="Durango"]["admin_level"="4"]);
      ${cps.map((cp) => `relation["postal_code"="${cp}"]["boundary"="postal_code"];`).join("\n      ")}
    );
    out body;
    >;
    out skel qt;
  `.trim()
}

// Fallback: build a circular polygon for a postal code
function fallbackPolygon(cp: string) {
  const coords = getPostalCodeCoordinates(cp)
  if (!coords) {
    // Last resort fallback for unknown postal codes
    return generateCirclePolygon(24.028, -104.653, 0.008, 12)
  }
  return generateCirclePolygon(coords.lat, coords.lng, coords.radius, 24)
}

type LoadStatus = "idle" | "loading" | "done" | "error"

interface GeoJsonEntry {
  cp: string
  level: SecurityLevel
  colonias: string
  geojson: ReturnType<typeof osmtogeojson> | { type: "FeatureCollection"; features: ReturnType<typeof squarePolygon>[] }
}

const LEVEL_FILTERS: SecurityLevel[] = ["seguro", "precaucion", "riesgo"]

export function PostalCodesMap() {
  const [entries, setEntries] = useState<GeoJsonEntry[]>([])
  const [status, setStatus] = useState<LoadStatus>("idle")
  const [activeFilters, setActiveFilters] = useState<Set<SecurityLevel>>(new Set(LEVEL_FILTERS))
  const [hoveredCp, setHoveredCp] = useState<string | null>(null)

  const toggleFilter = (level: SecurityLevel) => {
    setActiveFilters((prev) => {
      const next = new Set(prev)
      if (next.has(level)) next.delete(level)
      else next.add(level)
      return next
    })
  }

  useEffect(() => {
    setStatus("loading")

    const cpList = POSTAL_CODES.map((e) => e.cp)

    // Query Overpass for all CPs at once
    const query = cpList
      .map(
        (cp) =>
          `relation["postal_code"="${cp}"]["boundary"="postal_code"];`
      )
      .join("\n")

    const overpassQuery = `[out:json][timeout:60];\n(\n${query}\n);\nout body;\n>;\nout skel qt;`

    fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `data=${encodeURIComponent(overpassQuery)}`,
    })
      .then((r) => r.json())
      .then((osmData) => {
        const gj = osmtogeojson(osmData) as { type: string; features: Feature[] }
        const foundCps = new Set<string>()

        // Group features by postal_code property
        const featuresByCp = new Map<string, Feature[]>()
        for (const feature of gj.features) {
          const cp =
            (feature.properties?.postal_code as string) ||
            (feature.properties?.["addr:postcode"] as string)
          if (cp && CP_LOOKUP.has(cp)) {
            if (!featuresByCp.has(cp)) featuresByCp.set(cp, [])
            featuresByCp.get(cp)!.push(feature)
            foundCps.add(cp)
          }
        }

        const result: GeoJsonEntry[] = []

        // Add entries from Overpass
        for (const [cp, features] of featuresByCp) {
          const meta = CP_LOOKUP.get(cp)!
          result.push({
            cp,
            level: meta.level,
            colonias: meta.colonias,
            geojson: { type: "FeatureCollection", features },
          })
        }

        // Fallback circles for CPs not found in Overpass
        for (const entry of POSTAL_CODES) {
          if (!foundCps.has(entry.cp)) {
            result.push({
              cp: entry.cp,
              level: entry.level,
              colonias: entry.colonias,
              geojson: {
                type: "FeatureCollection",
                features: [fallbackPolygon(entry.cp)],
              },
            })
          }
        }

        setEntries(result)
        setStatus("done")
      })
      .catch(() => {
        // Full fallback: render circles for every CP
        const result: GeoJsonEntry[] = POSTAL_CODES.map((entry) => {
          return {
            cp: entry.cp,
            level: entry.level,
            colonias: entry.colonias,
            geojson: {
              type: "FeatureCollection",
              features: [fallbackPolygon(entry.cp)],
            },
          }
        })
        setEntries(result)
        setStatus("error")
      })
  }, [])

  const styleForEntry = useCallback(
    (entry: GeoJsonEntry): PathOptions => {
      const color = SECURITY_COLORS[entry.level]
      const isHovered = hoveredCp === entry.cp
      return {
        color,
        fillColor: color,
        fillOpacity: isHovered ? 0.60 : 0.28,
        weight: isHovered ? 3.0 : 1.8,
        opacity: 1.0,
      }
    },
    [hoveredCp]
  )

  const onEachFeature = useCallback(
    (entry: GeoJsonEntry) =>
      (_feature: Feature, layer: Layer) => {
        layer.on({
          mouseover: () => setHoveredCp(entry.cp),
          mouseout: () => setHoveredCp(null),
        })
      },
    []
  )

  const visibleEntries = entries.filter((e) => activeFilters.has(e.level))

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

        {visibleEntries.map((entry) => (
          <GeoJSON
            key={`${entry.cp}-${hoveredCp === entry.cp}`}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            data={entry.geojson as any}
            style={styleForEntry(entry)}
            onEachFeature={onEachFeature(entry)}
          >
            <Tooltip sticky direction="top">
              <div className="text-xs space-y-0.5">
                <p className="font-bold font-mono">CP {entry.cp}</p>
                <p className="font-semibold" style={{ color: SECURITY_COLORS[entry.level] }}>
                  {SECURITY_LABELS[entry.level]}
                </p>
                <p className="text-muted-foreground">{entry.colonias}</p>
              </div>
            </Tooltip>
          </GeoJSON>
        ))}
      </MapContainer>

      {/* Legend / filter panel */}
      <div className="absolute top-4 right-4 z-[1000] bg-card/90 backdrop-blur-sm border border-border rounded-lg p-3 shadow-lg min-w-[180px]">
        <p className="text-xs font-semibold text-foreground mb-2 uppercase tracking-wide font-mono">
          Nivel de Seguridad
        </p>
        <div className="flex flex-col gap-1.5">
          {LEVEL_FILTERS.map((level) => (
            <button
              key={level}
              onClick={() => toggleFilter(level)}
              className={cn(
                "flex items-center gap-2 px-2 py-1.5 rounded text-xs font-medium transition-all text-left",
                activeFilters.has(level)
                  ? "bg-secondary text-foreground"
                  : "bg-muted/30 text-muted-foreground opacity-40"
              )}
            >
              <span
                className="w-3 h-3 rounded-sm shrink-0"
                style={{ backgroundColor: SECURITY_COLORS[level] }}
              />
              <span className="leading-tight">{SECURITY_LABELS[level]}</span>
            </button>
          ))}
        </div>

        {status === "loading" && (
          <p className="text-[10px] text-muted-foreground mt-2 font-mono animate-pulse">
            Cargando polígonos…
          </p>
        )}
        {status === "error" && (
          <p className="text-[10px] text-yellow-500/70 mt-2 font-mono">
            Usando polígonos aproximados
          </p>
        )}
      </div>

      <div className="absolute bottom-2 right-2 z-[999] text-[10px] text-muted-foreground/60 font-mono pointer-events-none">
        NoFear Durango — Códigos Postales
      </div>
    </div>
  )
}
