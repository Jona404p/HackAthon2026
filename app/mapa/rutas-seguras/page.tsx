"use client"

import dynamic from "next/dynamic"
import { Navbar } from "@/components/layout/navbar"
import { Suspense, useState, useCallback, useEffect, useRef } from "react"
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
            setLocationError("Permiso de ubicacion denegado. Habilita la ubicacion en tu navegador.")
            break
          case error.POSITION_UNAVAILABLE:
            setLocationError("No se pudo determinar tu ubicacion. Intenta de nuevo.")
            break
          case error.TIMEOUT:
            setLocationError("Tiempo de espera agotado. Intenta de nuevo.")
            break
          default:
            setLocationError("Error desconocido al obtener ubicacion.")
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
  }, [])

  const handleSelectDestinationClick = useCallback(() => {
    setIsSelectingDestination(true)
    setIsSelectingOrigin(false)
  }, [])

  const handleSelectOrigin = useCallback((coord: Coordinate) => {
    setOrigin(coord)
    setIsSelectingOrigin(false)
    setRoute(null) // Limpiar ruta anterior
  }, [])

  const handleSelectDestination = useCallback((coord: Coordinate) => {
    setDestination(coord)
    setIsSelectingDestination(false)
    setRoute(null) // Limpiar ruta anterior
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

  return (
    <div className="flex flex-1 overflow-hidden">
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
      </div>

      {/* Panel de control */}
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
      />
    </div>
  )
}

export default function RutasSegurasPage() {
  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      <Navbar backToHome />

      <main className="flex flex-1 overflow-hidden pt-[65px]" aria-label="Sistema de Rutas Seguras">
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
