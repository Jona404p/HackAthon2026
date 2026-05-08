/**
 * SafeRoute Durango — Safe Routing Algorithm
 * 
 * Este modulo implementa un algoritmo de enrutamiento que:
 * 1. Obtiene rutas reales usando OSRM (Open Source Routing Machine)
 * 2. Evalua la seguridad de cada ruta basada en reportes
 * 3. Solicita rutas alternativas y elige la mas segura
 */

import { DURANGO_CENTER } from "./types"

// Categorias que contribuyen al riesgo
const RISK_CATEGORIES = ["robo", "incendio", "accidente"]

// Pesos de riesgo por categoria
const CATEGORY_WEIGHTS: Record<string, number> = {
  robo: 1.0,
  incendio: 0.8,
  accidente: 0.6,
}

// URL de OSRM (servicio publico gratuito)
const OSRM_API_URL = "https://router.project-osrm.org/route/v1"

export interface Coordinate {
  lat: number
  lng: number
}

export interface Report {
  id: string
  latitude: number
  longitude: number
  category: string
  created_at: string
}

export interface RouteResult {
  path: Coordinate[]
  distance: number // en metros
  estimatedTime: number // en minutos
  safetyScore: number // 0-100
  riskPoints: number // puntos de riesgo en la ruta
  isRealRoute: boolean // indica si la ruta sigue calles reales
  routeType: "walking" | "driving" | "cycling"
}

export interface RoutingOptions {
  prioritizeSafety: boolean
  safetyWeight: number // 0-1
  avoidHighRisk: boolean
  routeType?: "walking" | "driving" | "cycling"
}

interface OSRMRoute {
  geometry: {
    coordinates: [number, number][]
    type: string
  }
  legs: {
    distance: number
    duration: number
    steps: {
      distance: number
      duration: number
      geometry: {
        coordinates: [number, number][]
      }
      maneuver: {
        location: [number, number]
        type: string
        modifier?: string
        instruction?: string
      }
      name: string
    }[]
  }[]
  distance: number
  duration: number
  weight: number
  weight_name: string
}

interface OSRMResponse {
  code: string
  routes: OSRMRoute[]
  waypoints: {
    location: [number, number]
    name: string
    hint: string
  }[]
}

/**
 * Calcula la distancia Haversine entre dos puntos
 */
export function haversineDistance(p1: Coordinate, p2: Coordinate): number {
  const R = 6371000 // Radio de la Tierra en metros
  const dLat = toRad(p2.lat - p1.lat)
  const dLng = toRad(p2.lng - p1.lng)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(p1.lat)) * Math.cos(toRad(p2.lat)) * Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180)
}

/**
 * Calcula el nivel de riesgo en un punto dado basado en reportes cercanos
 */
export function calculateRiskAtPoint(point: Coordinate, reports: Report[], radius: number = 150): number {
  const riskReports = reports.filter((r) => RISK_CATEGORIES.includes(r.category))
  
  let totalRisk = 0
  
  for (const report of riskReports) {
    const distance = haversineDistance(point, { lat: report.latitude, lng: report.longitude })
    
    if (distance <= radius) {
      const weight = CATEGORY_WEIGHTS[report.category] || 0.5
      
      // Decaimiento temporal
      const reportDate = new Date(report.created_at)
      const now = new Date()
      const daysSinceReport = Math.max(1, (now.getTime() - reportDate.getTime()) / (1000 * 60 * 60 * 24))
      const timeDecay = Math.max(0.3, 1 - daysSinceReport / 60)
      
      // Decaimiento por distancia (mas lejos = menos riesgo)
      const distanceDecay = 1 - distance / radius
      
      totalRisk += weight * timeDecay * distanceDecay
    }
  }
  
  return Math.min(1, totalRisk)
}

/**
 * Evalua el riesgo total de una ruta
 */
function evaluateRouteRisk(path: Coordinate[], reports: Report[]): { avgRisk: number; maxRisk: number; riskPoints: number } {
  if (path.length === 0) return { avgRisk: 0, maxRisk: 0, riskPoints: 0 }
  
  let totalRisk = 0
  let maxRisk = 0
  let riskPoints = 0
  
  // Evaluar puntos a lo largo de la ruta
  const samplePoints = Math.min(path.length, 50)
  const step = Math.max(1, Math.floor(path.length / samplePoints))
  
  for (let i = 0; i < path.length; i += step) {
    const risk = calculateRiskAtPoint(path[i], reports)
    totalRisk += risk
    maxRisk = Math.max(maxRisk, risk)
    if (risk > 0.4) riskPoints++
  }
  
  const sampledCount = Math.ceil(path.length / step)
  return {
    avgRisk: totalRisk / sampledCount,
    maxRisk,
    riskPoints,
  }
}

