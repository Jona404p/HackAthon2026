"use client"

import dynamic from "next/dynamic"
import { Navbar } from "@/components/layout/navbar"
import { useSearchParams, useRouter } from "next/navigation"
import { Suspense, useState, useCallback } from "react"

// Leaflet requires the browser — disable SSR for the map component
const InteractiveMap = dynamic(
  () => import("@/components/map/interactive-map").then((m) => m.InteractiveMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center w-full h-full bg-background">
        <span className="font-mono text-muted-foreground text-sm animate-pulse">
          Cargando mapa...
        </span>
      </div>
    ),
  }
)

const ReportPanel = dynamic(
  () => import("@/components/map/report-panel").then((m) => m.ReportPanel),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center w-full h-full bg-background">
        <span className="font-mono text-muted-foreground text-sm animate-pulse">
          Cargando panel...
        </span>
      </div>
    ),
  }
)

function MapaContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const lat = searchParams.get("lat")
  const lng = searchParams.get("lng")
  const zoom = searchParams.get("zoom")

  // State shared between map and panel
  const [pickingLocation, setPickingLocation] = useState(false)
  const [pickedLocation, setPickedLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [focusLocation, setFocusLocation] = useState<{ lat: number; lng: number; zoom?: number } | null>(null)

  const handleRequestPick = useCallback(() => {
    setPickingLocation(true)
    setPickedLocation(null)
  }, [])

  const handleLocationPicked = useCallback((lat: number, lng: number) => {
    setPickedLocation({ lat, lng })
    setPickingLocation(false)
  }, [])

  const handleCancelPick = useCallback(() => {
    setPickingLocation(false)
    setPickedLocation(null)
  }, [])

  const handleReportSubmitted = useCallback(() => {
    setPickingLocation(false)
    setPickedLocation(null)
  }, [])

  const handleFocusReport = useCallback((lat: number, lng: number, zoom?: number) => {
    setFocusLocation({ lat, lng, zoom })
  }, [])

  const handleViewDiscussion = useCallback((postId: string) => {
    router.push(`/?post=${postId}`)
  }, [router])

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Map — fills remaining space */}
      <div className="relative flex-1 min-w-0">
        <Suspense
          fallback={
            <div className="flex items-center justify-center w-full h-full bg-background">
              <span className="font-mono text-muted-foreground text-sm animate-pulse">
                Cargando mapa...
              </span>
            </div>
          }
        >
          <InteractiveMap
            initialLat={lat ? parseFloat(lat) : undefined}
            initialLng={lng ? parseFloat(lng) : undefined}
            initialZoom={zoom ? parseInt(zoom, 10) : undefined}
            pickingLocation={pickingLocation}
            onLocationPicked={handleLocationPicked}
            focusLocation={focusLocation}
            onFocusConsumed={() => setFocusLocation(null)}
          />
        </Suspense>

        {/* Picking mode overlay banner */}
        {pickingLocation && (
          <div className="absolute inset-x-0 top-4 z-[1000] flex justify-center pointer-events-none">
            <div className="bg-primary text-primary-foreground px-5 py-2.5 rounded-full shadow-xl flex items-center gap-2.5 text-sm font-medium pointer-events-auto">
              <span className="w-2 h-2 rounded-full bg-primary-foreground animate-pulse shrink-0" />
              Haz clic en el mapa para marcar la ubicacion
              <button
                onClick={handleCancelPick}
                className="ml-1 opacity-70 hover:opacity-100 transition-opacity text-xs underline"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Right panel */}
      <ReportPanel
        pickedLocation={pickedLocation}
        pickingLocation={pickingLocation}
        onRequestPick={handleRequestPick}
        onCancelPick={handleCancelPick}
        onReportSubmitted={handleReportSubmitted}
        onFocusReport={handleFocusReport}
        onViewDiscussion={handleViewDiscussion}
      />
    </div>
  )
}

export default function MapaPage() {
  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      <Navbar backToHome />

      <main className="flex flex-1 overflow-hidden pt-[65px]" aria-label="Mapa interactivo de Durango">
        <Suspense
          fallback={
            <div className="flex-1 flex items-center justify-center bg-background">
              <span className="font-mono text-muted-foreground text-sm animate-pulse">
                Cargando...
              </span>
            </div>
          }
        >
          <MapaContent />
        </Suspense>
      </main>
    </div>
  )
}
