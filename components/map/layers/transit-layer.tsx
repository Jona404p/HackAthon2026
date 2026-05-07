/**
 * TransitLayer — stub
 *
 * Future implementation:
 *   - Fetch GTFS or custom transit route data from API
 *   - Render bus lines as <Polyline> and stops as <CircleMarker>
 *   - Use --layer-transit color token
 */

import type { LayerComponentProps } from "@/lib/map/types"

export function TransitLayer({ enabled }: LayerComponentProps) {
  if (!enabled) return null
  // TODO: implement transit layer
  return null
}