/**
 * Obtiene ruta(s) de OSRM
 */
async function fetchOSRMRoute(
  origin: Coordinate,
  destination: Coordinate,
  profile: "foot" | "car" | "bike" = "foot",
  alternatives: boolean = true
): Promise<OSRMRoute[]> {
  // OSRM usa formato lng,lat
  const coordinates = `${origin.lng},${origin.lat};${destination.lng},${destination.lat}`
  
  const params = new URLSearchParams({
    overview: "full",
    geometries: "geojson",
    alternatives: alternatives ? "true" : "false",
    steps: "true",
  })
  
  const url = `${OSRM_API_URL}/${profile}/${coordinates}?${params}`
  
  try {
    const response = await fetch(url)
    
    if (!response.ok) {
      throw new Error(`OSRM API error: ${response.status}`)
    }
    
    const data: OSRMResponse = await response.json()
    
    if (data.code !== "Ok" || !data.routes || data.routes.length === 0) {
      throw new Error("No route found")
    }
    
    return data.routes
  } catch (error) {
    console.error("OSRM fetch error:", error)
    throw error
  }
}

/**
 * Convierte una ruta OSRM a nuestro formato
 */
function convertOSRMRoute(osrmRoute: OSRMRoute): Coordinate[] {
  // OSRM devuelve [lng, lat], necesitamos {lat, lng}
  return osrmRoute.geometry.coordinates.map(([lng, lat]) => ({ lat, lng }))
}

/**
 * Simplifica una ruta manteniendo los puntos importantes
 */
function simplifyRoute(path: Coordinate[], tolerance: number = 0.00005): Coordinate[] {
  if (path.length <= 2) return path
  
  // Algoritmo Douglas-Peucker simplificado
  const result: Coordinate[] = [path[0]]
  
  let lastAdded = 0
  for (let i = 1; i < path.length - 1; i++) {
    const dist = perpendicularDistance(path[i], path[lastAdded], path[path.length - 1])
    if (dist > tolerance) {
      result.push(path[i])
      lastAdded = i
    }
  }
  
  result.push(path[path.length - 1])
  return result
}

function perpendicularDistance(point: Coordinate, lineStart: Coordinate, lineEnd: Coordinate): number {
  const dx = lineEnd.lng - lineStart.lng
  const dy = lineEnd.lat - lineStart.lat
  
  const magnitude = Math.sqrt(dx * dx + dy * dy)
  if (magnitude === 0) return haversineDistance(point, lineStart)
  
  const u = ((point.lng - lineStart.lng) * dx + (point.lat - lineStart.lat) * dy) / (magnitude * magnitude)
  
  const closestPoint: Coordinate = {
    lng: lineStart.lng + u * dx,
    lat: lineStart.lat + u * dy,
  }
  
  return Math.abs((point.lat - closestPoint.lat) + (point.lng - closestPoint.lng))
}

/**
 * Funcion principal: encuentra la ruta mas segura
 */
