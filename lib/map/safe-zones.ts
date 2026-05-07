export interface SafeZone {
  id: string
  name: string
  type: "hospital" | "police" | "fire" | "school" | "park" | "commercial"
  center: { lat: number; lng: number }
  radius: number // meters
}

export const SAFE_ZONES: SafeZone[] = [
  {
    id: "hospital-general",
    name: "Hospital General de Durango",
    type: "hospital",
    center: { lat: 24.0195, lng: -104.6670 },
    radius: 300,
  },
  {
    id: "hospital-450",
    name: "Hospital 450",
    type: "hospital",
    center: { lat: 24.0320, lng: -104.6480 },
    radius: 350,
  },
  {
    id: "plaza-armas",
    name: "Plaza de Armas",
    type: "commercial",
    center: { lat: 24.0228, lng: -104.6597 },
    radius: 200,
  },
  {
    id: "policia-centro",
    name: "Seguridad Publica Municipal",
    type: "police",
    center: { lat: 24.0250, lng: -104.6550 },
    radius: 400,
  },
  {
    id: "bomberos-central",
    name: "Estacion de Bomberos Central",
    type: "fire",
    center: { lat: 24.0180, lng: -104.6620 },
    radius: 350,
  },
  {
    id: "parque-guadiana",
    name: "Parque Guadiana",
    type: "park",
    center: { lat: 24.0350, lng: -104.6750 },
    radius: 450,
  },
  {
    id: "ujed",
    name: "Universidad Juarez del Estado de Durango",
    type: "school",
    center: { lat: 24.0280, lng: -104.6800 },
    radius: 400,
  },
  {
    id: "itd",
    name: "Instituto Tecnologico de Durango",
    type: "school",
    center: { lat: 24.0420, lng: -104.6350 },
    radius: 350,
  },
  {
    id: "paseo-durango",
    name: "Paseo Durango (Centro Comercial)",
    type: "commercial",
    center: { lat: 24.0450, lng: -104.6400 },
    radius: 300,
  },
]

export const ZONE_TYPE_COLORS: Record<SafeZone["type"], string> = {
  hospital: "#EF4444", // Red
  police: "#3B82F6",   // Blue
  fire: "#F97316",     // Orange
  school: "#A855F7",   // Purple
  park: "#22C55E",     // Green
  commercial: "#FACC15", // Yellow
}

export const ZONE_TYPE_LABELS: Record<SafeZone["type"], string> = {
  hospital: "Hospital",
  police: "Policia",
  fire: "Bomberos",
  school: "Escuela",
  park: "Parque",
  commercial: "Comercial",
}
