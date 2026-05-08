'use client'

import { useEffect, useState } from 'react'
import { Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MapPin, MessageSquare } from 'lucide-react'

interface MapReport {
  id: string
  latitude: number
  longitude: number
  category: string
  description: string
  created_at: string
  post_id?: string
}

// Custom icon para los reportes
const createReportIcon = (category: string) => {
  const categoryColors: Record<string, string> = {
    seguridad: '#ef4444',
    vialidad: '#f59e0b',
    servicios: '#3b82f6',
    infraestructura: '#8b5cf6',
    otro: '#6b7280',
  }

  const color = categoryColors[category.toLowerCase()] || '#6b7280'

  return L.divIcon({
    className: 'custom-report-marker',
    html: `
      <div style="
        background: ${color};
        width: 32px;
        height: 32px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        cursor: pointer;
        transition: transform 0.2s ease;
      " class="report-marker-pin">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
          <circle cx="12" cy="10" r="3" fill="white"/>
        </svg>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  })
}

const getCategoryLabel = (category: string): string => {
  const labels: Record<string, string> = {
    seguridad: 'Seguridad',
    vialidad: 'Vialidad',
    servicios: 'Servicios Públicos',
    infraestructura: 'Infraestructura',
    otro: 'Otro',
  }
  return labels[category.toLowerCase()] || category
}

const getCategoryColor = (category: string): string => {
  const colors: Record<string, string> = {
    seguridad: 'destructive',
    vialidad: 'warning',
    servicios: 'info',
    infraestructura: 'secondary',
    otro: 'default',
  }
  return colors[category.toLowerCase()] || 'default'
}

export function ReportsLayer({ enabled }: { enabled: boolean }) {
  const [reports, setReports] = useState<MapReport[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const map = useMap()

  useEffect(() => {
    if (!enabled) return

    const supabase = createClient()
    setLoading(true)

    // Cargar reportes iniciales
    const loadReports = async () => {
      const { data, error } = await supabase
        .from('map_reports')
        .select('*')
        .order('created_at', { ascending: false })

      if (!error && data) {
        setReports(data as MapReport[])
      }
      setLoading(false)
    }

    loadReports()

    // Suscribirse a cambios en tiempo real
    const subscription = supabase
      .channel('reports_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'map_reports',
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setReports((prev) => [payload.new as MapReport, ...prev])
          } else if (payload.eventType === 'UPDATE') {
            setReports((prev) =>
              prev.map((r) => (r.id === payload.new.id ? (payload.new as MapReport) : r))
            )
          } else if (payload.eventType === 'DELETE') {
            setReports((prev) => prev.filter((r) => r.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [enabled])

  if (!enabled || loading) return null

  return (
    <>
      {reports.map((report) => (
        <Marker
          key={report.id}
          position={[report.latitude, report.longitude]}
          icon={createReportIcon(report.category)}
        >
          <Popup className="report-popup">
            <div className="w-64 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <h3 className="font-semibold text-sm">{getCategoryLabel(report.category)}</h3>
                </div>
                <Badge variant={getCategoryColor(report.category) as any} className="text-xs">
                  {report.category}
                </Badge>
              </div>

              <p className="text-sm text-foreground/80 line-clamp-3">{report.description}</p>

              <div className="flex items-center justify-between pt-2 border-t">
                <span className="text-xs text-muted-foreground">
                  {new Date(report.created_at).toLocaleDateString('es-MX')}
                </span>

                {report.post_id ? (
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => {
                      router.push(`/?post=${report.post_id}#forum`)
                    }}
                    className="gap-1.5"
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                    Ver Discusión
                  </Button>
                ) : (
                  <span className="text-xs text-muted-foreground italic">Sin discusión aún</span>
                )}
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  )
}
