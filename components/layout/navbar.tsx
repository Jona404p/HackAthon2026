import Link from "next/link"
import { MapPin } from "lucide-react"

interface NavbarProps {
  backToHome?: boolean
}

export function Navbar({ backToHome = false }: NavbarProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 border-b border-border bg-background/80 backdrop-blur-md">
      <Link href="/" className="flex items-center gap-2 group">
        <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
          <MapPin className="w-4 h-4 text-primary-foreground" aria-hidden="true" />
        </div>
        <span className="font-mono font-bold text-foreground text-base tracking-tight">
          SafeRoute<span className="text-primary">.</span>
        </span>
      </Link>

      <nav className="flex items-center gap-4" aria-label="Navegación principal">
        {backToHome ? (
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors font-mono"
          >
            ← Inicio
          </Link>
        ) : (
          <Link
            href="/mapa"
            className="text-sm px-4 py-1.5 rounded-md bg-primary text-primary-foreground font-mono font-semibold hover:opacity-90 transition-opacity"
          >
            Ir al mapa
          </Link>
        )}
      </nav>
    </header>
  )
}
