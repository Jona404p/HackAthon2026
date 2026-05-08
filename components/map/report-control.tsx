"use client"

import { useState, useEffect, useCallback } from "react"
import { useMap, useMapEvents, Marker, Popup } from "react-leaflet"
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
  MapPin,
  X,
  Send,
  Loader2,
  ChevronDown,
  MessageSquare,
  ExternalLink,
  Plus,
  Eye,
  MousePointerClick,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

interface MapReport {
  id: string
  latitude: number
  longitude: number
  category: string
  description: string
  created_at: string
  post_id?: string
}

const REPORT_CATEGORIES = [
  { id: "accidente", label: "Accidente", icon: Car, color: "#ef4444", forumCategory: "alerta" },
  { id: "robo", label: "Robo/Asalto", icon: AlertTriangle, color: "#f97316", forumCategory: "seguridad" },
  { id: "incendio", label: "Incendio", icon: Flame, color: "#dc2626", forumCategory: "alerta" },
  { id: "inundacion", label: "Inundacion", icon: Droplets, color: "#3b82f6", forumCategory: "agua" },
  { id: "obras", label: "Obras/Cierre", icon: Construction, color: "#eab308", forumCategory: "zona" },
  { id: "policia", label: "Presencia Policial", icon: Shield, color: "#22c55e", forumCategory: "seguridad" },
  { id: "otro", label: "Otro", icon: HelpCircle, color: "#8b5cf6", forumCategory: "general" },
]

function createCustomIcon(color: string, isNew = false, isRecent = false) {
  const size = isNew ? 40 : isRecent ? 32 : 28
  const borderWidth = isNew ? 4 : 3
  
  return L.divIcon({
    className: "custom-marker",
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        background: ${color};
        border: ${borderWidth}px solid ${isNew ? "#fff" : "rgba(255,255,255,0.9)"};
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        box-shadow: 0 3px 16px rgba(0,0,0,${isNew ? "0.5" : "0.35"}), 0 0 ${isRecent ? "12px" : "0"} ${color}40;
        ${isNew ? "animation: pulse 1.5s ease-in-out infinite;" : ""}
        ${isRecent && !isNew ? "animation: glow 2s ease-in-out infinite;" : ""}
        cursor: pointer;
        transition: transform 0.2s ease, box-shadow 0.2s ease;
      " class="marker-pin"></div>
      <style>
        @keyframes pulse {
          0%, 100% { transform: rotate(-45deg) scale(1); }
          50% { transform: rotate(-45deg) scale(1.15); }
        }
        @keyframes glow {
          0%, 100% { box-shadow: 0 3px 16px rgba(0,0,0,0.35), 0 0 8px ${color}30; }
          50% { box-shadow: 0 3px 16px rgba(0,0,0,0.35), 0 0 16px ${color}50; }
        }
        .marker-pin:hover {
          transform: rotate(-45deg) scale(1.1) !important;
        }
      </style>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  })
}

function MapClickHandler({
  isReporting,
  onMapClick,
}: {
  isReporting: boolean
  onMapClick: (lat: number, lng: number) => void
}) {
  const map = useMap()

  useMapEvents({
    click(e) {
      if (isReporting) {
        onMapClick(e.latlng.lat, e.latlng.lng)
      }
    },
  })

  // Change cursor when in reporting mode
  useEffect(() => {
    const container = map.getContainer()
    if (isReporting) {
      container.style.cursor = "crosshair"
    } else {
      container.style.cursor = ""
    }
    return () => {
      container.style.cursor = ""
    }
  }, [isReporting, map])

  return null
}