export async function findSafeRoute(
  origin: Coordinate,
  destination: Coordinate,
  reports: Report[],
  options: RoutingOptions = { prioritizeSafety: true, safetyWeight: 0.6, avoidHighRisk: true, routeType: "walking" }
): Promise<RouteResult> {
  // Determinar perfil OSRM
  const profileMap: Record<string, "foot" | "car" | "bike"> = {
    walking: "foot",
    driving: "car",
    cycling: "bike",
  }
  const profile = profileMap[options.routeType || "walking"]
  
  try {
    // Obtener rutas de OSRM (incluyendo alternativas)
    const osrmRoutes = await fetchOSRMRoute(origin, destination, profile, options.prioritizeSafety)
    
    // Convertir y evaluar cada ruta
    const evaluatedRoutes: {
      path: Coordinate[]
      distance: number
      duration: number
      risk: { avgRisk: number; maxRisk: number; riskPoints: number }
      score: number
    }[] = []
    
    for (const osrmRoute of osrmRoutes) {
      const path = convertOSRMRoute(osrmRoute)
      const risk = evaluateRouteRisk(path, reports)
      
      // Calcular score combinado (mayor es mejor)
      const safetyScore = 1 - risk.avgRisk
      const distanceScore = 1 / (1 + osrmRoute.distance / 1000) // Normalizar distancia
      const score = options.safetyWeight * safetyScore + (1 - options.safetyWeight) * distanceScore
      
      evaluatedRoutes.push({
        path,
        distance: osrmRoute.distance,
        duration: osrmRoute.duration,
        risk,
        score,
      })
    }
    
    // Ordenar por score (mejor primero)
    evaluatedRoutes.sort((a, b) => b.score - a.score)
    
    // Seleccionar la mejor ruta
    let selectedRoute = evaluatedRoutes[0]
    
    // Si se debe evitar alto riesgo, buscar una alternativa si la mejor tiene riesgo alto
    if (options.avoidHighRisk && selectedRoute.risk.maxRisk > 0.7 && evaluatedRoutes.length > 1) {
      const saferRoute = evaluatedRoutes.find(r => r.risk.maxRisk <= 0.7)
      if (saferRoute) {
        selectedRoute = saferRoute
      }
    }
    
    // Simplificar la ruta para mejor rendimiento
    const simplifiedPath = simplifyRoute(selectedRoute.path)
    
    return {
      path: simplifiedPath,
      distance: selectedRoute.distance,
      estimatedTime: selectedRoute.duration / 60, // Convertir a minutos
      safetyScore: Math.round((1 - selectedRoute.risk.avgRisk) * 100),
      riskPoints: selectedRoute.risk.riskPoints,
      isRealRoute: true,
      routeType: options.routeType || "walking",
    }
  } catch (error) {
    console.error("Error getting OSRM route, falling back to direct route:", error)
    // Fallback a ruta directa si OSRM falla
    return fallbackDirectRoute(origin, destination, reports, options)
  }
}

/**
 * Version sincronica para compatibilidad
 */
export function findSafeRouteSync(
  origin: Coordinate,
  destination: Coordinate,
  reports: Report[],
  options: RoutingOptions = { prioritizeSafety: true, safetyWeight: 0.6, avoidHighRisk: true }
): RouteResult {
  return fallbackDirectRoute(origin, destination, reports, options)
}

/**
 * Ruta directa como fallback
 */
function fallbackDirectRoute(
  origin: Coordinate,
  destination: Coordinate,
  reports: Report[],
  options: RoutingOptions
): RouteResult {
  const directDistance = haversineDistance(origin, destination)
  
  // Generar waypoints intermedios
  const numWaypoints = Math.min(20, Math.ceil(directDistance / 50))
  const path: Coordinate[] = []
  
  for (let i = 0; i <= numWaypoints; i++) {
    const t = i / numWaypoints
    path.push({
      lat: origin.lat + t * (destination.lat - origin.lat),
      lng: origin.lng + t * (destination.lng - origin.lng),
    })
  }
  
  const risk = evaluateRouteRisk(path, reports)
  
  // Velocidad promedio segun tipo de ruta
  const speeds: Record<string, number> = {
    walking: 5, // km/h
    cycling: 15,
    driving: 30,
  }
  const speed = speeds[options.routeType || "walking"]
  
  return {
    path,
    distance: directDistance,
    estimatedTime: (directDistance / 1000 / speed) * 60, // minutos
    safetyScore: Math.round((1 - risk.avgRisk) * 100),
    riskPoints: risk.riskPoints,
    isRealRoute: false,
    routeType: options.routeType || "walking",
  }
}

/**
 * Formatea la distancia para mostrar
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`
  }
  return `${(meters / 1000).toFixed(1)} km`
}

/**
 * Formatea el tiempo para mostrar
 */
export function formatTime(minutes: number): string {
  if (minutes < 1) {
    return "< 1 min"
  }
  if (minutes < 60) {
    return `${Math.round(minutes)} min`
  }
  const hours = Math.floor(minutes / 60)
  const mins = Math.round(minutes % 60)
  return `${hours}h ${mins}m`
}

/**
 * Calcula el bounding box para Durango
 */
export function getDurangoBounds() {
  return {
    north: DURANGO_CENTER[0] + 0.08,
    south: DURANGO_CENTER[0] - 0.08,
    east: DURANGO_CENTER[1] + 0.1,
    west: DURANGO_CENTER[1] - 0.1,
  }
}
