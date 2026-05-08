"use client"

import Image from 'next/image'
import Link from "next/link"
import { usePathname } from "next/navigation"
import { MapPin, Shield, Route } from "lucide-react"
import { cn } from "@/lib/utils"
import { ThemeToggle } from "@/components/theme-toggle"

interface NavbarProps {
  backToHome?: boolean
}

export function Navbar({ backToHome = false }: NavbarProps) {
  const pathname = usePathname()
  const isMapPage = pathname?.startsWith("/mapa")

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 border-b border-border bg-background/80 backdrop-blur-md">
      <Link href="/" className="flex items-center gap-3 group">
        <div className="relative w-10 h-10 rounded-2xl overflow-hidden border border-border bg-muted/30">
          <Image
            src="/logo.png"
            alt="Logo SafeRoute"
            fill
            className="object-cover"
            priority
          />
        </div>
        <div>
          <p className="font-mono font-bold text-foreground text-base tracking-tight">
            NoFear<span className="text-primary"></span>
          </p>
          <p className="text-xs text-muted-foreground">Movilidad segura en Durango</p>
        </div>
      </Link>

      <nav className="flex items-center gap-4" aria-label="Navegacion principal">
        {isMapPage ? (
          <>
            <Link
              href="/mapa"
              className={cn(
                "flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-md font-mono transition-all",
                pathname === "/mapa"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              )}
            >
              <MapPin className="w-4 h-4" aria-hidden="true" />
              Reportes
            </Link>
            <Link
              href="/mapa/zonas-seguras"
              className={cn(
                "flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-md font-mono transition-all",
                pathname === "/mapa/zonas-seguras"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              )}
            >
              <Shield className="w-4 h-4" aria-hidden="true" />
              Zonas Seguras
            </Link>
            <Link
              href="/mapa/rutas-seguras"
              className={cn(
                "flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-md font-mono transition-all",
                pathname === "/mapa/rutas-seguras"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              )}
            >
              <Route className="w-4 h-4" aria-hidden="true" />
              Rutas Seguras
            </Link>
            <Link
              href="/"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors font-mono ml-2"
            >
              ← Inicio
            </Link>
            <div className="h-4 w-px bg-border ml-2" />
            <ThemeToggle />
          </>
        ) : (
          <>
            <ThemeToggle />
            <Link
              href="/mapa"
              className="text-sm px-4 py-1.5 rounded-md bg-primary text-primary-foreground font-mono font-semibold hover:opacity-90 transition-opacity"
            >
              Ir al mapa
            </Link>
          </>
        )}
      </nav>
    </header>
  )
}