export function ReportControl() {
  const router = useRouter()
  const [isReporting, setIsReporting] = useState(false)
  const [reports, setReports] = useState<MapReport[]>([])
  const [pendingLocation, setPendingLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>("")
  const [description, setDescription] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [lastPostId, setLastPostId] = useState<string | null>(null)
  const map = useMap()

  const supabase = createClient()

  // Fetch existing reports
  const fetchReports = useCallback(async () => {
    const { data } = await supabase
      .from("map_reports")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200)

    if (data) {
      setReports(data)
    }
  }, [supabase])

  useEffect(() => {
    fetchReports()

    const channel = supabase
      .channel("map_reports_realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "map_reports" },
        (payload) => {
          // Agregar el nuevo reporte sin hacer fetch completo
          if (payload.new) {
            setReports((prev) => [payload.new as MapReport, ...prev])
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "map_reports" },
        (payload) => {
          if (payload.new) {
            setReports((prev) =>
              prev.map((r) => (r.id === payload.new.id ? (payload.new as MapReport) : r))
            )
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "map_reports" },
        (payload) => {
          setReports((prev) => prev.filter((r) => r.id !== payload.old.id))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchReports, supabase])

  function handleMapClick(lat: number, lng: number) {
    setPendingLocation({ lat, lng })
    setShowCategoryDropdown(false)
    // Center map on the clicked location with animation
    map.flyTo([lat, lng], Math.max(map.getZoom(), 16), { duration: 0.5 })
  }

  function cancelReport() {
    setIsReporting(false)
    setPendingLocation(null)
    setSelectedCategory("")
    setDescription("")
    setShowCategoryDropdown(false)
    setSubmitSuccess(false)
    setLastPostId(null)
  }

  function startReporting() {
    setIsReporting(true)
    setSubmitSuccess(false)
    setLastPostId(null)
  }

  async function submitReport() {
    if (!pendingLocation || !selectedCategory || !description.trim()) return

    setIsSubmitting(true)

    const categoryData = REPORT_CATEGORIES.find((c) => c.id === selectedCategory)
    const forumCategory = categoryData?.forumCategory || "general"

    try {
      // 1. Crear automaticamente un post en el foro primero
      const { data: postData, error: postError } = await supabase
        .from("anonymous_posts")
        .insert({
          content: description.trim(),
          category: forumCategory,
        })
        .select()
        .single()

      if (postError || !postData) {
        console.error("[v0] Error creating forum post:", postError)
        setIsSubmitting(false)
        return
      }

      // 2. Crear el reporte en el mapa vinculado al post
      const { data: reportData, error: reportError } = await supabase
        .from("map_reports")
        .insert({
          latitude: pendingLocation.lat,
          longitude: pendingLocation.lng,
          category: selectedCategory,
          description: description.trim(),
          post_id: postData.id,
        })
        .select()
        .single()

      if (reportError || !reportData) {
        console.error("[v0] Error creating map report:", reportError)
        setIsSubmitting(false)
        return
      }

      setLastPostId(postData.id)
      setSubmitSuccess(true)
      await fetchReports()
    } catch (error) {
      console.error("[v0] Unexpected error:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  function goToDiscussion() {
    if (lastPostId) {
      router.push(`/?post=${lastPostId}`)
    }
  }

  function formatTime(dateStr: string) {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 1) return "Ahora"
    if (diffMins < 60) return `Hace ${diffMins}m`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `Hace ${diffHours}h`
    const diffDays = Math.floor(diffHours / 24)
    return `Hace ${diffDays}d`
  }

  function handleMarkerClick(report: MapReport) {
    if (report.post_id) {
      router.push(`/?post=${report.post_id}`)
    }
  }

  const selectedCategoryData = REPORT_CATEGORIES.find((c) => c.id === selectedCategory)

  return (
    <>
      <MapClickHandler isReporting={isReporting} onMapClick={handleMapClick} />

      {/* Reports count badge */}
      {!isReporting && reports.length > 0 && (
        <div className="absolute top-4 left-4 z-[1000] bg-card/95 backdrop-blur-sm border border-border rounded-lg px-3 py-2 shadow-lg">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
            <span className="text-sm font-medium text-foreground">
              {reports.length} reporte{reports.length !== 1 ? "s" : ""} activo{reports.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      )}

      {/* Report Button / Panel */}
      <div className="absolute top-4 right-4 z-[1000]">
        {!isReporting ? (
          <Button
            onClick={startReporting}
            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground shadow-lg gap-2 h-11 px-5"
          >
            <Plus className="w-5 h-5" />
            Agregar Reporte
          </Button>
        ) : (
          <div className="bg-card/95 backdrop-blur-sm border border-border rounded-xl p-4 w-80 shadow-2xl">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <MapPin className="w-4 h-4 text-destructive" />
                Nuevo Reporte
              </h3>
              <button
                onClick={cancelReport}
                className="text-muted-foreground hover:text-foreground transition-colors p-1 hover:bg-secondary rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {submitSuccess ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-success">
                  <Shield className="w-5 h-5" />
                  <span className="font-medium">Reporte enviado</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Tu reporte ha sido publicado en el mapa. Se ha creado una discusion en el foro donde otros usuarios pueden comentar.
                </p>
                <div className="flex gap-2">
                  <Button
                    onClick={goToDiscussion}
                    className="flex-1 bg-primary hover:bg-primary/90 gap-2"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Ver discusion
                  </Button>
                  <Button
                    onClick={cancelReport}
                    variant="outline"
                  >
                    Cerrar
                  </Button>
                </div>
              </div>
            ) : !pendingLocation ? (
              <div className="space-y-4">
                <div className="bg-secondary/60 rounded-lg p-4 border border-border/50">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-destructive/20 flex items-center justify-center">
                      <MousePointerClick className="w-5 h-5 text-destructive" />
                    </div>
                    <div>
                      <p className="text-sm text-foreground font-medium">Haz clic en el mapa</p>
                      <p className="text-xs text-muted-foreground">para marcar la ubicacion</p>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Tu reporte sera publicado de forma anonima. Se creara automaticamente una discusion en el foro de Voz Ciudadana.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono bg-secondary/50 rounded px-2 py-1.5">
                  <MapPin className="w-3 h-3 text-destructive" />
                  {pendingLocation.lat.toFixed(5)}, {pendingLocation.lng.toFixed(5)}
                </div>

                {/* Category Dropdown */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                    className="w-full flex items-center justify-between bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm text-left hover:border-primary/40 transition-colors"
                  >
                    {selectedCategoryData ? (
                      <span className="flex items-center gap-2">
                        <selectedCategoryData.icon
                          className="w-4 h-4"
                          style={{ color: selectedCategoryData.color }}
                        />
                        <span className="text-foreground">{selectedCategoryData.label}</span>
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Selecciona categoria</span>
                    )}
                    <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${showCategoryDropdown ? 'rotate-180' : ''}`} />
                  </button>

                  {showCategoryDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-lg shadow-xl overflow-hidden z-10">
                      {REPORT_CATEGORIES.map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => {
                            setSelectedCategory(cat.id)
                            setShowCategoryDropdown(false)
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-foreground hover:bg-secondary transition-colors"
                        >
                          <cat.icon className="w-4 h-4" style={{ color: cat.color }} />
                          {cat.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Description */}
                <div>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe brevemente lo que ocurrio..."
                    className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-destructive/50 focus:border-destructive/50 transition-all"
                    rows={3}
                    maxLength={280}
                  />
                  <div className="text-xs text-muted-foreground text-right mt-1">{description.length}/280</div>
                </div>

                {/* Info about forum */}
                <div className="flex items-start gap-2 bg-primary/10 rounded-lg p-3 border border-primary/20">
                  <MessageSquare className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Este reporte creara una discusion en el foro donde otros usuarios podran comentar y dar seguimiento.
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-1">
                  <Button
                    onClick={submitReport}
                    disabled={!selectedCategory || !description.trim() || isSubmitting}
                    className="flex-1 bg-destructive hover:bg-destructive/90 text-destructive-foreground disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Publicar
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={() => setPendingLocation(null)}
                    variant="outline"
                  >
                    Cambiar
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Instruction banner when reporting */}
      {isReporting && !pendingLocation && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-destructive text-destructive-foreground px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-sm font-medium">
          <MousePointerClick className="w-4 h-4" />
          Haz clic en el mapa para marcar la ubicacion
        </div>
      )}

      {/* Pending location marker */}
      {pendingLocation && !submitSuccess && (
        <Marker
          position={[pendingLocation.lat, pendingLocation.lng]}
          icon={createCustomIcon(selectedCategoryData?.color || "#ef4444", true)}
        />
      )}

      {/* Existing report markers - clickable to go to forum */}
      {reports.map((report) => {
        const cat = REPORT_CATEGORIES.find((c) => c.id === report.category) || REPORT_CATEGORIES[6]
        // Check if report is recent (within last hour)
        const isRecent = Date.now() - new Date(report.created_at).getTime() < 60 * 60 * 1000
        return (
          <Marker
            key={report.id}
            position={[report.latitude, report.longitude]}
            icon={createCustomIcon(cat.color, false, isRecent)}
            eventHandlers={{
              click: () => {
                // Don't navigate immediately - show popup first
              },
            }}
          >
            <Popup className="report-popup">
              <div className="min-w-[240px] p-1">
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: `${cat.color}20` }}
                  >
                    <cat.icon className="w-4 h-4" style={{ color: cat.color }} />
                  </div>
                  <div className="flex-1">
                    <span className="font-semibold text-sm">{cat.label}</span>
                    <span className="text-xs opacity-60 block">{formatTime(report.created_at)}</span>
                  </div>
                </div>
                <p className="text-sm mb-3 leading-relaxed opacity-80">{report.description}</p>
                {report.post_id ? (
                  <button
                    onClick={() => handleMarkerClick(report)}
                    className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-lg px-3 py-2 text-sm font-medium hover:opacity-90 transition-opacity"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Ver discusion en el foro
                    <ExternalLink className="w-3 h-3" />
                  </button>
                ) : (
                  <div className="flex items-center gap-2 text-xs opacity-50 justify-center py-2">
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
