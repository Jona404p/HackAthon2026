"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronUp, Clock, MapPin, AlertCircle, Navigation, ChevronDown } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"

interface RouteResultCardProps {
  destination: string
  duration: string
  distance: string
  safetyLevel: "high" | "medium" | "low"
  estimatedTime?: string
  onNavigate?: () => void
  onClose?: () => void
  isExpanded?: boolean
  onToggleExpand?: () => void
}

const safetyConfig = {
  high: { label: "Muy seguro", bg: "bg-emerald-500/10", text: "text-emerald-600 dark:text-emerald-400", icon: "🛡️" },
  medium: { label: "Moderadamente seguro", bg: "bg-amber-500/10", text: "text-amber-600 dark:text-amber-400", icon: "⚠️" },
  low: { label: "Requiere precaución", bg: "bg-destructive/10", text: "text-destructive", icon: "🚨" },
}

export function RouteResultCard({
  destination,
  duration,
  distance,
  safetyLevel,
  estimatedTime,
  onNavigate,
  onClose,
  isExpanded = false,
  onToggleExpand,
}: RouteResultCardProps) {
  const safety = safetyConfig[safetyLevel]

  return (
    <div className="fixed bottom-0 left-0 right-0 md:relative z-30 md:z-auto p-4 md:p-0">
      <Card className={cn(
        "overflow-hidden shadow-xl md:shadow-none md:border-none md:bg-transparent transition-all duration-300",
        isExpanded && "md:h-auto"
      )}>
        <div className="bg-gradient-to-br from-primary/5 to-background p-4 md:p-6 space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-muted-foreground mb-1">Destino</h3>
              <p className="text-base md:text-lg font-bold text-foreground truncate">
                {destination}
              </p>
            </div>
            <button
              onClick={onClose}
              className="md:hidden text-muted-foreground hover:text-foreground transition-colors shrink-0"
              aria-label="Cerrar resultado de ruta"
            >
              <ChevronDown className="w-5 h-5" />
            </button>
          </div>

          {/* Key metrics */}
          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col items-center p-2 rounded-lg bg-background/50 border border-border/40">
              <Clock className="w-4 h-4 text-primary mb-1.5" />
              <span className="text-xs font-semibold text-foreground">{duration}</span>
              <span className="text-[10px] text-muted-foreground">Tiempo</span>
            </div>
            <div className="flex flex-col items-center p-2 rounded-lg bg-background/50 border border-border/40">
              <MapPin className="w-4 h-4 text-primary mb-1.5" />
              <span className="text-xs font-semibold text-foreground">{distance}</span>
              <span className="text-[10px] text-muted-foreground">Distancia</span>
            </div>
            <div className={cn(
              "flex flex-col items-center p-2 rounded-lg border",
              safety.bg,
              "border-border/40"
            )}>
              <span className="text-base mb-0.5">{safety.icon}</span>
              <span className={cn("text-xs font-semibold", safety.text)}>
                {safetyLevel === "high" ? "Segura" : safetyLevel === "medium" ? "Media" : "Baja"}
              </span>
            </div>
          </div>

          {/* Safety info */}
          {safetyLevel !== "high" && (
            <div className={cn(
              "flex items-start gap-2.5 p-3 rounded-lg",
              safety.bg
            )}>
              <AlertCircle className={cn("w-4 h-4 shrink-0 mt-0.5", safety.text)} />
              <p className={cn("text-xs leading-relaxed", safety.text)}>
                {safetyLevel === "low"
                  ? "Esta ruta pasa por zonas que requieren precaución. Considera evitar viajes en horas nocturnas."
                  : "Evita desviarte de la ruta recomendada. Mantente atento a tu alrededor."}
              </p>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2.5 pt-2">
            <Button
              onClick={onNavigate}
              className="flex-1 rounded-lg"
              size="sm"
            >
              <Navigation className="w-4 h-4 mr-2" />
              Iniciar navegación
            </Button>
            <button
              onClick={onToggleExpand}
              className="hidden md:flex items-center justify-center px-3 py-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors text-sm font-medium gap-1"
            >
              {isExpanded ? (
                <>
                  <ChevronDown className="w-4 h-4" />
                  Contraer
                </>
              ) : (
                <>
                  <ChevronUp className="w-4 h-4" />
                  Expandir
                </>
              )}
            </button>
          </div>
        </div>
      </Card>
    </div>
  )
}
