"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { ChevronDown, ChevronUp } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface LegendItem {
  color: string
  label: string
  description?: string
}

interface CollapsibleLegendProps {
  items: LegendItem[]
  title: string
  icon?: React.ReactNode
  mobile?: boolean
  onClose?: () => void
}

export function CollapsibleLegend({
  items,
  title,
  icon,
  mobile = false,
  onClose,
}: CollapsibleLegendProps) {
  const [isExpanded, setIsExpanded] = useState(!mobile)

  if (mobile) {
    return (
      <div className="flex flex-col h-full">
        {/* Sticky header */}
        <div className="flex-shrink-0 flex items-center justify-between px-4 py-3.5 border-b border-border/40 bg-background/50 backdrop-blur-sm">
          <div className="flex items-center gap-2.5">
            {icon && <div className="text-lg">{icon}</div>}
            <h3 className="font-semibold text-foreground text-sm">{title}</h3>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
            aria-label="Cerrar leyenda"
          >
            <ChevronDown className="w-4 h-4" />
          </Button>
        </div>

        {/* Legend items */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {items.map((item, idx) => (
            <div key={idx} className="flex items-start gap-3">
              <div
                className="w-4 h-4 rounded-md shrink-0 mt-0.5 border border-border/60"
                style={{ backgroundColor: item.color }}
                role="img"
                aria-label={`Color ${item.label}`}
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground">{item.label}</p>
                {item.description && (
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    {item.description}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Desktop version
  return (
    <Card className="absolute top-4 right-4 z-40 max-w-xs shadow-lg border-border/50">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-secondary/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          {icon && <div className="text-lg">{icon}</div>}
          <h3 className="font-semibold text-foreground text-sm">{title}</h3>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        )}
      </button>

      {isExpanded && (
        <>
          <div className="h-px bg-border/30" />
          <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
            {items.map((item, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <div
                  className="w-3 h-3 rounded-md shrink-0 mt-1 border border-border/60"
                  style={{ backgroundColor: item.color }}
                  role="img"
                  aria-label={`Color ${item.label}`}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground">{item.label}</p>
                  {item.description && (
                    <p className="text-[10px] text-muted-foreground leading-relaxed">
                      {item.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </Card>
  )
}
