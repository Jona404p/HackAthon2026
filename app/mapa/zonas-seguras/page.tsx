"use client"

import dynamic from "next/dynamic"
import { Navbar } from "@/components/layout/navbar"
import { CollapsibleLegend } from "@/components/map/collapsible-legend"
import { useState } from "react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Info } from "lucide-react"
import { useIsMobile } from "@/hooks/use-mobile"

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

const legendItems = [
  {
    color: "#22c55e",
    label: "Muy Seguro",
    description: "Bajo riesgo, bajo índice de incidentes",
  },
  {
    color: "#84cc16",
    label: "Seguro",
    description: "Riesgo bajo-medio, pocos incidentes",
  },
  {
    color: "#eab308",
    label: "Moderado",
    description: "Riesgo medio, incidentes ocasionales",
  },
  {
    color: "#f97316",
    label: "Precaución",
    description: "Riesgo medio-alto, varios incidentes",
  },
  {
    color: "#ef4444",
    label: "Alto Riesgo",
    description: "Riesgo significativo, evitar si es posible",
  },
  {
    color: "#dc2626",
    label: "Crítico",
    description: "Riesgo muy alto, máxima precaución",
  },
]

export default function ZonasSeguras() {
  const [showLegend, setShowLegend] = useState(false)
  const isMobile = useIsMobile()

  return (
    <div className="flex flex-col h-[100dvh] bg-background overflow-hidden">
      <Navbar />

      <main className="flex-1 relative" aria-label="Mapa de seguridad de Durango">
        <div className="w-full h-full">
          <PostalCodesMap hideLegendOnMobile />
        </div>

        {/* Leyenda Colapsable - Desktop */}
        {!isMobile && (
          <CollapsibleLegend
            items={legendItems}
            title="Mapa de Riesgo"
            icon="🗺️"
            mobile={false}
          />
        )}

        {/* Mobile Legend FAB */}
        {isMobile && (
          <div className="absolute bottom-20 right-4 z-40">
            <Sheet open={showLegend} onOpenChange={setShowLegend}>
              <SheetTrigger asChild>
                <Button
                  size="lg"
                  className="rounded-full w-14 h-14 shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40"
                  title="Ver leyenda del mapa"
                >
                  <Info className="w-6 h-6" />
                  <span className="sr-only">Ver leyenda del mapa</span>
                </Button>
              </SheetTrigger>
              <SheetContent
                side="bottom"
                className="h-[85dvh] p-0 rounded-t-3xl border-t border-border/50 flex flex-col overflow-y-auto"
              >
                <CollapsibleLegend
                  items={legendItems}
                  title="Mapa de Riesgo"
                  icon="🗺️"
                  mobile={true}
                  onClose={() => setShowLegend(false)}
                />
              </SheetContent>
            </Sheet>
          </div>
        )}
      </main>
    </div>
  )
}
