"use client"

import dynamic from "next/dynamic"
import { Navbar } from "@/components/layout/navbar"

const SafeZonesMap = dynamic(
  () => import("@/components/map/safe-zones-map").then((m) => m.SafeZonesMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center w-full h-full bg-background">
        <span className="font-mono text-muted-foreground text-sm animate-pulse">
          Cargando mapa de zonas seguras…
        </span>
      </div>
    ),
  }
)

export default function ZonasSeguras() {
  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      <Navbar backToHome />

      <main className="flex-1 pt-[65px]" aria-label="Mapa de zonas seguras de Durango">
        <div className="w-full h-full">
          <SafeZonesMap />
        </div>
      </main>
    </div>
  )
}
