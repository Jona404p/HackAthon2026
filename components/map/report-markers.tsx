"use client"

import { useState, useEffect, useCallback } from "react"
import { Marker, Popup } from "react-leaflet"
import L from "leaflet"
import { createClient } from "@/lib/supabase/client"
import {
  AlertTriangle,
  Car,
  Construction,
  Flame,
  Droplets,
  Shield,
  HelpCircle,
  MessageSquare,
  ExternalLink,
  Eye,
  Heart,
  GraduationCap,
  Building2,
  Briefcase,
  Leaf,
  Zap,
  Bus,
} from "lucide-react"
import { useRouter } from "next/navigation"

export interface MapReport {
  id: string
  latitude: number
  longitude: number
  category: string
  description: string
  created_at: string
  post_id?: string
  anonymous_posts?: {
    image_url?: string | null
  }
}

export const REPORT_CATEGORIES = [
  { id: "accidente",    label: "Accidente",          icon: Car,           color: "#ef4444", forumCategory: "alerta"       },
  { id: "robo",         label: "Robo / Asalto",      icon: AlertTriangle, color: "#f97316", forumCategory: "seguridad"    },
  { id: "incendio",     label: "Incendio",           icon: Flame,         color: "#dc2626", forumCategory: "alerta"       },
  { id: "inundacion",   label: "Inundacion",         icon: Droplets,      color: "#3b82f6", forumCategory: "agua"         },
  { id: "obras",        label: "Obras / Cierre",     icon: Construction,  color: "#eab308", forumCategory: "zona"         },
  { id: "policia",      label: "Presencia Policial", icon: Shield,        color: "#22c55e", forumCategory: "seguridad"    },
  { id: "transporte",   label: "Transporte",         icon: Bus,           color: "#0ea5e9", forumCategory: "transporte"   },
  { id: "salud",        label: "Emergencia Medica",  icon: Heart,         color: "#ec4899", forumCategory: "salud"        },
  { id: "educacion",    label: "Educacion",          icon: GraduationCap, color: "#a855f7", forumCategory: "educacion"    },
  { id: "gobierno",     label: "Gobierno",           icon: Building2,     color: "#f97316", forumCategory: "gobierno"     },
  { id: "empleo",       label: "Empleo",             icon: Briefcase,     color: "#06b6d4", forumCategory: "empleo"       },
  { id: "ambiente",     label: "Medio Ambiente",     icon: Leaf,          color: "#10b981", forumCategory: "ambiente"     },
  { id: "electricidad", label: "Electricidad",       icon: Zap,           color: "#f59e0b", forumCategory: "electricidad" },
  { id: "otro",         label: "Otro",               icon: HelpCircle,    color: "#8b5cf6", forumCategory: "general"      },
]

export function getCategoryMeta(id: string) {
  return REPORT_CATEGORIES.find((c) => c.id === id) ?? REPORT_CATEGORIES[REPORT_CATEGORIES.length - 1]
}

function createMarkerIcon(color: string, isRecent = false) {
  const size = isRecent ? 32 : 26
  return L.divIcon({
    className: "report-marker",
    html: `
      <div style="
        width:${size}px; height:${size}px;
        background:${color};
        border: 3px solid rgba(255,255,255,0.92);
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        box-shadow: 0 3px 14px rgba(0,0,0,0.32), 0 0 ${isRecent ? "10px" : "0"} ${color}55;
        ${isRecent ? "animation: marker-glow 2.5s ease-in-out infinite;" : ""}
        cursor: pointer;
      "></div>
      <style>
        @keyframes marker-glow {
          0%,100% { box-shadow: 0 3px 14px rgba(0,0,0,.32), 0 0 8px ${color}40; }
          50%      { box-shadow: 0 3px 14px rgba(0,0,0,.32), 0 0 18px ${color}70; }
        }
      </style>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size - 4],
  })
}

function formatTime(dateStr: string) {
  const diffMs = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return "Ahora"
  if (mins < 60) return `Hace ${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `Hace ${hrs}h`
  return `Hace ${Math.floor(hrs / 24)}d`
}

export function ReportMarkers() {
  const [reports, setReports] = useState<MapReport[]>([])
  const router = useRouter()
  const supabase = createClient()

  const fetchReports = useCallback(async () => {
    try {
      const response = await fetch('/api/reports')
      const result = await response.json()

      if (!response.ok) {
        console.error('Error fetching map reports from API:', result)
        return
      }

      setReports(result.reports ?? [])
    } catch (error) {
      console.error('Error fetching map reports from API:', error)
    }
  }, [])

  useEffect(() => {
    fetchReports()

    const channel = supabase
      .channel("map_reports_realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "map_reports" }, () => {
        fetchReports()
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "map_reports" }, () => {
        fetchReports()
      })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "map_reports" }, (payload) => {
        setReports((prev) => prev.filter((r) => r.id !== payload.old.id))
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [fetchReports, supabase])

  return (
    <>
      {reports.map((report) => {
        const cat = getCategoryMeta(report.category)
        const isRecent = Date.now() - new Date(report.created_at).getTime() < 60 * 60 * 1000
        return (
          <Marker
            key={report.id}
            position={[report.latitude, report.longitude]}
            icon={createMarkerIcon(cat.color, isRecent)}
          >
            <Popup className="report-popup">
              <div className="min-w-[240px] p-1">
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${cat.color}25` }}
                  >
                    <cat.icon className="w-4 h-4" style={{ color: cat.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="font-semibold text-sm block leading-tight">{cat.label}</span>
                    <span className="text-xs opacity-55 block">{formatTime(report.created_at)}</span>
                  </div>
                </div>
                <p className="text-sm mb-3 leading-relaxed opacity-80 line-clamp-3">{report.description}</p>
                {report.anonymous_posts?.image_url && (
                  <a
                    href={report.anonymous_posts.image_url}
                    target="_blank"
                    rel="noreferrer"
                    className="block mb-3 overflow-hidden rounded-xl border border-border bg-black/5"
                  >
                    <img
                      src={report.anonymous_posts.image_url}
                      alt="Imagen del reporte"
                      className="w-full h-28 object-cover"
                    />
                  </a>
                )}
                {report.post_id ? (
                  <button
                    onClick={() => router.push(`/?post=${report.post_id}`)}
                    className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-lg px-3 py-2 text-sm font-medium hover:opacity-90 transition-opacity"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Ver discusion
                    <ExternalLink className="w-3 h-3 opacity-70" />
                  </button>
                ) : (
                  <div className="flex items-center gap-2 text-xs opacity-45 justify-center py-1">
                    <Eye className="w-3.5 h-3.5" />
                    Sin discusion vinculada
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        )
      })}
    </>
  )
}

// Expose report count as a hook for the panel
export function useReportCount() {
  const [count, setCount] = useState(0)
  const supabase = createClient()

  useEffect(() => {
    supabase
      .from("map_reports")
      .select("id", { count: "exact", head: true })
      .then(({ count: c }) => { if (c !== null) setCount(c) })
  }, [supabase])

  return count
}
