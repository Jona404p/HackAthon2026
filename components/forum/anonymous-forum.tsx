"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
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
} from "lucide-react"
import { cn } from "@/lib/utils"

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
}: {
  post: Post
  onCommentAdded: (postId: string) => void
}) {
  const supabase = createClient()
  const [isOpen, setIsOpen] = useState(false)
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState("")
  const [isLoadingComments, setIsLoadingComments] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
export function AnonymousForum() {
  const supabase = createClient()

  const [posts, setPosts] = useState<Post[]>([])
  const [newContent, setNewContent] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("general")
  const [filterCategory, setFilterCategory] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [postError, setPostError] = useState<string | null>(null)
  const [showAllCategories, setShowAllCategories] = useState(false)

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

  async function handleSubmitPost(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = newContent.trim()
    if (!trimmed || isSubmitting) return

    setIsSubmitting(true)
    setPostError(null)

    const { error } = await supabase.from("anonymous_posts").insert({
      content: trimmed,
      category: selectedCategory,
    })

    if (error) {
      setPostError("Error al publicar. Intenta de nuevo.")
    } else {
      setNewContent("")
      setSelectedCategory("general")
      // Refrescar lista inmediatamente tras publicar
      await fetchPosts()
    }

    setIsSubmitting(false)
  }

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

  const visibleFormCategories = showAllCategories
    ? CATEGORIES
    : CATEGORIES.slice(0, 6)

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
          Voz Ciudadana
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

      {/* ------------------------------------------------------------------ */}
      {/* Post Form                                                            */}
      {/* ------------------------------------------------------------------ */}
      <Card className="mb-6 border-border/60">
        <CardContent className="p-5">
          <form onSubmit={handleSubmitPost} className="space-y-4">
            <Textarea
              placeholder="Comparte algo sobre seguridad, salud, educacion, gobierno... Tu comunidad te escucha."
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              className="min-h-[96px] resize-none bg-background text-sm"
              maxLength={500}
            />

            {/* Category picker */}
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
                Tablero
              </p>
              <div className="flex flex-wrap gap-1.5">
                {visibleFormCategories.map((cat) => {
                  const Icon = cat.icon
                  const active = selectedCategory === cat.value
                  return (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => setSelectedCategory(cat.value)}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                        active
                          ? cat.color
                          : "bg-transparent text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
                      )}
                    >
                      <Icon className="w-3.5 h-3.5 shrink-0" />
                      {cat.label}
                    </button>
                  )
                })}
              </div>
              {CATEGORIES.length > 6 && (
                <button
                  type="button"
                  onClick={() => setShowAllCategories(!showAllCategories)}
                  className="flex items-center gap-1 text-xs text-primary hover:underline mt-2"
                >
                  <ChevronRight
                    className={cn(
                      "w-3.5 h-3.5 transition-transform",
                      showAllCategories && "rotate-90"
                    )}
                  />
                  {showAllCategories
                    ? "Ver menos"
                    : `${CATEGORIES.length - 6} tableros mas`}
                </button>
              )}
            </div>

            {postError && (
              <p className="text-xs text-destructive">{postError}</p>
            )}

            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {newContent.length}/500
              </span>
              <Button
                type="submit"
                size="sm"
                disabled={!newContent.trim() || isSubmitting}
                className="gap-2"
              >
                {isSubmitting ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                {isSubmitting ? "Publicando..." : "Publicar anonimamente"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

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
            <CardContent className="py-12 flex flex-col items-center gap-3 text-center">
              <MessageSquare className="w-10 h-10 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                {filterCategory
                  ? "Sin publicaciones en este tablero todavia."
                  : "Sin publicaciones todavia. Se el primero en compartir."}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Post cards */}
        {!isLoading &&
          filteredPosts.map((post) => {
            const cat = getCategoryMeta(post.category)
            const Icon = cat.icon
            return (
              <Card
                key={post.id}
                className="transition-colors hover:border-primary/30"
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <Badge
                      variant="outline"
                      className={cn("text-xs gap-1.5 font-medium", cat.color)}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {cat.label}
                    </Badge>
                    <span className="text-xs text-muted-foreground flex items-center gap-1 shrink-0">
                      <Clock className="w-3 h-3" />
                      {formatTimeAgo(post.created_at)}
                    </span>
                  </div>

                  <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                    {post.content}
                  </p>

                  <CommentSection
                    post={post}
                    onCommentAdded={handleCommentAdded}
                  />
                </CardContent>
              </Card>
            )
          })}
      </div>
    </div>
  )
}
