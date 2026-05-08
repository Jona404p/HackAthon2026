"use client"

import Image from 'next/image'
import Link from "next/link"
import { usePathname } from "next/navigation"
import { MapPin, Shield, Route, Home } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { cn } from "@/lib/utils"

interface NavbarProps {
  backToHome?: boolean
}

const mapNavLinks = [
  { href: "/mapa", label: "Reportes", icon: MapPin, exact: true },
  { href: "/mapa/zonas-seguras", label: "Zonas Seguras", icon: Shield, exact: true },
  { href: "/mapa/rutas-seguras", label: "Rutas Seguras", icon: Route, exact: true },
]

export function Navbar({ backToHome = false }: NavbarProps) {
  const pathname = usePathname()
  const isMapPage = pathname?.startsWith("/mapa")

  return (
    <>
      {/* ---- Top header ---- */}
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 md:px-6 border-b border-border bg-background/90 backdrop-blur-md h-14">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group shrink-0">
          <div className="relative w-8 h-8 rounded-xl overflow-hidden border border-border bg-muted/30">
            <Image src="/logo.png" alt="Logo NoFear" fill className="object-cover" priority />
          </div>
          <p className="font-mono font-bold text-foreground text-sm tracking-tight">NoFear</p>
        </Link>

        {/* Desktop nav — only visible on md+ when inside /mapa */}
        {isMapPage && (
          <nav className="hidden md:flex items-center gap-1" aria-label="Secciones del mapa">
            {mapNavLinks.map(({ href, label, icon: Icon, exact }) => {
              const active = exact ? pathname === href : pathname?.startsWith(href)
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  )}
                >
                  <Icon className="w-4 h-4" aria-hidden="true" />
                  {label}
                </Link>
              )
            })}
          </nav>
        )}

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {isMapPage && (
            <Link
              href="/"
              className="hidden md:flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors px-2 py-1.5 rounded-lg hover:bg-secondary"
            >
              <Home className="w-4 h-4" />
              Inicio
            </Link>
          )}
          <ThemeToggle />
        </div>
      </header>

      {/* Spacer para el header fijo */}
      <div className="h-14" />
    </>
  )
}
