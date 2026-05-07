"use client"

import Link from "next/link"
import { ArrowRight, Shield, MapPin } from "lucide-react"

export function HeroSection() {
  return (
    <section className="relative flex flex-col items-center justify-center min-h-screen px-6 text-center overflow-hidden">
      {/* Grid background pattern */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(var(--color-foreground) 1px, transparent 1px), linear-gradient(90deg, var(--color-foreground) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
        aria-hidden="true"
      />

      {/* Subtle glow behind headline */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-10 pointer-events-none"
        style={{ background: "radial-gradient(circle, var(--color-primary) 0%, transparent 70%)" }}
        aria-hidden="true"
      />

      <div className="relative z-10 flex flex-col items-center gap-6 max-w-3xl mx-auto">
        {/* Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-card text-sm text-muted-foreground">
          <MapPin className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
          <span>Durango, México</span>
        </div>

        {/* Headline */}
        <h1 className="font-mono text-5xl md:text-7xl font-bold text-foreground text-balance leading-tight tracking-tight">
          Movilidad{" "}
          <span className="text-primary">Segura</span>{" "}
          en Durango
        </h1>

        {/* Subtitle */}
        <p className="text-lg md:text-xl text-muted-foreground leading-relaxed text-pretty max-w-xl">
          Plataforma de inteligencia urbana que centraliza información de seguridad, zonas de riesgo y rutas seguras para la ciudad de Durango.
        </p>

        {/* CTA */}
        <Link
          href="/mapa"
          className="group inline-flex items-center gap-2 px-7 py-3.5 rounded-lg bg-primary text-primary-foreground font-semibold text-base hover:opacity-90 transition-opacity mt-2"
        >
          Ir al mapa
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
        </Link>
      </div>

      {/* Bottom feature row */}
      <div className="relative z-10 mt-20 grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-3xl">
        {FEATURES.map((f) => (
          <FeatureCard key={f.label} {...f} />
        ))}
      </div>
    </section>
  )
}

interface FeatureCardProps {
  icon: React.ReactNode
  label: string
  description: string
  soon?: boolean
}

function FeatureCard({ icon, label, description, soon }: FeatureCardProps) {
  return (
    <div className="flex flex-col gap-2 p-4 rounded-lg border border-border bg-card">
      <div className="flex items-center gap-2">
        <span className="text-primary">{icon}</span>
        <span className="font-mono font-semibold text-foreground text-sm">{label}</span>
        {soon && (
          <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded border border-border text-muted-foreground font-mono uppercase">
            Próximo
          </span>
        )}
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
    </div>
  )
}

const FEATURES: FeatureCardProps[] = [
  {
    icon: <Shield className="w-4 h-4" />,
    label: "Zonas de Riesgo",
    description: "Visualización de zonas con mayor incidencia delictiva en tiempo real.",
    soon: true,
  },
  {
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M3 12h18M12 3l9 9-9 9" />
      </svg>
    ),
    label: "Rutas Seguras",
    description: "Cálculo de rutas óptimas evitando zonas de peligro registradas.",
    soon: true,
  },
  {
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <rect x="3" y="11" width="18" height="11" rx="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    ),
    label: "Transporte Público",
    description: "Integración de rutas y paradas de transporte urbano en el mapa.",
    soon: true,
  },
]
