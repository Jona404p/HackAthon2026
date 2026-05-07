"use client"

import { useEffect, useState } from "react"
import { Polyline, CircleMarker, Tooltip } from "react-leaflet"
import type { LayerComponentProps } from "@/lib/map/types"
import { DURANGO_ROUTES, type TransitRoute } from "@/lib/map/transit-routes"

/**
 * Interpolate position along a polyline given progress [0,1]
 */
function interpolatePosition(
  points: { lat: number; lng: number }[],
  progress: number
): { lat: number; lng: number } {
  if (points.length < 2) return points[0]

  // Calculate total path length
  const segments: number[] = []
  let totalLength = 0
  for (let i = 0; i < points.length - 1; i++) {
    const dx = points[i + 1].lat - points[i].lat
    const dy = points[i + 1].lng - points[i].lng
    const segLen = Math.sqrt(dx * dx + dy * dy)
    segments.push(segLen)
    totalLength += segLen
  }

  // Find which segment and position within
  const targetDist = progress * totalLength
  let traveled = 0
  for (let i = 0; i < segments.length; i++) {
    if (traveled + segments[i] >= targetDist) {
      const segProgress = (targetDist - traveled) / segments[i]
      return {
        lat: points[i].lat + (points[i + 1].lat - points[i].lat) * segProgress,
        lng: points[i].lng + (points[i + 1].lng - points[i].lng) * segProgress,
      }
    }
    traveled += segments[i]
  }
  return points[points.length - 1]
}

interface AnimatedBusProps {
  route: TransitRoute
  offset: number // 0-1 starting offset for multiple buses
  speed: number // ms for full cycle
}

function AnimatedBus({ route, offset, speed }: AnimatedBusProps) {
  const [progress, setProgress] = useState(offset)
  const [direction, setDirection] = useState<1 | -1>(1)

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        const next = prev + (direction * 0.005)
        if (next >= 1) {
          setDirection(-1)
          return 1
        }
        if (next <= 0) {
          setDirection(1)
          return 0
        }
        return next
      })
    }, speed / 200)

    return () => clearInterval(interval)
  }, [direction, speed])

  const position = interpolatePosition(route.points, progress)

  return (
    <CircleMarker
      center={[position.lat, position.lng]}
      radius={8}
      pathOptions={{
        color: route.color,
        fillColor: route.color,
        fillOpacity: 1,
        weight: 3,
      }}
    >
      <Tooltip direction="top" offset={[0, -10]} permanent={false}>
        <span className="text-xs font-medium">{route.name.split(" ")[0]} {route.name.split(" ")[1]}</span>
      </Tooltip>
    </CircleMarker>
  )
}

export function TransitLayer({ enabled }: LayerComponentProps) {
  if (!enabled) return null

  return (
    <>
      {DURANGO_ROUTES.map((route) => (
        <Polyline
          key={route.name}
          positions={route.points.map((p) => [p.lat, p.lng])}
          pathOptions={{
            color: route.color,
            weight: 4,
            opacity: 0.7,
            lineCap: "round",
            lineJoin: "round",
          }}
        >
          <Tooltip sticky>
            <span className="text-xs font-medium">{route.name}</span>
          </Tooltip>
        </Polyline>
      ))}

      {/* Multiple animated buses per route */}
      {DURANGO_ROUTES.map((route) => (
        <>
          <AnimatedBus key={`${route.name}-bus-1`} route={route} offset={0} speed={8000} />
          <AnimatedBus key={`${route.name}-bus-2`} route={route} offset={0.5} speed={8000} />
        </>
      ))}
    </>
  )
}
