export interface TransitRoute {
  name: string
  color: string
  points: { lat: number; lng: number }[]
}

export const DURANGO_ROUTES: TransitRoute[] = [
  {
    name: "Ruta Azul (Gabino Santillán - Centro)",
    color: "#3B82F6", // Blue-500 for better visibility on dark map
    points: [
      { lat: 23.9782, lng: -104.6465 },
      { lat: 24.0085, lng: -104.6612 },
      { lat: 24.0234, lng: -104.6658 },
      { lat: 24.0275, lng: -104.6710 },
      { lat: 24.0410, lng: -104.6520 },
    ],
  },
  {
    name: "Ruta Verde (Primo de Verdad - Centro)",
    color: "#22C55E", // Green-500
    points: [
      { lat: 23.9890, lng: -104.6780 },
      { lat: 24.0150, lng: -104.6700 },
      { lat: 24.0255, lng: -104.6685 },
      { lat: 24.0320, lng: -104.6600 },
      { lat: 24.0450, lng: -104.6400 },
    ],
  },
  {
    name: "Ruta Naranja (San Mateo - Villas)",
    color: "#F97316", // Orange-500
    points: [
      { lat: 24.0610, lng: -104.6320 },
      { lat: 24.0480, lng: -104.6450 },
      { lat: 24.0325, lng: -104.6580 },
      { lat: 24.0260, lng: -104.6715 },
      { lat: 24.0180, lng: -104.6850 },
    ],
  },
  {
    name: "Ruta Amarilla (Canoas - 20 de Noviembre)",
    color: "#FACC15", // Yellow-400
    points: [
      { lat: 24.0210, lng: -104.7000 },
      { lat: 24.0280, lng: -104.6800 },
      { lat: 24.0270, lng: -104.6650 },
      { lat: 24.0350, lng: -104.6350 },
      { lat: 24.0400, lng: -104.6200 },
    ],
  },
  {
    name: "Ruta Dorada (Canelas - Real Victoria)",
    color: "#D4AF37", // Metallic Gold
    points: [
      { lat: 24.0120, lng: -104.6950 },
      { lat: 24.0220, lng: -104.6750 },
      { lat: 24.0270, lng: -104.6680 },
      { lat: 24.0300, lng: -104.6550 },
      { lat: 24.0550, lng: -104.6300 },
    ],
  },
]
