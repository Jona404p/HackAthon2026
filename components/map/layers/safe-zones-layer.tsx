/**
 * SafeZonesLayer — stub
 *
 * Future implementation:
 *   - Fetch safe area polygons from API
 *   - Render with react-leaflet <Polygon> using --layer-safe color
 */

import type { LayerComponentProps } from "@/lib/map/types"

export function SafeZonesLayer({ enabled }: LayerComponentProps) {
  if (!enabled) return null
  // TODO: implement safe zone polygons
  return null
}
