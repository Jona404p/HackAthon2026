"use client"

import dynamic from "next/dynamic"
import { Navbar } from "@/components/layout/navbar"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Info, X } from "lucide-react"

const PostalCodesMap = dynamic(
  () => import("@/components/map/postal-codes-map").then((m) => m.PostalCodesMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center w-full h-full bg-background">
        <span className="font-mono text-muted-foreground text-sm animate-pulse">
          Cargando mapa de seguridad...
        </span>
      </div>
    ),
  }
)

export default function ZonasSeguras() {
  const [showLegend, setShowLegend] = useState(false)

  return (
    <div className="flex flex-col h-[100dvh] bg-background overflow-hidden">
      <Navbar />

      <main className="flex-1 pt-[60px] sm:pt-[65px] relative" aria-label="Mapa de seguridad de Durango">
        <div className="w-full h-full">
          <PostalCodesMap hideLegendOnMobile />
        </div>

        {/* Mobile FAB para mostrar leyenda */}
        <div className="lg:hidden absolute bottom-4 right-4 z-[999]">
          <Sheet open={showLegend} onOpenChange={setShowLegend}>
            <SheetTrigger asChild>
              <Button 
                size="lg" 
                variant="secondary"
                className="rounded-full w-14 h-14 shadow-lg"
              >
                <Info className="w-6 h-6" />
                <span className="sr-only">Ver leyenda del mapa</span>
              </Button>
            </SheetTrigger>
            <SheetContent 
              side="bottom" 
              className="h-auto max-h-[70vh] p-0 rounded-t-3xl"
            >
              <div className="overflow-auto">
                {/* Handle bar */}
                <div className="flex justify-center py-3 sticky top-0 bg-background">
                  <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
                </div>
                
                {/* Legend content - duplicated from PostalCodesMap for mobile */}
                <div className="p-4 pt-0">
                  <MobileLegend onClose={() => setShowLegend(false)} />
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </main>
    </div>
  )
}

// Componente de leyenda para movil
function MobileLegend({ onClose }: { onClose: () => void }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-destructive/15 flex items-center justify-center">
            <Info className="w-5 h-5 text-destructive" />
          </div>
          <div>
            <h3 className="font-semibold text-base text-foreground">Mapa de Riesgo</h3>
            <p className="text-xs text-muted-foreground">Basado en reportes ciudadanos</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Categorias */}
      <div className="space-y-3">
        <p className="text-sm font-medium text-foreground">Tipos de Incidentes</p>
        <div className="grid gap-2">
          <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg">
            <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center">
              <span className="text-orange-500 text-sm">!</span>
            </div>
            <div>
              <p className="text-sm font-medium">Robos / Asaltos</p>
              <p className="text-xs text-muted-foreground">Mayor peso en el mapa de calor</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg">
            <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center">
              <span className="text-red-500 text-sm">*</span>
            </div>
            <div>
              <p className="text-sm font-medium">Incendios</p>
              <p className="text-xs text-muted-foreground">Peso medio en el calculo</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg">
            <div className="w-8 h-8 rounded-lg bg-red-600/20 flex items-center justify-center">
              <span className="text-red-600 text-sm">~</span>
            </div>
            <div>
              <p className="text-sm font-medium">Accidentes</p>
              <p className="text-xs text-muted-foreground">Peso menor en el calculo</p>
            </div>
          </div>
        </div>
      </div>

      {/* Gradiente */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-foreground">Intensidad de Riesgo</p>
        <div className="h-3 rounded-full overflow-hidden" style={{
          background: "linear-gradient(to right, #22c55e, #eab308, #f97316, #ef4444, #dc2626)"
        }} />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Bajo</span>
          <span>Moderado</span>
          <span>Alto</span>
        </div>
      </div>

      {/* Info adicional */}
      <div className="p-3 bg-muted/50 rounded-lg">
        <p className="text-xs text-muted-foreground leading-relaxed">
          El mapa de calor se genera automaticamente basado en la ubicacion y 
          frecuencia de reportes. Las zonas mas rojas indican mayor concentracion 
          de incidentes recientes.
        </p>
      </div>
    </div>
  )
}
