/**
 * RiskZonesLayer — stub
 *
 * Future implementation:
 *   - Fetch risk polygon GeoJSON from API
 *   - Render with react-leaflet <GeoJSON> or a heatmap plugin
 *   - Color by severity using the --layer-risk token
 */

import type { LayerComponentProps } from "@/lib/map/types"

export function RiskZonesLayer({ enabled }: LayerComponentProps) {
  if (!enabled) return null
  // TODO: implement risk zone polygons / heatmap
  return null
}
