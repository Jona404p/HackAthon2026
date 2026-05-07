/**
 * RoutesLayer — stub
 *
 * Future implementation:
 *   - Accept origin/destination from user input
 *   - Call routing API (OSRM or PostGIS pgRouting) avoiding risk zones
 *   - Render route as react-leaflet <Polyline> with --layer-route color
 */

import type { LayerComponentProps } from "@/lib/map/types"

export function RoutesLayer({ enabled }: LayerComponentProps) {
  if (!enabled) return null
  // TODO: implement safe routing
  return null
}
