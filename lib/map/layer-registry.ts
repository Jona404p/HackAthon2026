/**
 * SafeRoute Durango — Layer Registry
 *
 * Central registry of all available map layers.
 * To add a new feature layer:
 *   1. Create a component in components/map/layers/
 *   2. Add an entry here with `enabled: false` (or true if default-on)
 *   3. The LayerRenderer and LayerControl will pick it up automatically.
 *
 * No other files need to change.
 */

import type { MapLayer } from "./types"

// Placeholder stub components — swap with real implementations later
import { RiskZonesLayer } from "@/components/map/layers/risk-zones-layer"
import { SafeZonesLayer } from "@/components/map/layers/safe-zones-layer"
import { RoutesLayer } from "@/components/map/layers/routes-layer"
import { TransitLayer } from "@/components/map/layers/transit-layer"

export const LAYER_REGISTRY: MapLayer[] = [
  {
    id: "risk-zones",
    label: "Zonas de Riesgo",
    description: "Polígonos o heatmap de incidencia delictiva",
    enabled: false,
    color: "var(--layer-risk)",
    Component: RiskZonesLayer,
  },
  {
    id: "safe-zones",
    label: "Zonas Seguras",
    description: "Áreas con baja incidencia y alta vigilancia",
    enabled: false,
    color: "var(--layer-safe)",
    Component: SafeZonesLayer,
  },
  {
    id: "routes",
    label: "Rutas Seguras",
    description: "Rutas óptimas evitando zonas de peligro",
    enabled: false,
    color: "var(--layer-route)",
    Component: RoutesLayer,
  },
  {
    id: "transit",
    label: "Transporte Público",
    description: "Líneas y paradas de transporte urbano",
    enabled: false,
    color: "var(--layer-transit)",
    Component: TransitLayer,
  },
]
