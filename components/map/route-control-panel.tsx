"use client"

import { useState, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Separator } from "@/components/ui/separator"

import {
  MapPin,
  Navigation,
  Route,
  Shield,
  Clock,
  Ruler,
  AlertTriangle,
  RefreshCw,
  ChevronRight,
  Crosshair,
  Target,
  Zap,
  Eye,
  EyeOff,
  Footprints,
  Car,
  Bike,
  CheckCircle2,
  LocateFixed,
  Loader2,
  MapPinOff,
} from "lucide-react"
import type { Coordinate, RouteResult, RoutingOptions } from "@/lib/map/safe-routing"
import { formatDistance, formatTime } from "@/lib/map/safe-routing"

interface RouteControlPanelProps {
  origin: Coordinate | null
  destination: Coordinate | null
  route: RouteResult | null
  isSelectingOrigin: boolean
  isSelectingDestination: boolean
  isCalculating: boolean
  showHeatmap: boolean
  userLocation: Coordinate | null
  isLocating: boolean
  locationError: string | null
  onSelectOriginClick: () => void
  onSelectDestinationClick: () => void
  onUseCurrentLocation: () => void
  onCalculateRoute: (options: RoutingOptions) => void
  onClearRoute: () => void
  onToggleHeatmap: () => void
  isMobile?: boolean
}

