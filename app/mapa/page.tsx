"use client"

import dynamic from "next/dynamic"
import { Navbar } from "@/components/layout/navbar"
import { useSearchParams, useRouter } from "next/navigation"
import { Suspense, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu, X } from "lucide-react"

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
  
  // Mobile panel state
  const [isPanelOpen, setIsPanelOpen] = useState(false)

  const handleRequestPick = useCallback(() => {
    setPickingLocation(true)
    setPickedLocation(null)
    setIsPanelOpen(false) // Cerrar panel en movil para ver el mapa
  }, [])

  const handleLocationPicked = useCallback((lat: number, lng: number) => {
    setPickedLocation({ lat, lng })
    setPickingLocation(false)
    setIsPanelOpen(true) // Abrir panel despues de seleccionar ubicacion
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
    setIsPanelOpen(false) // Cerrar panel para ver el reporte en el mapa
  }, [])

  const handleViewDiscussion = useCallback((postId: string) => {
    router.push(`/?post=${postId}`)
  }, [router])

  // Panel component para reutilizar en desktop y mobile
  const PanelContent = (
    <ReportPanel
      pickedLocation={pickedLocation}
      pickingLocation={pickingLocation}
      onRequestPick={handleRequestPick}
      onCancelPick={handleCancelPick}
      onReportSubmitted={handleReportSubmitted}
      onFocusReport={handleFocusReport}
      onViewDiscussion={handleViewDiscussion}
    />
  )

  return (
    <div className="flex flex-1 overflow-hidden relative">
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
          <div className="absolute inset-x-0 top-4 z-[1000] flex justify-center pointer-events-none px-4">
            <div className="bg-primary text-primary-foreground px-4 py-2 sm:px-5 sm:py-2.5 rounded-full shadow-xl flex items-center gap-2 text-xs sm:text-sm font-medium pointer-events-auto max-w-[90%]">
              <span className="w-2 h-2 rounded-full bg-primary-foreground animate-pulse shrink-0" />
              <span className="truncate">Toca el mapa para marcar la ubicacion</span>
              <button
                onClick={handleCancelPick}
                className="ml-1 opacity-70 hover:opacity-100 transition-opacity"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Mobile FAB to open panel */}
        <div className="lg:hidden absolute bottom-4 right-4 z-[999]">
          <Sheet open={isPanelOpen} onOpenChange={setIsPanelOpen}>
            <SheetTrigger asChild>
              <Button 
                size="lg" 
                className="rounded-full w-14 h-14 shadow-lg"
              >
                <Menu className="w-6 h-6" />
                <span className="sr-only">Abrir panel de reportes</span>
              </Button>
            </SheetTrigger>
            <SheetContent 
              side="bottom" 
              className="h-[85vh] p-0 rounded-t-3xl"
            >
              <div className="h-full overflow-hidden flex flex-col">
                {/* Handle bar */}
                <div className="flex justify-center py-3 shrink-0">
                  <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
                </div>
                <div className="flex-1 overflow-hidden">
                  {PanelContent}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Desktop panel - hidden on mobile */}
      <div className="hidden lg:block">
        {PanelContent}
      </div>
    </div>
  )
}

export default function MapaPage() {
  return (
    <div className="flex flex-col h-[100dvh] bg-background overflow-hidden">
      <Navbar backToHome />

      <main className="flex flex-1 overflow-hidden pt-[60px] sm:pt-[65px]" aria-label="Mapa interactivo de Durango">
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
