"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  MessageSquare,
  Send,
  Shield,
  Clock,
  Users,
  AlertTriangle,
  MapPin,
  Bus,
  Heart,
  GraduationCap,
  Building2,
  Briefcase,
  Leaf,
  Droplets,
  Zap,
  ChevronDown,
  ChevronUp,
  Filter,
  X,
  RefreshCw,
  Lock,
  ChevronRight,
  Map,
  ExternalLink,
} from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { useSearchParams } from "next/navigation"

interface Comment {
  id: string
  post_id: string
  content: string
  created_at: string
}

interface Post {
  id: string
  content: string
  category: string
  created_at: string
  comment_count: number
  map_report_id?: string
  image_url?: string | null
}

interface MapReportInfo {
  id: string
  latitude: number
  longitude: number
  category: string
}

const CATEGORIES = [
  { value: "seguridad",    label: "Seguridad",      icon: Shield,        color: "bg-red-500/15 text-red-400 border-red-500/25" },
  { value: "transporte",   label: "Transporte",     icon: Bus,           color: "bg-blue-500/15 text-blue-400 border-blue-500/25" },
  { value: "alerta",       label: "Alerta",         icon: AlertTriangle, color: "bg-yellow-500/15 text-yellow-400 border-yellow-500/25" },
  { value: "zona",         label: "Zona",           icon: MapPin,        color: "bg-green-500/15 text-green-400 border-green-500/25" },
  { value: "salud",        label: "Salud",          icon: Heart,         color: "bg-pink-500/15 text-pink-400 border-pink-500/25" },
  { value: "educacion",    label: "Educacion",      icon: GraduationCap, color: "bg-purple-500/15 text-purple-400 border-purple-500/25" },
  { value: "gobierno",     label: "Gobierno",       icon: Building2,     color: "bg-orange-500/15 text-orange-400 border-orange-500/25" },
  { value: "empleo",       label: "Empleo",         icon: Briefcase,     color: "bg-cyan-500/15 text-cyan-400 border-cyan-500/25" },
  { value: "ambiente",     label: "Medio Ambiente", icon: Leaf,          color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25" },
  { value: "agua",         label: "Agua",           icon: Droplets,      color: "bg-sky-500/15 text-sky-400 border-sky-500/25" },
  { value: "electricidad", label: "Electricidad",   icon: Zap,           color: "bg-amber-500/15 text-amber-400 border-amber-500/25" },
  { value: "general",      label: "General",        icon: MessageSquare, color: "bg-muted/60 text-muted-foreground border-border" },
]

function getCategoryMeta(value: string) {
  return CATEGORIES.find((c) => c.value === value) ?? CATEGORIES[CATEGORIES.length - 1]
}

function formatTimeAgo(dateString: string): string {
  const diff = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000)
  if (diff < 60) return "Hace un momento"
  if (diff < 3600) return `Hace ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `Hace ${Math.floor(diff / 3600)} h`
  return `Hace ${Math.floor(diff / 86400)} d`
}

// ---------------------------------------------------------------------------
// CommentSection
// ---------------------------------------------------------------------------
function CommentSection({
  post,
  onCommentAdded,
  autoOpen = false,
}: {
  post: Post
  onCommentAdded: (postId: string) => void
  autoOpen?: boolean
}) {
  const supabase = createClient()
  const [isOpen, setIsOpen] = useState(autoOpen)
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState("")
  const [isLoadingComments, setIsLoadingComments] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (autoOpen) {
      loadComments()
    }
  }, [autoOpen])

  async function loadComments() {
    setIsLoadingComments(true)
    const { data, error } = await supabase
      .from("anonymous_comments")
      .select("*")
      .eq("post_id", post.id)
      .order("created_at", { ascending: true })

    if (!error && data) setComments(data)
    setIsLoadingComments(false)
  }

  function handleToggle() {
    const opening = !isOpen
    setIsOpen(opening)
    if (opening && comments.length === 0) loadComments()
  }

  async function handleSubmitComment(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = newComment.trim()
    if (!trimmed || isSubmitting) return

    setIsSubmitting(true)
    setError(null)

    const { data, error } = await supabase
      .from("anonymous_comments")
      .insert({ post_id: post.id, content: trimmed })
      .select()
      .single()

    if (error) {
      setError("No se pudo enviar. Intenta de nuevo.")
    } else if (data) {
      setComments((prev) => [...prev, data])
      setNewComment("")
      onCommentAdded(post.id)
    }
    setIsSubmitting(false)
  }

  return (
    <div className="mt-4 pt-4 border-t border-border/50">
      <button
        onClick={handleToggle}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <MessageSquare className="w-4 h-4 shrink-0" />
        <span>
          {post.comment_count} comentario{post.comment_count !== 1 ? "s" : ""}
        </span>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 ml-1" />
        ) : (
          <ChevronDown className="w-4 h-4 ml-1" />
        )}
      </button>

      {isOpen && (
        <div className="mt-4 space-y-3">
          {isLoadingComments ? (
            <div className="space-y-2">
              {[1, 2].map((i) => (
                <div key={i} className="h-12 bg-muted/30 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : (
            <>
              {comments.length > 0 && (
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {comments.map((comment) => (
                    <div
                      key={comment.id}
                      className="flex gap-2.5 bg-muted/30 rounded-lg p-3"
                    >
                      <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
                        <Lock className="w-3 h-3 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground leading-relaxed">
                          {comment.content}
                        </p>
                        <span className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatTimeAgo(comment.created_at)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {comments.length === 0 && (
                <p className="text-sm text-muted-foreground py-2">
                  Sin comentarios todavia. Se el primero.
                </p>
              )}

              {error && (
                <p className="text-xs text-destructive">{error}</p>
              )}

              <form onSubmit={handleSubmitComment} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Comentario anonimo..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  maxLength={300}
                  className="flex-1 min-w-0 bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-shadow"
                />
                <Button
                  type="submit"
                  size="sm"
                  disabled={!newComment.trim() || isSubmitting}
                  className="shrink-0"
                >
                  {isSubmitting ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </form>
            </>
          )}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// AnonymousForum
// ---------------------------------------------------------------------------
export function AnonymousForum({ initialPostId }: { initialPostId?: string } = {}) {
  const supabase = createClient()
  const searchParams = useSearchParams()
  const highlightPostId = initialPostId || searchParams.get("post")
  const highlightedRef = useRef<HTMLDivElement>(null)

  const [posts, setPosts] = useState<Post[]>([])
  const [mapReports, setMapReports] = useState<Record<string, MapReportInfo>>({})
  const [filterCategory, setFilterCategory] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchPosts = useCallback(async () => {
    setIsLoading(true)

    const { data: postsData, error } = await supabase
      .from("anonymous_posts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100)

    if (!error && postsData && postsData.length > 0) {
      const ids = postsData.map((p) => p.id)

      const { data: commentRows } = await supabase
        .from("anonymous_comments")
        .select("post_id")
        .in("post_id", ids)

      const countMap: Record<string, number> = {}
      commentRows?.forEach((r) => {
        countMap[r.post_id] = (countMap[r.post_id] ?? 0) + 1
      })

      setPosts(
        postsData.map((p) => ({ ...p, comment_count: countMap[p.id] ?? 0 }))
      )

      // Fetch map report info for posts that have one
      const mapReportIds = postsData
        .filter((p) => p.map_report_id)
        .map((p) => p.map_report_id)

      if (mapReportIds.length > 0) {
        const { data: reportData } = await supabase
          .from("map_reports")
          .select("id, latitude, longitude, category")
          .in("id", mapReportIds)

        if (reportData) {
          const reportMap: Record<string, MapReportInfo> = {}
          reportData.forEach((r) => {
            reportMap[r.id] = r
          })
          setMapReports(reportMap)
        }
      }
    } else if (!error) {
      setPosts([])
    }

    setIsLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchPosts()

    // Realtime: cuando llegue un nuevo post de otro usuario, refrescamos
    const channel = supabase
      .channel("forum-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "anonymous_posts" },
        () => { fetchPosts() }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [fetchPosts])

  // Scroll to highlighted post
  useEffect(() => {
    if (highlightPostId && !isLoading && highlightedRef.current) {
      setTimeout(() => {
        highlightedRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
      }, 100)
    }
  }, [highlightPostId, isLoading])

  // Cuando un comentario se agrega, incrementar el contador local sin refrescar todo
  function handleCommentAdded(postId: string) {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId ? { ...p, comment_count: p.comment_count + 1 } : p
      )
    )
  }

  const filteredPosts = filterCategory
    ? posts.filter((p) => p.category === filterCategory)
    : posts

  return (
    <div className="w-full max-w-2xl mx-auto px-4">
      {/* ------------------------------------------------------------------ */}
      {/* Header                                                               */}
      {/* ------------------------------------------------------------------ */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 mb-4">
          <Users className="w-7 h-7 text-primary" />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground mb-2">
          Reporte Social
        </h1>
        <p className="text-muted-foreground max-w-md mx-auto text-sm leading-relaxed">
          Espacio seguro y anonimo para reportar lo que pasa en Durango. Sin registro. Sin rastreo.
        </p>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Privacy Notice                                                       */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 mb-6">
        <Shield className="w-5 h-5 text-primary shrink-0" />
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-primary">100% Anonimo.</span> No
          recolectamos IP, cookies ni datos personales de ningun tipo.
        </p>
      </div>

      {/* Map Report CTA - Primary action */}
      <Link
        href="/mapa"
        className="flex items-center gap-4 rounded-xl border-2 border-primary/30 bg-primary/5 px-5 py-4 mb-6 hover:bg-primary/10 hover:border-primary/50 transition-all group"
      >
        <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
          <Map className="w-6 h-6 text-primary" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-foreground mb-0.5">
            Reporta un incidente en el mapa
          </p>
          <p className="text-xs text-muted-foreground">
            Marca la ubicacion exacta y se creara automaticamente una discusion aqui
          </p>
        </div>
        <ChevronRight className="w-5 h-5 text-primary opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
      </Link>

      {/* ------------------------------------------------------------------ */}
      {/* Filter Bar                                                           */}
      {/* ------------------------------------------------------------------ */}
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
          <span className="text-sm font-medium text-foreground">Tableros</span>
          {filterCategory && (
            <button
              onClick={() => setFilterCategory(null)}
              className="ml-auto flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              Limpiar
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon
            const active = filterCategory === cat.value
            const count = posts.filter((p) => p.category === cat.value).length
            return (
              <button
                key={cat.value}
                onClick={() => setFilterCategory(active ? null : cat.value)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                  active
                    ? cat.color
                    : "bg-transparent text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
                )}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                {cat.label}
                {count > 0 && (
                  <span className="text-[10px] opacity-60">({count})</span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Posts List                                                           */}
      {/* ------------------------------------------------------------------ */}
      <div className="space-y-3">
        {/* List header */}
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            {filterCategory ? (
              <>
                {(() => {
                  const cat = getCategoryMeta(filterCategory)
                  const Icon = cat.icon
                  return (
                    <>
                      <Icon className="w-4 h-4" />
                      {cat.label}
                    </>
                  )
                })()}
              </>
            ) : (
              <>
                <MessageSquare className="w-4 h-4 text-primary" />
                Publicaciones recientes
              </>
            )}
          </h2>
          <Badge variant="outline" className="text-xs font-normal">
            {filteredPosts.length}{" "}
            {filteredPosts.length !== 1 ? "posts" : "post"}
          </Badge>
        </div>

        {/* Loading skeletons */}
        {isLoading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="h-4 bg-muted rounded w-1/4 mb-3" />
                  <div className="h-4 bg-muted rounded w-full mb-2" />
                  <div className="h-4 bg-muted rounded w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && filteredPosts.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="py-12 flex flex-col items-center gap-4 text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Map className="w-8 h-8 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground mb-1">
                  {filterCategory
                    ? "Sin publicaciones en este tablero"
                    : "Sin reportes todavia"}
                </p>
                <p className="text-xs text-muted-foreground max-w-xs">
                  Los reportes se crean desde el mapa interactivo. Marca una ubicacion para iniciar una discusion.
                </p>
              </div>
              <Link href="/mapa">
                <Button size="sm" className="gap-2">
                  <MapPin className="w-4 h-4" />
                  Ir al mapa
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Post cards */}
        {!isLoading &&
          filteredPosts.map((post) => {
            const cat = getCategoryMeta(post.category)
            const Icon = cat.icon
            const isHighlighted = post.id === highlightPostId
            const mapReport = post.map_report_id ? mapReports[post.map_report_id] : null
            const hasImage = !!post.image_url

            return (
              <Card
                key={post.id}
                ref={isHighlighted ? highlightedRef : undefined}
                className={cn(
                  "transition-all overflow-hidden",
                  isHighlighted
                    ? "border-primary ring-2 ring-primary/20"
                    : "hover:border-primary/30",
                  mapReport && "border-l-4 border-l-blue-500"
                )}
              >
                {/* Image header - shown prominently at the top if available */}
                {hasImage && (
                  <a
                    href={post.image_url!}
                    target="_blank"
                    rel="noreferrer"
                    className="block relative group"
                  >
                    <div className="relative h-48 sm:h-56 overflow-hidden bg-muted/30">
                      <img
                        src={`/api/image?url=${encodeURIComponent(post.image_url!)}`}
                        alt="Imagen del reporte"
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      
                      {/* Category badge overlay on image */}
                      <div className="absolute top-3 left-3">
                        <Badge
                          variant="outline"
                          className={cn("text-xs gap-1.5 font-medium backdrop-blur-sm bg-background/80", cat.color)}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          {cat.label}
                        </Badge>
                      </div>
                      
                      {/* Time badge on image */}
                      <div className="absolute top-3 right-3">
                        <span className="text-[11px] text-white/90 bg-black/40 backdrop-blur-sm rounded-full px-2 py-1 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatTimeAgo(post.created_at)}
                        </span>
                      </div>
                      
                      {/* Map badge on image */}
                      {mapReport && (
                        <div className="absolute bottom-3 left-3">
                          <Badge
                            variant="outline"
                            className="text-xs gap-1 font-medium bg-blue-500/90 text-white border-blue-400/50 backdrop-blur-sm"
                          >
                            <MapPin className="w-3 h-3" />
                            Ver en mapa
                          </Badge>
                        </div>
                      )}
                      
                      {/* View full image hint */}
                      <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-[11px] text-white bg-black/50 backdrop-blur-sm rounded-full px-2.5 py-1 flex items-center gap-1">
                          <ExternalLink className="w-3 h-3" />
                          Ver completa
                        </span>
                      </div>
                    </div>
                  </a>
                )}
                
                <CardContent className={cn("p-4", hasImage && "pt-3")}>
                  {/* Header - only show badges here if no image */}
                  {!hasImage && (
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={cn("text-xs gap-1.5 font-medium", cat.color)}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          {cat.label}
                        </Badge>
                        {mapReport && (
                          <Badge
                            variant="outline"
                            className="text-xs gap-1 font-medium bg-blue-500/15 text-blue-400 border-blue-500/25"
                          >
                            <MapPin className="w-3 h-3" />
                            Mapa
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground flex items-center gap-1 shrink-0">
                        <Clock className="w-3 h-3" />
                        {formatTimeAgo(post.created_at)}
                      </span>
                    </div>
                  )}

                  <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                    {post.content}
                  </p>

                  {/* Map link if from map report */}
                  {mapReport && (
                    <Link
                      href={`/mapa?lat=${mapReport.latitude}&lng=${mapReport.longitude}&zoom=17`}
                      className="inline-flex items-center gap-1.5 mt-3 text-xs text-blue-400 hover:underline"
                    >
                      <Map className="w-3.5 h-3.5" />
                      Ver ubicacion en el mapa
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  )}

                  <CommentSection
                    post={post}
                    onCommentAdded={handleCommentAdded}
                    autoOpen={isHighlighted}
                  />
                </CardContent>
              </Card>
            )
          })}
      </div>
    </div>
  )
}