export function RouteControlPanel({
  origin,
  destination,
  route,
  isSelectingOrigin,
  isSelectingDestination,
  isCalculating,
  showHeatmap,
  userLocation,
  isLocating,
  locationError,
  onSelectOriginClick,
  onSelectDestinationClick,
  onUseCurrentLocation,
  onCalculateRoute,
  onClearRoute,
  onToggleHeatmap,
  isMobile = false,
}: RouteControlPanelProps) {
  const [prioritizeSafety, setPrioritizeSafety] = useState(true)
  const [safetyWeight, setSafetyWeight] = useState(60)
  const [avoidHighRisk, setAvoidHighRisk] = useState(true)
  const [routeType, setRouteType] = useState<"walking" | "driving" | "cycling">("walking")

  // Actualizar automaticamente cuando cambia el slider
  const handleSliderChange = useCallback((value: number[]) => {
    setSafetyWeight(value[0])
  }, [])

  const handleCalculateRoute = useCallback(() => {
    onCalculateRoute({
      prioritizeSafety,
      safetyWeight: safetyWeight / 100,
      avoidHighRisk,
      routeType,
    })
  }, [onCalculateRoute, prioritizeSafety, safetyWeight, avoidHighRisk, routeType])

  // Auto-calcular ruta cuando cambian las opciones y ya hay una ruta
  useEffect(() => {
    if (route && origin && destination) {
      const timeoutId = setTimeout(() => {
        handleCalculateRoute()
      }, 300)
      return () => clearTimeout(timeoutId)
    }
  }, [safetyWeight, routeType, prioritizeSafety, avoidHighRisk])

  const canCalculate = origin !== null && destination !== null && !isCalculating

  // Formatear coordenadas para mostrar
  const formatCoord = (coord: Coordinate | null) => {
    if (!coord) return "No seleccionado"
    return `${coord.lat.toFixed(4)}, ${coord.lng.toFixed(4)}`
  }

  // Calcular nivel de seguridad visual
  const getSafetyLevel = (score: number) => {
    if (score >= 80) return { label: "Muy Segura", color: "bg-green-500", textColor: "text-green-700" }
    if (score >= 60) return { label: "Segura", color: "bg-green-400", textColor: "text-green-600" }
    if (score >= 40) return { label: "Moderada", color: "bg-yellow-500", textColor: "text-yellow-700" }
    if (score >= 20) return { label: "Riesgo Medio", color: "bg-orange-500", textColor: "text-orange-700" }
    return { label: "Alto Riesgo", color: "bg-red-500", textColor: "text-red-700" }
  }

  // Descripcion del balance
  const getBalanceDescription = (value: number) => {
    if (value <= 20) return "Ruta mas corta"
    if (value <= 40) return "Prioriza distancia"
    if (value <= 60) return "Equilibrado"
    if (value <= 80) return "Prioriza seguridad"
    return "Ruta mas segura"
  }

  const containerClass = isMobile 
    ? "flex flex-col h-full overflow-hidden bg-background"
    : "w-80 bg-card border-l border-border flex flex-col h-full overflow-hidden"

  return (
    <div className={containerClass}>
      {/* Header - solo en desktop */}
      {!isMobile && (
        <div className="p-4 border-b border-border bg-card/80 backdrop-blur-sm shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Route className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">Rutas Seguras</h2>
              <p className="text-xs text-muted-foreground">Calcula la ruta mas segura</p>
            </div>
          </div>
        </div>
      )}

      {/* Header mobile */}
      {isMobile && (
        <div className="px-4 pb-2 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <Route className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground text-base">Configurar Ruta</h2>
              <p className="text-xs text-muted-foreground">Selecciona origen y destino</p>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className={`p-4 space-y-4 ${isMobile ? 'pb-24' : ''}`}>
          {/* Puntos de ruta */}
          <Card>
            <CardHeader className={`${isMobile ? 'pb-2 pt-3 px-3' : 'pb-3'}`}>
              <CardTitle className="text-sm flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Puntos de Ruta
              </CardTitle>
            </CardHeader>
            <CardContent className={`space-y-3 ${isMobile ? 'px-3 pb-3' : ''}`}>
              {/* Origen */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Punto de Origen</Label>
                <div className="flex gap-2">
                  <div className="flex-1 bg-secondary/50 rounded-lg px-3 py-2 text-xs font-mono truncate min-w-0">
                    {origin ? (
                      <span className="text-green-600 dark:text-green-400">{formatCoord(origin)}</span>
                    ) : (
                      <span className="text-muted-foreground">Sin seleccionar</span>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant={isSelectingOrigin ? "default" : "outline"}
                    onClick={onSelectOriginClick}
                    className="shrink-0 h-9 w-9 p-0"
                    title="Seleccionar en mapa"
                  >
                    <Crosshair className="w-4 h-4" />
                  </Button>
                </div>
                
                {/* Boton de ubicacion actual */}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onUseCurrentLocation}
                  disabled={isLocating}
                  className="w-full flex items-center justify-center gap-2 text-xs h-9"
                >
                  {isLocating ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span className="truncate">Obteniendo ubicacion...</span>
                    </>
                  ) : userLocation ? (
                    <>
                      <LocateFixed className="w-3.5 h-3.5 text-blue-500" />
                      <span className="truncate">Usar mi ubicacion actual</span>
                    </>
                  ) : (
                    <>
                      <LocateFixed className="w-3.5 h-3.5" />
                      <span className="truncate">Usar mi ubicacion</span>
                    </>
                  )}
                </Button>
                
                {/* Error de ubicacion */}
                {locationError && (
                  <div className="flex items-center gap-2 text-xs text-destructive bg-destructive/10 rounded-md p-2">
                    <MapPinOff className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{locationError}</span>
                  </div>
                )}
              </div>

              {/* Flecha */}
              <div className="flex justify-center">
                <ChevronRight className="w-4 h-4 text-muted-foreground rotate-90" />
              </div>

              {/* Destino */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Punto de Destino</Label>
                <div className="flex gap-2">
                  <div className="flex-1 bg-secondary/50 rounded-lg px-3 py-2 text-xs font-mono truncate min-w-0">
                    {destination ? (
                      <span className="text-red-600 dark:text-red-400">{formatCoord(destination)}</span>
                    ) : (
                      <span className="text-muted-foreground">Sin seleccionar</span>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant={isSelectingDestination ? "default" : "outline"}
                    onClick={onSelectDestinationClick}
                    className="shrink-0 h-9 w-9 p-0"
                    title="Seleccionar en mapa"
                  >
                    <Target className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Opciones de ruta */}
          <Card>
            <CardHeader className={`${isMobile ? 'pb-2 pt-3 px-3' : 'pb-3'}`}>
              <CardTitle className="text-sm flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Opciones
              </CardTitle>
            </CardHeader>
            <CardContent className={`space-y-4 ${isMobile ? 'px-3 pb-3' : ''}`}>
              {/* Tipo de transporte */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Modo de Transporte</Label>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    size="sm"
                    variant={routeType === "walking" ? "default" : "outline"}
                    onClick={() => setRouteType("walking")}
                    className={`flex flex-col items-center gap-1 h-auto ${isMobile ? 'py-3' : 'py-2'}`}
                  >
                    <Footprints className="w-4 h-4" />
                    <span className="text-[10px]">A pie</span>
                  </Button>
                  <Button
                    size="sm"
                    variant={routeType === "cycling" ? "default" : "outline"}
                    onClick={() => setRouteType("cycling")}
                    className={`flex flex-col items-center gap-1 h-auto ${isMobile ? 'py-3' : 'py-2'}`}
                  >
                    <Bike className="w-4 h-4" />
                    <span className="text-[10px]">Bicicleta</span>
                  </Button>
                  <Button
                    size="sm"
                    variant={routeType === "driving" ? "default" : "outline"}
                    onClick={() => setRouteType("driving")}
                    className={`flex flex-col items-center gap-1 h-auto ${isMobile ? 'py-3' : 'py-2'}`}
                  >
                    <Car className="w-4 h-4" />
                    <span className="text-[10px]">Auto</span>
                  </Button>
                </div>
              </div>

              {/* Switches en grid para movil */}
              <div className={isMobile ? 'grid grid-cols-2 gap-3' : 'space-y-3'}>
                {/* Priorizar seguridad */}
                <div className={`flex items-center ${isMobile ? 'justify-between bg-secondary/30 rounded-lg p-3' : 'justify-between'}`}>
                  <Label htmlFor="prioritize-safety" className={`${isMobile ? 'text-xs' : 'text-sm'}`}>
                    {isMobile ? 'Priorizar\nSeguridad' : 'Priorizar Seguridad'}
                  </Label>
                  <Switch
                    id="prioritize-safety"
                    checked={prioritizeSafety}
                    onCheckedChange={setPrioritizeSafety}
                  />
                </div>

                {/* Evitar alto riesgo */}
                <div className={`flex items-center ${isMobile ? 'justify-between bg-secondary/30 rounded-lg p-3' : 'justify-between'}`}>
                  <Label htmlFor="avoid-risk" className={`${isMobile ? 'text-xs' : 'text-sm'}`}>
                    {isMobile ? 'Evitar Alto\nRiesgo' : 'Evitar Zonas de Alto Riesgo'}
                  </Label>
                  <Switch
                    id="avoid-risk"
                    checked={avoidHighRisk}
                    onCheckedChange={setAvoidHighRisk}
                  />
                </div>
              </div>

              {/* Balance seguridad/distancia - Slider mejorado */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Balance de Ruta</Label>
                  <Badge variant="secondary" className="text-[10px] font-mono">
                    {getBalanceDescription(safetyWeight)}
                  </Badge>
                </div>
                
                {/* Slider visual mejorado */}
                <div className="space-y-2">
                  <div className="relative pt-1">
                    <Slider
                      value={[safetyWeight]}
                      onValueChange={handleSliderChange}
                      min={0}
                      max={100}
                      step={5}
                      className="w-full"
                    />
                  </div>
                  
                  {/* Barra de progreso visual */}
                  <div className="flex gap-0.5 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-blue-500 transition-all duration-200"
                      style={{ width: `${100 - safetyWeight}%` }}
                    />
                    <div 
                      className="bg-green-500 transition-all duration-200"
                      style={{ width: `${safetyWeight}%` }}
                    />
                  </div>
                  
                  {/* Indicadores visuales debajo del slider */}
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Ruler className="w-3 h-3 text-blue-500" />
                      <span>Distancia</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Shield className="w-3 h-3 text-green-500" />
                      <span>Seguridad</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Visualizacion - Compacto */}
          <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
            <div className="flex items-center gap-2">
              {showHeatmap ? <Eye className="w-4 h-4 text-muted-foreground" /> : <EyeOff className="w-4 h-4 text-muted-foreground" />}
              <Label htmlFor="show-heatmap" className="text-sm">
                Mapa de Calor
              </Label>
            </div>
            <Switch
              id="show-heatmap"
              checked={showHeatmap}
              onCheckedChange={onToggleHeatmap}
            />
          </div>

          {/* Botones de accion */}
          <div className="space-y-2">
            <Button
              onClick={handleCalculateRoute}
              disabled={!canCalculate}
              className={`w-full ${isMobile ? 'h-12 text-base' : ''}`}
              size={isMobile ? "lg" : "default"}
            >
              {isCalculating ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Calculando...
                </>
              ) : (
                <>
                  <Navigation className="w-4 h-4 mr-2" />
                  Calcular Ruta Segura
                </>
              )}
            </Button>
            
            {route && (
              <Button
                variant="outline"
                onClick={onClearRoute}
                className="w-full"
                size={isMobile ? "lg" : "default"}
              >
                Limpiar Ruta
              </Button>
            )}
          </div>

          {/* Resultado de la ruta */}
          {route && (
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader className={`${isMobile ? 'pb-2 pt-3 px-3' : 'pb-3'}`}>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Zap className="w-4 h-4 text-primary" />
                  Ruta Calculada
                  {route.isRealRoute && (
                    <Badge variant="outline" className="ml-auto text-[10px] flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Real
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className={`space-y-3 ${isMobile ? 'px-3 pb-3' : ''}`}>
                {/* Metricas principales */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-card rounded-lg p-3 text-center">
                    <Ruler className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                    <p className={`font-semibold ${isMobile ? 'text-lg' : 'text-base'}`}>{formatDistance(route.distance)}</p>
                    <p className="text-[10px] text-muted-foreground">Distancia</p>
                  </div>
                  <div className="bg-card rounded-lg p-3 text-center">
                    <Clock className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
                    <p className={`font-semibold ${isMobile ? 'text-lg' : 'text-base'}`}>{formatTime(route.estimatedTime)}</p>
                    <p className="text-[10px] text-muted-foreground">Tiempo</p>
                  </div>
                </div>

                <Separator />

                {/* Nivel de seguridad */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Seguridad</span>
                    <Badge className={`${getSafetyLevel(route.safetyScore).color} text-white`}>
                      {getSafetyLevel(route.safetyScore).label}
                    </Badge>
                  </div>
                  
                  {/* Barra de seguridad */}
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${getSafetyLevel(route.safetyScore).color}`}
                      style={{ width: `${route.safetyScore}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground text-center">
                    {route.safetyScore}/100 puntos
                  </p>
                </div>

                {/* Modo de transporte y puntos de riesgo - Compacto */}
                <div className="flex gap-2">
                  <div className="flex-1 flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                    {route.routeType === "walking" && <Footprints className="w-4 h-4 text-primary shrink-0" />}
                    {route.routeType === "cycling" && <Bike className="w-4 h-4 text-primary shrink-0" />}
                    {route.routeType === "driving" && <Car className="w-4 h-4 text-primary shrink-0" />}
                    <span className="text-xs truncate">
                      {route.routeType === "walking" ? "A pie" : 
                       route.routeType === "cycling" ? "Bicicleta" : "Auto"}
                    </span>
                  </div>
                  {route.riskPoints > 0 && (
                    <div className="flex-1 flex items-center gap-2 p-2 bg-yellow-500/10 rounded-lg">
                      <AlertTriangle className="w-4 h-4 text-yellow-600 shrink-0" />
                      <span className="text-xs truncate">
                        {route.riskPoints} evitadas
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Footer - solo en desktop */}
      {!isMobile && (
        <div className="p-3 border-t border-border bg-muted/30 shrink-0">
          <p className="text-[10px] text-muted-foreground text-center">
            Rutas basadas en reportes ciudadanos
          </p>
        </div>
      )}
    </div>
  )
}
