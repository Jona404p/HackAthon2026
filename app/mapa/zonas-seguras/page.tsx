"use client"

import dynamic from "next/dynamic"
import { Navbar } from "@/components/layout/navbar"

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
  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      <Navbar />

      <main className="flex-1 pt-[65px]" aria-label="Mapa de seguridad de Durango">
        <div className="w-full h-full">
          <PostalCodesMap />
        </div>
      </main>
    </div>
  )
}
