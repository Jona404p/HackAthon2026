"use client"

import dynamic from "next/dynamic"
import { Navbar } from "@/components/layout/navbar"
import { Suspense, useState, useCallback, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Settings2 } from "lucide-react"
import type { Coordinate, RouteResult, RoutingOptions, Report } from "@/lib/map/safe-routing"
import { findSafeRoute } from "@/lib/map/safe-routing"

// Importar mapa y panel de control con SSR desactivado
const SafeRouteMap = dynamic(
  () => import("@/components/map/safe-route-map").then((m) => m.SafeRouteMap),
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

const RouteControlPanel = dynamic(
  () => import("@/components/map/route-control-panel").then((m) => m.RouteControlPanel),
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

function RutasSegurasContent() {
  // Estado de reportes
  const [reports, setReports] = useState<Report[]>([])
  const [isLoadingReports, setIsLoadingReports] = useState(true)

  // Estado de puntos de ruta
  const [origin, setOrigin] = useState<Coordinate | null>(null)
  const [destination, setDestination] = useState<Coordinate | null>(null)
  const [route, setRoute] = useState<RouteResult | null>(null)

  // Estado de seleccion
  const [isSelectingOrigin, setIsSelectingOrigin] = useState(false)
  const [isSelectingDestination, setIsSelectingDestination] = useState(false)
  const [isCalculating, setIsCalculating] = useState(false)

  // Estado de visualizacion
  const [showHeatmap, setShowHeatmap] = useState(true)

  // Estado de geolocalizacion
  const [userLocation, setUserLocation] = useState<Coordinate | null>(null)
  const [isLocating, setIsLocating] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)
  const watchIdRef = useRef<number | null>(null)

  // Estado del panel movil
  const [isPanelOpen, setIsPanelOpen] = useState(false)

  // Cargar reportes desde la API
  useEffect(() => {
    async function fetchReports() {
      try {
        const response = await fetch("/api/reports")
        const data = await response.json()
        
        if (data.reports) {
          setReports(data.reports)
        }
      } catch (error) {
        console.error("Error fetching reports:", error)
      } finally {
        setIsLoadingReports(false)
      }
    }

    fetchReports()
  }, [])

  // Limpiar watch de geolocation al desmontar
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
      }
    }
  }, [])

  // Funcion para obtener ubicacion actual
  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError("Tu navegador no soporta geolocalizacion")
      return
    }

    setIsLocating(true)
    setLocationError(null)

    // Limpiar watch anterior si existe
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
    }

    // Primero intentar obtener ubicacion precisa
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newLocation: Coordinate = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }
        setUserLocation(newLocation)
        setOrigin(newLocation)
        setIsLocating(false)
        setRoute(null) // Limpiar ruta anterior

        // Iniciar watch para actualizaciones en tiempo real
        watchIdRef.current = navigator.geolocation.watchPosition(
          (pos) => {
            setUserLocation({
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
            })
          },
          (err) => {
            console.error("Error watching position:", err)
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 5000,
          }
        )
      },
      (error) => {
        setIsLocating(false)
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError("Permiso de ubicacion denegado")
            break
          case error.POSITION_UNAVAILABLE:
            setLocationError("Ubicacion no disponible")
            break
          case error.TIMEOUT:
            setLocationError("Tiempo agotado")
            break
          default:
            setLocationError("Error desconocido")
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    )
  }, [])

  // Handlers de seleccion
  const handleSelectOriginClick = useCallback(() => {
    setIsSelectingOrigin(true)
    setIsSelectingDestination(false)
    setIsPanelOpen(false) // Cerrar panel en movil
  }, [])

  const handleSelectDestinationClick = useCallback(() => {
    setIsSelectingDestination(true)
    setIsSelectingOrigin(false)
    setIsPanelOpen(false) // Cerrar panel en movil
  }, [])

  const handleSelectOrigin = useCallback((coord: Coordinate) => {
    setOrigin(coord)
    setIsSelectingOrigin(false)
    setRoute(null)
    setIsPanelOpen(true) // Abrir panel despues de seleccionar
  }, [])

  const handleSelectDestination = useCallback((coord: Coordinate) => {
    setDestination(coord)
    setIsSelectingDestination(false)
    setRoute(null)
    setIsPanelOpen(true) // Abrir panel despues de seleccionar
  }, [])

  // Calcular ruta
  const handleCalculateRoute = useCallback(async (options: RoutingOptions) => {
    if (!origin || !destination) return

    setIsCalculating(true)
    
    try {
      const result = await findSafeRoute(origin, destination, reports, options)
      setRoute(result)
    } catch (error) {
      console.error("Error calculating route:", error)
    } finally {
      setIsCalculating(false)
    }
  }, [origin, destination, reports])

  // Limpiar ruta
  const handleClearRoute = useCallback(() => {
    setRoute(null)
    setOrigin(null)
    setDestination(null)
  }, [])

  // Toggle heatmap
  const handleToggleHeatmap = useCallback(() => {
    setShowHeatmap((prev) => !prev)
  }, [])

  // Panel de control para reutilizar
  const ControlPanelContent = (
    <RouteControlPanel
      origin={origin}
      destination={destination}
      route={route}
      isSelectingOrigin={isSelectingOrigin}
      isSelectingDestination={isSelectingDestination}
      isCalculating={isCalculating}
      showHeatmap={showHeatmap}
      userLocation={userLocation}
      isLocating={isLocating}
      locationError={locationError}
      onSelectOriginClick={handleSelectOriginClick}
      onSelectDestinationClick={handleSelectDestinationClick}
      onUseCurrentLocation={getCurrentLocation}
      onCalculateRoute={handleCalculateRoute}
      onClearRoute={handleClearRoute}
      onToggleHeatmap={handleToggleHeatmap}
      isMobile={false}
    />
  )

  const MobileControlPanelContent = (
    <RouteControlPanel
      origin={origin}
      destination={destination}
      route={route}
      isSelectingOrigin={isSelectingOrigin}
      isSelectingDestination={isSelectingDestination}
      isCalculating={isCalculating}
      showHeatmap={showHeatmap}
      userLocation={userLocation}
      isLocating={isLocating}
      locationError={locationError}
      onSelectOriginClick={handleSelectOriginClick}
      onSelectDestinationClick={handleSelectDestinationClick}
      onUseCurrentLocation={getCurrentLocation}
      onCalculateRoute={handleCalculateRoute}
      onClearRoute={handleClearRoute}
      onToggleHeatmap={handleToggleHeatmap}
      isMobile={true}
    />
  )

  return (
    <div className="flex flex-1 overflow-hidden relative">
      {/* Mapa - ocupa el espacio restante */}
      <div className="relative flex-1 min-w-0">
        {isLoadingReports ? (
          <div className="flex items-center justify-center w-full h-full bg-background">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <span className="font-mono text-muted-foreground text-sm">
                Cargando datos de seguridad...
              </span>
            </div>
          </div>
        ) : (
          <SafeRouteMap
            reports={reports}
            route={route}
            origin={origin}
            destination={destination}
            userLocation={userLocation}
            isSelectingOrigin={isSelectingOrigin}
            isSelectingDestination={isSelectingDestination}
            onSelectOrigin={handleSelectOrigin}
            onSelectDestination={handleSelectDestination}
            showHeatmap={showHeatmap}
          />
        )}

        {/* Mobile FAB para abrir panel */}
        <div className="lg:hidden absolute bottom-20 right-4 z-[999]">
          <Sheet open={isPanelOpen} onOpenChange={setIsPanelOpen}>
            <SheetTrigger asChild>
              <Button 
                size="lg" 
                className="rounded-full w-14 h-14 shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all"
                title="Configurar ruta segura"
              >
                <Settings2 className="w-6 h-6" />
                <span className="sr-only">Configurar ruta segura</span>
              </Button>
            </SheetTrigger>
            <SheetContent 
              side="bottom" 
              className="h-[85dvh] p-0 rounded-t-3xl border-t border-border/50 flex flex-col"
            >
              {/* Handle bar */}
              <div className="flex justify-center pt-3 pb-2 shrink-0 border-b border-border/30">
                <div className="w-10 h-1.5 rounded-full bg-muted-foreground/30" />
              </div>
              {/* Panel content con scroll propio */}
              <div className="flex-1 min-h-0">
                {MobileControlPanelContent}
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Quick info bar en movil cuando hay ruta */}
        {route && !isPanelOpen && (
          <div className="lg:hidden absolute bottom-[5.5rem] left-4 right-20 z-40">
            <button 
              onClick={() => setIsPanelOpen(true)}
              className="w-full bg-background/95 backdrop-blur-md border border-border/60 rounded-xl p-3.5 shadow-lg hover:shadow-xl transition-all active:scale-95"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={`w-3 h-3 rounded-full shrink-0 ${
                    route.safetyScore >= 60 ? 'bg-emerald-500' : 
                    route.safetyScore >= 40 ? 'bg-amber-500' : 'bg-red-500'
                  }`} />
                  <div className="text-left min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {Math.round(route.distance / 1000 * 10) / 10} km
                    </p>
                    <p className="text-xs text-muted-foreground">
                      ~{Math.round(route.estimatedTime)} min • {route.safetyScore}% seguro
                    </p>
                  </div>
                </div>
                <span className="text-xs font-medium text-primary whitespace-nowrap">
                  Ver más
                </span>
              </div>
            </button>
          </div>
        )}
      </div>

      {/* Panel de control desktop - oculto en movil */}
      <div className="hidden lg:block">
        {ControlPanelContent}
      </div>
    </div>
  )
}

export default function RutasSegurasPage() {
  return (
    <div className="flex flex-col h-[100dvh] bg-background overflow-hidden">
      <Navbar backToHome />

      <main className="flex flex-1 overflow-hidden" aria-label="Sistema de Rutas Seguras">
        <Suspense
          fallback={
            <div className="flex-1 flex items-center justify-center bg-background">
              <span className="font-mono text-muted-foreground text-sm animate-pulse">
                Cargando...
              </span>
            </div>
          }
        >
          <RutasSegurasContent />
        </Suspense>
      </main>
    </div>
  )
}
