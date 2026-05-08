"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"

import { Badge } from "@/components/ui/badge"
import {
  Plus,
  X,
  MapPin,
  Send,
  Loader2,
  ChevronDown,
  MessageSquare,
  Shield,
  Check,
  ArrowLeft,
  Navigation,
  Clock,
  ChevronRight,
  Camera,
  ImageIcon,
  AlertCircle,
  TrendingUp,
  Flame,
  Eye,
  ArrowUpRight,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { REPORT_CATEGORIES, getCategoryMeta, type MapReport } from "./report-markers"

interface ReportPanelProps {
  pickedLocation: { lat: number; lng: number } | null
  pickingLocation: boolean
  onRequestPick: () => void
  onCancelPick: () => void
  onReportSubmitted: () => void
  onFocusReport: (lat: number, lng: number, zoom?: number) => void
  onViewDiscussion: (postId: string) => void
}

type PanelView = "list" | "form"

function formatTime(dateStr: string) {
  const diffMs = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return "Ahora"
  if (mins < 60) return `Hace ${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `Hace ${hrs}h`
  return `Hace ${Math.floor(hrs / 24)}d`
}

// ---------------------------------------------------------------------------
// Stats Card Component
// ---------------------------------------------------------------------------
function StatsCard({ reports }: { reports: MapReport[] }) {
  const totalReports = reports.length
  const recentReports = reports.filter(r => 
    Date.now() - new Date(r.created_at).getTime() < 24 * 60 * 60 * 1000
  ).length

  const topCategory = reports.length > 0
    ? Object.entries(
        reports.reduce((acc, r) => {
          acc[r.category] = (acc[r.category] || 0) + 1
          return acc
        }, {} as Record<string, number>)
      ).sort((a, b) => b[1] - a[1])[0]
    : null

  return (
    <div className="grid grid-cols-3 gap-2 p-3 bg-muted/30 rounded-xl border border-border/40 mb-3">
      <div className="text-center">
        <p className="text-lg font-bold text-foreground">{totalReports}</p>
        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Total</p>
      </div>
      <div className="text-center border-x border-border/30">
        <p className="text-lg font-bold text-emerald-500">{recentReports}</p>
        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Hoy</p>
      </div>
      <div className="text-center">
        <p className="text-sm font-bold text-foreground truncate px-1 mt-1">
          {topCategory ? getCategoryMeta(topCategory[0]).label : "—"}
        </p>
        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Más común</p>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Report Card Component
// ---------------------------------------------------------------------------
function ReportCard({ 
  report, 
  onFocus, 
  onViewDiscussion 
}: { 
  report: MapReport
  onFocus: (lat: number, lng: number, zoom?: number) => void
  onViewDiscussion: (postId: string) => void
}) {
  const cat = getCategoryMeta(report.category)
  const isRecent = Date.now() - new Date(report.created_at).getTime() < 60 * 60 * 1000
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)

  return (
    <div className="group">
      <button
        onClick={() => onFocus(report.latitude, report.longitude, 17)}
        className="w-full text-left p-3.5 sm:p-4 hover:bg-secondary/40 active:bg-secondary/60 transition-all duration-200 rounded-xl mx-1"
      >
        <div className="flex items-start gap-3">
          {/* Category Icon */}
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
            style={{ backgroundColor: `${cat.color}18` }}
          >
            <cat.icon className="w-5 h-5" style={{ color: cat.color }} />
          </div>

          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-semibold text-foreground">{cat.label}</span>
              {isRecent && (
                <Badge variant="outline" className="text-[10px] h-5 px-1.5 border-destructive/30 text-destructive bg-destructive/5 gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse" />
                  Nuevo
                </Badge>
              )}
            </div>

            {/* Description */}
            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed mb-2">
              {report.description}
            </p>

            {/* Image */}
            {report.anonymous_posts?.image_url && !imageError && (
              <div className="relative rounded-xl overflow-hidden border border-border/40 bg-muted/20 mb-2.5 group-hover:shadow-sm transition-shadow">
                {!imageLoaded && (
                  <div className="h-32 bg-muted/40 flex items-center justify-center">
                    <ImageIcon className="w-6 h-6 text-muted-foreground/30 animate-pulse" />
                  </div>
                )}
                <img
                  src={`/api/image?url=${encodeURIComponent(report.anonymous_posts.image_url)}`}
                  alt="Imagen del reporte"
                  className={cn(
                    "w-full h-32 sm:h-36 object-cover transition-opacity duration-300",
                    imageLoaded ? "opacity-100" : "opacity-0 absolute inset-0"
                  )}
                  onLoad={() => setImageLoaded(true)}
                  onError={() => setImageError(true)}
                />
              </div>
            )}

            {/* Meta info */}
            <div className="flex items-center gap-3 flex-wrap">
              <span className="flex items-center gap-1 text-[11px] text-muted-foreground/70">
                <Clock className="w-3 h-3" />
                {formatTime(report.created_at)}
              </span>
              <span className="flex items-center gap-1 text-[11px] text-muted-foreground/70 font-mono">
                <Navigation className="w-3 h-3" />
                {report.latitude.toFixed(4)}, {report.longitude.toFixed(4)}
              </span>
              {report.anonymous_posts?.image_url && (
                <span className="flex items-center gap-1 text-[11px] text-sky-500/80">
                  <Camera className="w-3 h-3" />
                  Con foto
                </span>
              )}
            </div>
          </div>

          <ChevronRight className="w-4 h-4 text-muted-foreground/30 shrink-0 mt-1 group-hover:text-muted-foreground/60 group-hover:translate-x-0.5 transition-all" />
        </div>

        {/* Forum link */}
        {report.post_id && (
          <div
            onClick={(e) => {
              e.stopPropagation()
              onViewDiscussion(report.post_id!)
            }}
            className="mt-3 ml-[52px] flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 font-medium transition-colors group/link cursor-pointer"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onViewDiscussion(report.post_id!)
              }
            }}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Ver discusión en el foro
            <ArrowUpRight className="w-3 h-3 opacity-0 group-hover/link:opacity-100 transition-opacity" />
          </div>
        )}
      </button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Form Steps
// ---------------------------------------------------------------------------
function FormStep({ 
  number, 
  title, 
  children, 
  completed = false 
}: { 
  number: number
  title: string
  children: React.ReactNode
  completed?: boolean
}) {
  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-2">
        <div className={cn(
          "w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-bold shrink-0 transition-colors",
          completed 
            ? "bg-emerald-500/15 text-emerald-500" 
            : "bg-primary/10 text-primary"
        )}>
          {completed ? <Check className="w-3.5 h-3.5" /> : number}
        </div>
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          {title}
        </label>
      </div>
      {children}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
export function ReportPanel({
  pickedLocation,
  pickingLocation,
  onRequestPick,
  onCancelPick,
  onReportSubmitted,
  onFocusReport,
  onViewDiscussion,
}: ReportPanelProps) {
  const supabase = createClient()
  const [view, setView] = useState<PanelView>("list")
  const [reports, setReports] = useState<MapReport[]>([])
  const [isLoadingReports, setIsLoadingReports] = useState(true)

  // Form state
  const [selectedCategory, setSelectedCategory] = useState("")
  const [description, setDescription] = useState("")
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageUploadError, setImageUploadError] = useState<string | null>(null)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [lastPostId, setLastPostId] = useState<string | null>(null)

  const dropdownRef = useRef<HTMLDivElement>(null)

  const MAX_REPORT_IMAGE_BYTES = 5 * 1024 * 1024

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowCategoryDropdown(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const fetchReports = useCallback(async () => {
    try {
      const response = await fetch('/api/reports')
      const result = await response.json()
      if (!response.ok) {
        console.error('Error fetching map reports:', result)
        return
      }
      setReports(result.reports ?? [])
    } catch (error) {
      console.error('Error fetching map reports:', error)
    } finally {
      setIsLoadingReports(false)
    }
  }, [])

  useEffect(() => {
    fetchReports()

    let channel: any = null
    try {
      channel = supabase
        .channel("report_panel_realtime")
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "map_reports" }, () => {
          fetchReports()
        })
        .on("postgres_changes", { event: "DELETE", schema: "public", table: "map_reports" }, (payload) => {
          setReports((prev) => prev.filter((r) => r.id !== payload.old.id))
        })
        .subscribe()
    } catch (error) {
      console.warn('Failed to set up realtime:', error)
    }

    return () => {
      if (channel) supabase.removeChannel(channel)
    }
  }, [fetchReports, supabase])

  useEffect(() => {
    if (!imageFile) {
      setImagePreview(null)
      return
    }
    const objectUrl = URL.createObjectURL(imageFile)
    setImagePreview(objectUrl)
    return () => URL.revokeObjectURL(objectUrl)
  }, [imageFile])

  function handleImageChange(event: React.ChangeEvent<HTMLInputElement>) {
    setImageUploadError(null)
    const file = event.target.files?.[0]
    if (!file) {
      setImageFile(null)
      return
    }
    if (!file.type.startsWith("image/")) {
      setImageUploadError("Solo se aceptan imágenes.")
      setImageFile(null)
      return
    }
    if (file.size > MAX_REPORT_IMAGE_BYTES) {
      setImageUploadError("Máximo 5 MB.")
      setImageFile(null)
      return
    }
    setImageFile(file)
  }

  function openForm() {
    setView("form")
    setSubmitSuccess(false)
    setLastPostId(null)
    setSelectedCategory("")
    setDescription("")
    setImageFile(null)
    setImageUploadError(null)
  }

  function closeForm() {
    setView("list")
    onCancelPick()
    setSubmitSuccess(false)
    setLastPostId(null)
    setImageFile(null)
    setImageUploadError(null)
  }

  async function submitReport() {
    if (!pickedLocation || !selectedCategory || !description.trim()) return
    setIsSubmitting(true)
    setImageUploadError(null)

    const categoryData = getCategoryMeta(selectedCategory)
    const forumCategory = categoryData?.forumCategory || "general"

    try {
      let imageUrl: string | undefined

      if (imageFile) {
        setIsUploadingImage(true)
        try {
          const payload = new FormData()
          payload.append('file', imageFile)
          const response = await fetch('/api/reports/upload-image', {
            method: 'POST',
            body: payload,
          })
          const result = await response.json()
          if (!response.ok || !result.publicUrl) {
            throw new Error(result.error || 'Error subiendo imagen.')
          }
          imageUrl = result.publicUrl
        } catch (error) {
          setImageUploadError(error instanceof Error ? error.message : "Error subiendo imagen.")
          return
        } finally {
          setIsUploadingImage(false)
        }
      }

      const reportPayload: Record<string, unknown> = {
        latitude: pickedLocation.lat,
        longitude: pickedLocation.lng,
        category: selectedCategory,
        description: description.trim(),
      }
      if (imageUrl) reportPayload.image_url = imageUrl

      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reportPayload),
      })
      const result = await response.json()

      if (!response.ok) {
        setImageUploadError(result.error || 'Error al crear reporte.')
        return
      }

      if (result.post?.id) setLastPostId(result.post.id)
      setSubmitSuccess(true)
      onReportSubmitted()
      await fetchReports()
    } catch (error) {
      setImageUploadError(error instanceof Error ? error.message : 'Error inesperado.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectedCategoryData = REPORT_CATEGORIES.find((c) => c.id === selectedCategory)
  const canSubmit = pickedLocation && selectedCategory && description.trim() && !isSubmitting && !isUploadingImage

  return (
    <aside className="w-full lg:w-80 xl:w-96 shrink-0 flex flex-col bg-card h-full overflow-hidden">
      {/* VIEW: LIST */}
      {view === "list" && (
        <>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-border/50 shrink-0 bg-card/95 backdrop-blur-sm sticky top-0 z-10">
            <div>
              <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                Reportes activos
              </h2>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {isLoadingReports ? "Cargando..." : `${reports.length} en el mapa`}
              </p>
            </div>
            <Button
              size="sm"
              onClick={openForm}
              className="gap-1.5 h-9 px-3.5 text-xs font-semibold rounded-xl bg-destructive hover:bg-destructive/90 text-destructive-foreground shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              Publicar
            </Button>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto">
            <div className="p-3">
              {/* Stats */}
              {!isLoadingReports && reports.length > 0 && <StatsCard reports={reports} />}

              {isLoadingReports ? (
                <div className="space-y-3 py-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="p-4 rounded-xl bg-muted/30 animate-pulse space-y-3">
                      <div className="flex gap-3">
                        <div className="w-10 h-10 rounded-xl bg-muted shrink-0" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-muted rounded w-24" />
                          <div className="h-3 bg-muted rounded w-full" />
                          <div className="h-3 bg-muted rounded w-2/3" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : reports.length === 0 ? (
                <div className="flex flex-col items-center gap-4 py-12 px-6 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center border border-border/30">
                    <MapPin className="w-8 h-8 text-muted-foreground/40" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground mb-1">Sin reportes todavía</p>
                    <p className="text-xs text-muted-foreground leading-relaxed max-w-[200px]">
                      Sé el primero en reportar un incidente en el mapa de Durango.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={openForm}
                    className="gap-1.5 rounded-xl h-9"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Crear reporte
                  </Button>
                </div>
              ) : (
                <div className="space-y-1">
                  {reports.map((report) => (
                    <ReportCard
                      key={report.id}
                      report={report}
                      onFocus={onFocusReport}
                      onViewDiscussion={onViewDiscussion}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* VIEW: FORM */}
      {view === "form" && (
        <>
          {/* Form header */}
          <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border/50 shrink-0 bg-card/95 backdrop-blur-sm sticky top-0 z-10">
            <button
              onClick={closeForm}
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground active:scale-95"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h2 className="text-sm font-bold text-foreground">Nuevo reporte</h2>
              <p className="text-[11px] text-muted-foreground">Anónimo y público</p>
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto">
            <div className="p-4 space-y-5">
              {submitSuccess ? (
                /* SUCCESS STATE */
                <div className="flex flex-col items-center gap-5 py-10 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shadow-sm">
                    <Check className="w-8 h-8 text-emerald-500" />
                  </div>
                  <div>
                    <p className="font-bold text-foreground text-base">¡Reporte publicado!</p>
                    <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed max-w-[240px]">
                      Tu reporte ya aparece en el mapa y se creó una discusión en el foro.
                    </p>
                  </div>
                  <div className="flex flex-col gap-2.5 w-full max-w-[280px]">
                    {lastPostId && (
                      <Button
                        onClick={() => onViewDiscussion(lastPostId)}
                        className="gap-2 w-full rounded-xl h-11 font-semibold"
                      >
                        <MessageSquare className="w-4 h-4" />
                        Ver discusión
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      onClick={closeForm}
                      className="w-full rounded-xl h-11"
                    >
                      Volver al mapa
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  {/* STEP 1: LOCATION */}
                  <FormStep 
                    number={1} 
                    title="Ubicación en el mapa" 
                    completed={!!pickedLocation}
                  >
                    {pickedLocation ? (
                      <div className="flex items-center gap-3 bg-emerald-500/8 border border-emerald-500/20 rounded-xl px-3.5 py-3">
                        <div className="w-9 h-9 rounded-lg bg-emerald-500/15 flex items-center justify-center shrink-0">
                          <Check className="w-4 h-4 text-emerald-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-foreground">Ubicación marcada</p>
                          <p className="text-[11px] text-muted-foreground font-mono truncate">
                            {pickedLocation.lat.toFixed(5)}, {pickedLocation.lng.toFixed(5)}
                          </p>
                        </div>
                        <button
                          onClick={onRequestPick}
                          className="text-[11px] text-primary hover:text-primary/80 font-medium shrink-0 px-2 py-1 rounded-lg hover:bg-primary/5 transition-colors"
                        >
                          Cambiar
                        </button>
                      </div>
                    ) : pickingLocation ? (
                      <div className="flex items-center gap-3 bg-primary/8 border border-primary/20 rounded-xl px-3.5 py-3 animate-pulse">
                        <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
                          <MapPin className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-foreground">Selecciona en el mapa</p>
                          <p className="text-[11px] text-muted-foreground">Toca la ubicación del incidente</p>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={onRequestPick}
                        className="w-full flex items-center gap-3 bg-secondary hover:bg-secondary/80 border border-border hover:border-primary/30 rounded-xl px-3.5 py-3.5 transition-all text-left group active:scale-[0.98]"
                      >
                        <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                          <MapPin className="w-5 h-5 text-destructive" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-foreground">Marcar en el mapa</p>
                          <p className="text-[11px] text-muted-foreground">Toca para seleccionar ubicación</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-muted-foreground/60 group-hover:translate-x-0.5 transition-all" />
                      </button>
                    )}
                  </FormStep>

                  {/* STEP 2: CATEGORY */}
                  <FormStep 
                    number={2} 
                    title="Tipo de incidente" 
                    completed={!!selectedCategory}
                  >
                    <div className="relative" ref={dropdownRef}>
                      <button
                        type="button"
                        onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                        className={cn(
                          "w-full flex items-center justify-between bg-secondary border border-border rounded-xl px-3.5 py-3 text-sm text-left hover:border-primary/30 transition-all active:scale-[0.99]",
                          showCategoryDropdown && "border-primary/40 ring-2 ring-primary/10"
                        )}
                      >
                        {selectedCategoryData ? (
                          <span className="flex items-center gap-2.5">
                            <div 
                              className="w-8 h-8 rounded-lg flex items-center justify-center"
                              style={{ backgroundColor: `${selectedCategoryData.color}15` }}
                            >
                              <selectedCategoryData.icon className="w-4 h-4" style={{ color: selectedCategoryData.color }} />
                            </div>
                            <span className="font-medium text-foreground">{selectedCategoryData.label}</span>
                          </span>
                        ) : (
                          <span className="text-muted-foreground">Selecciona una categoría</span>
                        )}
                        <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform duration-200", showCategoryDropdown && "rotate-180")} />
                      </button>

                      {showCategoryDropdown && (
                        <div className="absolute top-full left-0 right-0 mt-1.5 bg-popover border border-border rounded-xl shadow-xl shadow-black/10 overflow-hidden z-20 max-h-72 overflow-y-auto">
                          <div className="p-1.5 space-y-0.5">
                            {REPORT_CATEGORIES.map((cat) => (
                              <button
                                key={cat.id}
                                type="button"
                                onClick={() => { setSelectedCategory(cat.id); setShowCategoryDropdown(false) }}
                                className={cn(
                                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                                  selectedCategory === cat.id 
                                    ? "bg-primary/8 text-primary font-medium" 
                                    : "text-foreground hover:bg-secondary"
                                )}
                              >
                                <div 
                                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                                  style={{ backgroundColor: `${cat.color}12` }}
                                >
                                  <cat.icon className="w-4 h-4" style={{ color: cat.color }} />
                                </div>
                                <span className="flex-1 text-left">{cat.label}</span>
                                {selectedCategory === cat.id && (
                                  <Check className="w-4 h-4 text-primary" />
                                )}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </FormStep>

                  {/* STEP 3: DESCRIPTION */}
                  <FormStep 
                    number={3} 
                    title="Descripción" 
                    completed={description.trim().length > 0}
                  >
                    <div className="relative">
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Describe brevemente lo que ocurrió en ese lugar..."
                        className="w-full bg-secondary border border-border rounded-xl px-3.5 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all leading-relaxed"
                        rows={4}
                        maxLength={280}
                      />
                      <div className="flex items-center justify-between mt-1.5 px-1">
                        <p className="text-[10px] text-muted-foreground/60">
                          Mín. 10 caracteres recomendado
                        </p>
                        <p className={cn(
                          "text-[11px] font-medium tabular-nums transition-colors",
                          description.length >= 250 ? "text-amber-500" : "text-muted-foreground/50"
                        )}>
                          {description.length}/280
                        </p>
                      </div>
                    </div>
                  </FormStep>

                  {/* STEP 4: IMAGE */}
                  <div className="space-y-3 rounded-2xl border border-border/60 bg-secondary/40 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Camera className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground">Foto opcional</p>
                          <p className="text-[11px] text-muted-foreground">
                            Añade una imagen para ilustrar el incidente
                          </p>
                        </div>
                      </div>
                      <label
                        htmlFor="report-image-upload"
                        className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs font-medium text-foreground hover:bg-secondary transition-colors cursor-pointer shrink-0 active:scale-95"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        {imageFile ? "Cambiar" : "Seleccionar"}
                      </label>
                    </div>

                    <input
                      id="report-image-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageChange}
                    />

                    {imagePreview && (
                      <div className="relative overflow-hidden rounded-xl border border-border bg-black/5 shadow-sm group">
                        <img
                          src={imagePreview}
                          alt="Vista previa"
                          className="w-full h-40 sm:h-48 object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="absolute bottom-0 left-0 right-0 p-3 flex items-center justify-between bg-gradient-to-t from-black/50 to-transparent">
                          <span className="text-xs text-white/90 truncate max-w-[200px]">{imageFile?.name}</span>
                          <button
                            type="button"
                            onClick={() => setImageFile(null)}
                            className="w-7 h-7 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30 transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}

                    {imageUploadError && (
                      <div className="flex items-center gap-2 text-xs text-destructive bg-destructive/5 rounded-lg px-3 py-2.5 border border-destructive/10">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        {imageUploadError}
                      </div>
                    )}

                    <p className="text-[11px] text-muted-foreground/60">
                      Máx. 5 MB • Formatos: JPG, PNG, WebP
                    </p>
                  </div>

                  {/* Privacy Notice */}
                  <div className="flex items-start gap-3 bg-primary/5 rounded-xl p-3.5 border border-primary/10">
                    <Shield className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Tu reporte se publicará de forma <span className="font-semibold text-foreground">anónima</span> y creará automáticamente una discusión en el foro comunitario.
                    </p>
                  </div>

                  {/* Submit */}
                  <Button
                    onClick={submitReport}
                    disabled={!canSubmit}
                    className={cn(
                      "w-full gap-2 rounded-xl h-11 font-semibold text-sm transition-all",
                      canSubmit
                        ? "bg-destructive hover:bg-destructive/90 text-destructive-foreground shadow-sm shadow-destructive/20 active:scale-[0.98]"
                        : "bg-muted text-muted-foreground cursor-not-allowed"
                    )}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Publicando...
                      </>
                    ) : isUploadingImage ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Subiendo imagen...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Publicar reporte
                      </>
                    )}
                  </Button>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </aside>
  )
}
