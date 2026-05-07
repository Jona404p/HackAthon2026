"use client"

import dynamic from "next/dynamic"
import { useState } from "react"
import { Navbar } from "@/components/layout/navbar"
import { MapPin, Shield } from "lucide-react"
import { cn } from "@/lib/utils"

const PostalCodesMap = dynamic(
  () => import("@/components/map/postal-codes-map").then((m) => m.PostalCodesMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center w-full h-full bg-background">
        <span className="font-mono text-muted-foreground text-sm animate-pulse">
          Cargando mapa de códigos postales…
        </span>
      </div>
    ),
  }
)

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

type MapTab = "codigos" | "zonas"

export default function ZonasSeguras() {
  const [activeTab, setActiveTab] = useState<MapTab>("codigos")

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      <Navbar />

      {/* Sub-tabs */}
      <div className="fixed top-[65px] left-0 right-0 z-40 flex items-center gap-1 px-4 py-2 bg-background/90 backdrop-blur-md border-b border-border">
        <button
          onClick={() => setActiveTab("codigos")}
          className={cn(
            "flex items-center gap-1.5 text-xs px-3 py-1.5 rounded font-mono font-medium transition-all",
            activeTab === "codigos"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary"
          )}
        >
          <MapPin className="w-3.5 h-3.5" aria-hidden="true" />
          Códigos Postales
        </button>
        <button
          onClick={() => setActiveTab("zonas")}
          className={cn(
            "flex items-center gap-1.5 text-xs px-3 py-1.5 rounded font-mono font-medium transition-all",
            activeTab === "zonas"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary"
          )}
        >
          <Shield className="w-3.5 h-3.5" aria-hidden="true" />
          Zonas de Servicio
        </button>
      </div>

      <main className="flex-1 pt-[105px]" aria-label="Mapa de seguridad de Durango">
        <div className="w-full h-full">
          {activeTab === "codigos" ? <PostalCodesMap /> : <SafeZonesMap />}
        </div>
      </main>
    </div>
  )
}
