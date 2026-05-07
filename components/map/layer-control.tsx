"use client"

import { Layers } from "lucide-react"
import type { MapLayer } from "@/lib/map/types"

interface LayerControlProps {
  layers: MapLayer[]
  onToggle: (id: MapLayer["id"]) => void
}

export function LayerControl({ layers, onToggle }: LayerControlProps) {
  return (
    <aside
      className="absolute top-4 right-4 z-[1000] w-56 rounded-lg border border-border bg-card/95 backdrop-blur-md shadow-xl"
      aria-label="Control de capas del mapa"
    >
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
        <Layers className="w-4 h-4 text-primary" aria-hidden="true" />
        <span className="font-mono text-sm font-semibold text-foreground">Capas</span>
      </div>

      <ul className="p-2 flex flex-col gap-1">
        {layers.map((layer) => (
          <li key={layer.id}>
            <button
              onClick={() => onToggle(layer.id)}
              className={`w-full flex items-start gap-3 px-3 py-2.5 rounded-md text-left transition-colors ${
                layer.enabled
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
              }`}
              aria-pressed={layer.enabled}
              title={layer.description}
            >
              {/* Color swatch */}
              <span
                className="mt-0.5 w-3 h-3 rounded-sm shrink-0 ring-1 ring-white/20"
                style={{ backgroundColor: layer.color }}
                aria-hidden="true"
              />
              <span className="flex flex-col gap-0.5">
                <span className="text-xs font-mono font-semibold leading-none">{layer.label}</span>
                <span className="text-[10px] leading-tight opacity-60">{layer.description}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>

      <div className="px-4 py-2 border-t border-border">
        <p className="text-[10px] text-muted-foreground font-mono">
          Capas marcadas como <span className="text-accent font-semibold">Próximo</span> — en desarrollo
        </p>
      </div>
    </aside>
  )
}
