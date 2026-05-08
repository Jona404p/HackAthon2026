"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
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

  const MAX_REPORT_IMAGE_BYTES = 5 * 1024 * 1024

  const fetchReports = useCallback(async () => {
    try {
      const response = await fetch('/api/reports')
      const result = await response.json()

      if (!response.ok) {
        console.error('Error fetching map reports from API:', result)
        setIsLoadingReports(false)
        return
      }

      setReports(result.reports ?? [])
    } catch (error) {
      console.error('Error fetching map reports from API:', error)
    } finally {
      setIsLoadingReports(false)
    }
  }, [])

  useEffect(() => {
    fetchReports()

    // Set up realtime subscription with error handling
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
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('Realtime subscription active for reports')
          } else if (status === 'CHANNEL_ERROR') {
            console.warn('Realtime subscription failed for reports')
          }
        })
    } catch (error) {
      console.warn('Failed to set up realtime subscription:', error)
    }

    return () => {
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [fetchReports, supabase])

  useEffect(() => {
    if (!imageFile) {
      setImagePreview(null)
      return
    }

    const objectUrl = URL.createObjectURL(imageFile)
    setImagePreview(objectUrl)

    return () => {
      URL.revokeObjectURL(objectUrl)
    }
  }, [imageFile])

  function handleImageChange(event: React.ChangeEvent<HTMLInputElement>) {
    setImageUploadError(null)
    const file = event.target.files?.[0]
    if (!file) {
      setImageFile(null)
      return
    }

    if (!file.type.startsWith("image/")) {
      setImageUploadError("Solo se aceptan imágenes en formatos válidos.")
      setImageFile(null)
      return
    }

    if (file.size > MAX_REPORT_IMAGE_BYTES) {
      setImageUploadError("El archivo debe ser menor a 5 MB.")
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
            throw new Error(result.error || 'Error subiendo la imagen.')
          }

          imageUrl = result.publicUrl
        } catch (error) {
          setImageUploadError(
            error instanceof Error
              ? error.message
              : "No se pudo subir la imagen. Intenta de nuevo."
          )
          return
        } finally {
          setIsUploadingImage(false)
        }
      }

      try {
        const reportPayload: Record<string, unknown> = {
          latitude: pickedLocation.lat,
          longitude: pickedLocation.lng,
          category: selectedCategory,
          description: description.trim(),
        }

        // Solo incluir image_url si se subió correctamente
        if (imageUrl) {
          reportPayload.image_url = imageUrl
        }

        const response = await fetch('/api/reports', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(reportPayload),
        })

        const result = await response.json()

        if (!response.ok) {
          console.error("[v0] API error:", result.error, result.details)
          setImageUploadError(result.error || 'Error al crear el reporte.')
          setIsSubmitting(false)
          return
        }

        if (result.post?.id) {
          setLastPostId(result.post.id)
        }
      } catch (error) {
        console.error("[v0] Error creating report:", error)
        setImageUploadError(
          error instanceof Error ? error.message : 'Error al crear el reporte.'
        )
        setIsSubmitting(false)
        return
      }
      setSubmitSuccess(true)
      onReportSubmitted()
      await fetchReports()
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectedCategoryData = REPORT_CATEGORIES.find((c) => c.id === selectedCategory)

  return (
    <aside className="w-80 shrink-0 flex flex-col border-l border-border bg-card overflow-hidden">
      {/* -------------------------------------------------------- */}
      {/* VIEW: LIST                                               */}
      {/* -------------------------------------------------------- */}
      {view === "list" && (
        <>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-border shrink-0">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Reportes activos</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isLoadingReports ? "Cargando..." : `${reports.length} en el mapa`}
              </p>
            </div>
            <Button
              size="sm"
              onClick={openForm}
              className="gap-1.5 h-8 px-3 text-xs bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              <Plus className="w-3.5 h-3.5" />
              Publicar
            </Button>
          </div>

          {/* Report list */}
          <ScrollArea className="flex-1">
            {isLoadingReports ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : reports.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-16 px-6 text-center">
                <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Sin reportes todavia</p>
                  <p className="text-xs text-muted-foreground mt-1">Se el primero en reportar un incidente en el mapa.</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={openForm}
                  className="gap-1.5 mt-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Crear reporte
                </Button>
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {reports.map((report) => {
                  const cat = getCategoryMeta(report.category)
                  const isRecent = Date.now() - new Date(report.created_at).getTime() < 60 * 60 * 1000
                  return (
                    <li key={report.id}>
                      <button
                        onClick={() => onFocusReport(report.latitude, report.longitude, 17)}
                        className="w-full text-left px-4 py-3.5 hover:bg-secondary/50 transition-colors group"
                      >
                        <div className="flex items-start gap-3">
                          {/* Category color dot */}
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                            style={{ backgroundColor: `${cat.color}20` }}
                          >
                            <cat.icon className="w-4 h-4" style={{ color: cat.color }} />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span className="text-xs font-semibold text-foreground">{cat.label}</span>
                              {isRecent && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-destructive/15 text-destructive text-[10px] font-medium">
                                  <span className="w-1 h-1 rounded-full bg-destructive animate-pulse" />
                                  Nuevo
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                              {report.description}
                            </p>
                            
                            {/* Image preview */}
                            {report.anonymous_posts?.image_url && (
                              <div className="mt-2 rounded-lg overflow-hidden border border-border/50 bg-muted/30">
                                <img
                                  src={`/api/image?url=${encodeURIComponent(report.anonymous_posts.image_url)}`}
                                  alt="Imagen del reporte"
                                  className="w-full h-24 object-cover"
                                />
                              </div>
                            )}
                            
                            <div className="flex items-center gap-2 mt-1.5">
                              <span className="flex items-center gap-1 text-[10px] text-muted-foreground/60">
                                <Clock className="w-3 h-3" />
                                {formatTime(report.created_at)}
                              </span>
                              <span className="flex items-center gap-1 text-[10px] text-muted-foreground/60">
                                <Navigation className="w-3 h-3" />
                                {report.latitude.toFixed(4)}, {report.longitude.toFixed(4)}
                              </span>
                              {report.anonymous_posts?.image_url && (
                                <span className="flex items-center gap-1 text-[10px] text-sky-500">
                                  <Camera className="w-3 h-3" />
                                  Foto
                                </span>
                              )}
                            </div>
                          </div>

                          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0 mt-1 group-hover:text-muted-foreground transition-colors" />
                        </div>

                        {/* Forum link */}
                        {report.post_id && (
                          <div
                            onClick={(e) => {
                              e.stopPropagation()
                              onViewDiscussion(report.post_id!)
                            }}
                            className="mt-2.5 ml-11 flex items-center gap-1.5 text-[11px] text-primary hover:underline cursor-pointer"
                          >
                            <MessageSquare className="w-3 h-3" />
                            Ver discusion en el foro
                          </div>
                        )}
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </ScrollArea>
        </>
      )}

      {/* -------------------------------------------------------- */}
      {/* VIEW: FORM                                               */}
      {/* -------------------------------------------------------- */}
      {view === "form" && (
        <>
          {/* Form header */}
          <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border shrink-0">
            <button
              onClick={closeForm}
              className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h2 className="text-sm font-semibold text-foreground">Nuevo reporte</h2>
              <p className="text-xs text-muted-foreground">Anonimo y publico</p>
            </div>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-4 space-y-4">
              {submitSuccess ? (
                /* ---- SUCCESS STATE ---- */
                <div className="flex flex-col items-center gap-4 py-8 text-center">
                  <div className="w-14 h-14 rounded-full bg-success/15 flex items-center justify-center">
                    <Check className="w-7 h-7 text-success" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Reporte publicado</p>
                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                      Tu reporte ya aparece en el mapa y se creo una discusion en el foro.
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 w-full">
                    {lastPostId && (
                      <Button
                        onClick={() => onViewDiscussion(lastPostId)}
                        className="gap-2 w-full"
                      >
                        <MessageSquare className="w-4 h-4" />
                        Ver discusion en el foro
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      onClick={closeForm}
                      className="w-full"
                    >
                      Volver al mapa
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  {/* ---- STEP 1: LOCATION ---- */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      1. Ubicacion en el mapa
                    </label>
                    {pickedLocation ? (
                      <div className="flex items-center gap-2 bg-success/10 border border-success/25 rounded-lg px-3 py-2.5">
                        <Check className="w-4 h-4 text-success shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-foreground">Ubicacion marcada</p>
                          <p className="text-[11px] text-muted-foreground font-mono truncate">
                            {pickedLocation.lat.toFixed(5)}, {pickedLocation.lng.toFixed(5)}
                          </p>
                        </div>
                        <button
                          onClick={onRequestPick}
                          className="text-[11px] text-primary hover:underline shrink-0"
                        >
                          Cambiar
                        </button>
                      </div>
                    ) : pickingLocation ? (
                      <div className="flex items-center gap-2 bg-primary/10 border border-primary/25 rounded-lg px-3 py-2.5 animate-pulse">
                        <MapPin className="w-4 h-4 text-primary shrink-0" />
                        <p className="text-xs text-foreground font-medium">Haz clic en el mapa...</p>
                      </div>
                    ) : (
                      <button
                        onClick={onRequestPick}
                        className="w-full flex items-center gap-3 bg-secondary hover:bg-secondary/80 border border-border hover:border-primary/40 rounded-lg px-3 py-3 transition-colors text-left group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-destructive/15 flex items-center justify-center shrink-0">
                          <MapPin className="w-4 h-4 text-destructive" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">Marcar en el mapa</p>
                          <p className="text-xs text-muted-foreground">Haz clic para seleccionar ubicacion</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground/40 ml-auto group-hover:text-muted-foreground transition-colors" />
                      </button>
                    )}
                  </div>

                  {/* ---- STEP 2: CATEGORY ---- */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      2. Tipo de incidente
                    </label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                        className={cn(
                          "w-full flex items-center justify-between bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm text-left hover:border-primary/40 transition-colors",
                          showCategoryDropdown && "border-primary/40"
                        )}
                      >
                        {selectedCategoryData ? (
                          <span className="flex items-center gap-2">
                            <selectedCategoryData.icon className="w-4 h-4 shrink-0" style={{ color: selectedCategoryData.color }} />
                            <span className="text-foreground">{selectedCategoryData.label}</span>
                          </span>
                        ) : (
                          <span className="text-muted-foreground">Selecciona una categoria</span>
                        )}
                        <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform", showCategoryDropdown && "rotate-180")} />
                      </button>

                      {showCategoryDropdown && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-lg shadow-xl overflow-hidden z-20">
                          {REPORT_CATEGORIES.map((cat) => (
                            <button
                              key={cat.id}
                              type="button"
                              onClick={() => { setSelectedCategory(cat.id); setShowCategoryDropdown(false) }}
                              className={cn(
                                "w-full flex items-center gap-3 px-3 py-2.5 text-sm text-foreground hover:bg-secondary transition-colors",
                                selectedCategory === cat.id && "bg-secondary"
                              )}
                            >
                              <cat.icon className="w-4 h-4 shrink-0" style={{ color: cat.color }} />
                              {cat.label}
                              {selectedCategory === cat.id && (
                                <Check className="w-3.5 h-3.5 ml-auto text-primary" />
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ---- STEP 3: DESCRIPTION ---- */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      3. Descripcion
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Describe brevemente lo que ocurrio en ese lugar..."
                      className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all leading-relaxed"
                      rows={4}
                      maxLength={280}
                    />
                    <p className="text-[11px] text-muted-foreground text-right">{description.length}/280</p>
                  </div>

                  {/* ---- STEP 4: IMAGE ---- */}
                  <div className="space-y-3 rounded-2xl border border-border/70 bg-secondary/60 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-foreground">Foto opcional</p>
                        <p className="text-xs text-muted-foreground">
                          Añade una imagen para ilustrar el incidente.
                        </p>
                      </div>
                      <label
                        htmlFor="report-image-upload"
                        className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-secondary transition-colors cursor-pointer"
                      >
                        <Camera className="w-4 h-4" />
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
                      <div className="overflow-hidden rounded-2xl border border-border bg-black/5 shadow-sm">
                        <img
                          src={imagePreview}
                          alt="Vista previa de imagen del reporte"
                          className="w-full h-40 object-cover"
                        />
                        <div className="flex items-center justify-between gap-2 p-3 bg-background/80">
                          <span className="text-xs text-muted-foreground truncate">{imageFile?.name}</span>
                          <button
                            type="button"
                            onClick={() => setImageFile(null)}
                            className="text-xs text-destructive hover:text-destructive-foreground"
                          >
                            Eliminar
                          </button>
                        </div>
                      </div>
                    )}

                    {imageUploadError && (
                      <p className="text-xs text-destructive">{imageUploadError}</p>
                    )}

                    <p className="text-xs text-muted-foreground">
                      Máx. 5 MB. La imagen se usa solo como referencia y se guardará de forma anónima.
                    </p>
                  </div>

                  {/* Forum notice */}
                  <div className="flex items-start gap-2.5 bg-primary/8 rounded-lg p-3 border border-primary/15">
                    <Shield className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Tu reporte se publicara de forma <span className="font-medium text-foreground">anonima</span> y creara automaticamente una discusion en el foro comunitario.
                    </p>
                  </div>

                  {/* Submit */}
                  <Button
                    onClick={submitReport}
                    disabled={!pickedLocation || !selectedCategory || !description.trim() || isSubmitting || isUploadingImage}
                    className="w-full gap-2 bg-destructive hover:bg-destructive/90 text-destructive-foreground"
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
          </ScrollArea>
        </>
      )}
    </aside>
  )
}
