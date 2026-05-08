"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { MapPin, Route } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export function MobileNavTabs() {
  const pathname = usePathname()

  const tabs = [
    {
      href: "/mapa",
      icon: MapPin,
      label: "Reportes",
      isActive: pathname === "/mapa",
    },
    {
      href: "/mapa/rutas-seguras",
      icon: Route,
      label: "Rutas Seguras",
      isActive: pathname === "/mapa/rutas-seguras",
    },
  ]

  return (
    <TooltipProvider>
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t border-border bg-background/95 backdrop-blur-sm md:relative md:flex-row md:border-t-0 md:border-b md:bottom-auto md:top-0 md:justify-end md:gap-4 md:bg-transparent md:backdrop-blur-0 md:px-4 md:py-0 md:border-border"
        aria-label="Navegacion de mapas"
      >
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <Tooltip key={tab.href}>
              <TooltipTrigger asChild>
                <Link
                  href={tab.href}
                  className={cn(
                    "flex flex-col items-center justify-center w-16 h-16 md:h-auto md:w-auto md:flex-row md:gap-2 md:px-3 md:py-2 rounded-md transition-all relative group",
                    tab.isActive
                      ? "text-primary md:bg-primary/10"
                      : "text-muted-foreground hover:text-foreground md:hover:text-foreground md:hover:bg-secondary"
                  )}
                  aria-current={tab.isActive ? "page" : undefined}
                >
                  <Icon className="w-6 h-6 md:w-4 md:h-4" aria-hidden="true" />
                  <span className="hidden md:inline text-sm font-mono">
                    {tab.label}
                  </span>

                  {/* Indicador animado para mobile */}
                  {tab.isActive && (
                    <div className="absolute bottom-1 w-1 h-1 bg-primary rounded-full md:hidden" />
                  )}

                  {/* Underline animado para desktop */}
                  <div
                    className={cn(
                      "absolute bottom-0 left-0 right-0 h-0.5 bg-primary transition-all duration-300 md:block hidden",
                      tab.isActive ? "w-full" : "w-0 group-hover:w-1/2 group-hover:left-1/4"
                    )}
                  />
                </Link>
              </TooltipTrigger>
              <TooltipContent className="md:hidden">{tab.label}</TooltipContent>
            </Tooltip>
          )
        })}
      </nav>
    </TooltipProvider>
  )
}
