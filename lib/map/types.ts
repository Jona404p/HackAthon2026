/**
 * SafeRoute Durango — Map Layer System
 *
 * Architecture for pluggable map layers. Each future feature (risk zones,
 * safe zones, routing, transit) registers a MapLayer and is rendered by
 * the LayerRenderer component without touching the core map setup.
 */

export type LayerId = "risk-zones" | "safe-zones" | "routes" | "transit"

export interface MapLayer {
  /** Unique identifier for this layer */
  id: LayerId
  /** Human-readable name (Spanish) */
  label: string
  /** Brief description for the legend */
  description: string
  /** Whether the layer is currently active/visible */
  enabled: boolean
  /** CSS color token or hex — used in the legend */
  color: string
  /**
   * The React component that renders Leaflet elements for this layer.
   * Receives the current enabled state and any future layer-specific config.
   * Return null when disabled.
   */
  Component: React.ComponentType<LayerComponentProps>
}

export interface LayerComponentProps {
  enabled: boolean
}

/** Map viewport configuration */
export interface MapConfig {
  center: [number, number]
  zoom: number
  minZoom?: number
  maxZoom?: number
}

/** Durango, México city center */
export const DURANGO_CENTER: [number, number] = [24.0277, -104.6532]

export const DEFAULT_MAP_CONFIG: MapConfig = {
  center: DURANGO_CENTER,
  zoom: 13,
  minZoom: 10,
  maxZoom: 18,
}
