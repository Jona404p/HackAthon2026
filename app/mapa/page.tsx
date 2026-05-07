"use client"

import dynamic from "next/dynamic"
import { Navbar } from "@/components/layout/navbar"

// Leaflet requires the browser — disable SSR for the map component
const InteractiveMap = dynamic(
  () => import("@/components/map/interactive-map").then((m) => m.InteractiveMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center w-full h-full bg-background">
        <span className="font-mono text-muted-foreground text-sm animate-pulse">
          Cargando mapa…
        </span>
      </div>
    ),
  }
)

export default function MapaPage() {
  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      <Navbar backToHome />

      {/* Map fills the remaining height below the navbar */}
      <main className="flex-1 pt-[65px]" aria-label="Mapa interactivo de Durango">
        <div className="w-full h-full">
          <InteractiveMap />
        </div>
      </main>
    </div>
  )
}
