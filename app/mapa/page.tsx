"use client"

import dynamic from "next/dynamic"
import { Navbar } from "@/components/layout/navbar"
import { MobileNavTabs } from "@/components/layout/mobile-nav-tabs"
import { useSearchParams, useRouter } from "next/navigation"
import { Suspense, useState, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Menu, X, MapPin, PanelLeft, PanelLeftClose } from "lucide-react"
import { cn } from "@/lib/utils"

// Leaflet requires the browser — disable SSR for the map component
const InteractiveMap = dynamic(
  () => import("@/components/map/interactive-map").then((m) => m.InteractiveMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col items-center justify-center w-full h-full bg-background gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center animate-pulse">
          <MapPin className="w-5 h-5 text-primary/60" />
        </div>
        <span className="text-muted-foreground text-sm font-medium">
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
      <div className="flex flex-col items-center justify-center w-full h-full bg-background gap-3">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center animate-pulse">
          <PanelLeft className="w-4 h-4 text-primary/60" />
        </div>
        <span className="text-muted-foreground text-xs">
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
  // Desktop panel toggle
  const [isDesktopPanelOpen, setIsDesktopPanelOpen] = useState(true)

  const handleRequestPick = useCallback(() => {
    setPickingLocation(true)
    setPickedLocation(null)
    setIsPanelOpen(false)
  }, [])

  const handleLocationPicked = useCallback((lat: number, lng: number) => {
    setPickedLocation({ lat, lng })
    setPickingLocation(false)
    setIsPanelOpen(true)
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
    setIsPanelOpen(false)
  }, [])

  const handleViewDiscussion = useCallback((postId: string) => {
    router.push(`/?post=${postId}`)
  }, [router])

  // Panel component para reutilizar
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
            <div className="flex flex-col items-center justify-center w-full h-full bg-background gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center animate-pulse">
                <MapPin className="w-5 h-5 text-primary/60" />
              </div>
              <span className="text-muted-foreground text-sm">Cargando mapa...</span>
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
            <div className="bg-primary text-primary-foreground px-4 py-2.5 sm:px-5 sm:py-3 rounded-2xl shadow-xl shadow-primary/20 flex items-center gap-2.5 text-xs sm:text-sm font-semibold pointer-events-auto max-w-[92%] backdrop-blur-sm">
              <span className="relative flex h-2.5 w-2.5 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-foreground opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary-foreground" />
              </span>
              <span className="truncate">Toca el mapa para marcar la ubicación</span>
              <button
                onClick={handleCancelPick}
                className="ml-1 w-6 h-6 rounded-full bg-primary-foreground/20 flex items-center justify-center hover:bg-primary-foreground/30 transition-colors shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Desktop panel toggle button */}
        <div className="hidden lg:block absolute top-4 left-4 z-[999]">
          <button
            onClick={() => setIsDesktopPanelOpen(!isDesktopPanelOpen)}
            className={cn(
              "w-10 h-10 rounded-xl bg-background/95 backdrop-blur-md border border-border/60 shadow-lg flex items-center justify-center text-foreground hover:bg-background transition-all active:scale-95",
              isDesktopPanelOpen && "border-primary/30 text-primary"
            )}
            title={isDesktopPanelOpen ? "Cerrar panel" : "Abrir panel"}
          >
            {isDesktopPanelOpen ? (
              <PanelLeftClose className="w-4.5 h-4.5" />
            ) : (
              <PanelLeft className="w-4.5 h-4.5" />
            )}
          </button>
        </div>

        {/* Mobile panel action bar */}
        <div className="lg:hidden fixed inset-x-0 bottom-16 z-[999] px-4">
          <div className="flex items-center justify-between gap-3 rounded-3xl border border-border/70 bg-background/95 p-3 shadow-2xl shadow-black/10 backdrop-blur-md">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">Panel de reportes</p>
              <p className="text-xs text-muted-foreground">Abre el panel para ver y crear reportes desde el mapa.</p>
            </div>
            <Sheet open={isPanelOpen} onOpenChange={setIsPanelOpen}>
              <SheetTrigger asChild>
                <Button 
                  size="sm" 
                  className="rounded-full w-12 h-12 shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all active:scale-95"
                  title="Abrir panel de reportes"
                >
                  <Menu className="w-5 h-5" />
                  <span className="sr-only">Abrir panel de reportes</span>
                </Button>
              </SheetTrigger>
              <SheetContent 
                side="bottom" 
                className="h-[85dvh] p-0 rounded-t-3xl border-t border-border/50 flex flex-col"
              >
                <DialogTitle className="sr-only">Panel de reportes</DialogTitle>
                <DialogDescription className="sr-only">Panel móvil para ver y crear reportes en el mapa</DialogDescription>
                {/* Handle bar */}
                <div className="flex justify-center pt-3 pb-2 shrink-0 border-b border-border/30">
                  <div className="w-10 h-1.5 rounded-full bg-muted-foreground/30" />
                </div>
                {/* Panel content — ocupa el espacio restante con su propio scroll */}
                <div className="flex-1 min-h-0">
                  {PanelContent}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>

      {/* Desktop panel */}
      <div className={cn(
        "hidden lg:block transition-all duration-300 ease-out border-l border-border/50",
        isDesktopPanelOpen ? "w-80 xl:w-96 opacity-100" : "w-0 opacity-0 overflow-hidden"
      )}>
        {PanelContent}
      </div>
    </div>
  )
}

export default function MapaPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background overflow-hidden">
      <Navbar backToHome />

      <main 
        className="flex flex-col flex-1 min-h-0 overflow-hidden pb-20" 
        aria-label="Mapa interactivo de Durango"
      >
        <Suspense
          fallback={
            <div className="flex-1 flex items-center justify-center bg-background">
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center animate-pulse">
                  <MapPin className="w-5 h-5 text-primary/60" />
                </div>
                <span className="text-muted-foreground text-sm">Cargando...</span>
              </div>
            </div>
          }
        >
          <MapaContent />
        </Suspense>
      </main>

      <MobileNavTabs />
    </div>
  )
}
