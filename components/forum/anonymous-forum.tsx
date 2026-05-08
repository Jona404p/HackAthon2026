"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { MessageSquare, Send, Shield, Clock, Users, AlertTriangle, MapPin, Bus } from "lucide-react"
import { cn } from "@/lib/utils"

interface Post {
  id: string
  content: string
  category: string
  created_at: string
}

const CATEGORIES = [
  { value: "seguridad", label: "Seguridad", icon: Shield, color: "bg-red-500/20 text-red-400 border-red-500/30" },
  { value: "transporte", label: "Transporte", icon: Bus, color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  { value: "alerta", label: "Alerta", icon: AlertTriangle, color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
  { value: "zona", label: "Zona", icon: MapPin, color: "bg-green-500/20 text-green-400 border-green-500/30" },
  { value: "general", label: "General", icon: MessageSquare, color: "bg-muted text-muted-foreground border-border" },
]

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) return "Hace un momento"
  if (diffInSeconds < 3600) return `Hace ${Math.floor(diffInSeconds / 60)} min`
  if (diffInSeconds < 86400) return `Hace ${Math.floor(diffInSeconds / 3600)} h`
  return `Hace ${Math.floor(diffInSeconds / 86400)} d`
}

export function AnonymousForum() {
  const [posts, setPosts] = useState<Post[]>([])
  const [newContent, setNewContent] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("general")
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => {
    fetchPosts()

    // Suscribirse a cambios en tiempo real
    const channel = supabase
      .channel("anonymous_posts")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "anonymous_posts" },
        (payload) => {
          setPosts((current) => [payload.new as Post, ...current])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  async function fetchPosts() {
    setIsLoading(true)
    setError(null)
    
    const { data, error } = await supabase
      .from("anonymous_posts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50)

    if (error) {
      setError("Error al cargar los posts")
      console.error("[v0] Error fetching posts:", error)
    } else {
      setPosts(data || [])
    }
    setIsLoading(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!newContent.trim() || isSubmitting) return

    setIsSubmitting(true)
    setError(null)

    const { error } = await supabase.from("anonymous_posts").insert({
      content: newContent.trim(),
      category: selectedCategory,
    })

    if (error) {
      setError("Error al publicar. Intenta de nuevo.")
      console.error("[v0] Error posting:", error)
    } else {
      setNewContent("")
      setSelectedCategory("general")
    }
    setIsSubmitting(false)
  }

  const getCategoryStyle = (category: string) => {
    return CATEGORIES.find((c) => c.value === category) || CATEGORIES[4]
  }

  return (
    <div className="w-full max-w-3xl mx-auto px-4">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
          <Users className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3 font-mono">
          Voz Ciudadana
        </h1>
        <p className="text-muted-foreground max-w-lg mx-auto leading-relaxed">
          Espacio seguro y anonimo para compartir informacion sobre seguridad en Durango. 
          Sin registro, sin rastreo, solo tu voz.
        </p>
      </div>

      {/* Privacy Notice */}
      <Card className="mb-6 border-primary/20 bg-primary/5">
        <CardContent className="p-4 flex items-start gap-3">
          <Shield className="w-5 h-5 text-primary mt-0.5 shrink-0" />
          <div className="text-sm text-muted-foreground">
            <span className="text-primary font-semibold">100% Anonimo.</span> No recolectamos IP, cookies, ni datos personales. 
            Tu privacidad es nuestra prioridad.
          </div>
        </CardContent>
      </Card>

      {/* Post Form */}
      <Card className="mb-8">
        <CardContent className="p-4">
          <form onSubmit={handleSubmit}>
            <Textarea
              placeholder="Comparte informacion sobre seguridad, alertas, o situaciones en tu zona..."
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              className="min-h-[100px] mb-4 bg-background border-border resize-none"
              maxLength={500}
            />
            
            {/* Categories */}
            <div className="flex flex-wrap gap-2 mb-4">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon
                return (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setSelectedCategory(cat.value)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                      selectedCategory === cat.value
                        ? cat.color
                        : "bg-secondary/50 text-muted-foreground border-transparent hover:border-border"
                    )}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {cat.label}
                  </button>
                )
              })}
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {newContent.length}/500 caracteres
              </span>
              <Button 
                type="submit" 
                disabled={!newContent.trim() || isSubmitting}
                className="gap-2"
              >
                <Send className="w-4 h-4" />
                {isSubmitting ? "Publicando..." : "Publicar anonimamente"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm text-center">
          {error}
        </div>
      )}

      {/* Posts List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground font-mono flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            Publicaciones recientes
          </h2>
          <Badge variant="outline" className="text-xs">
            {posts.length} posts
          </Badge>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="h-4 bg-muted rounded w-1/4 mb-3" />
                  <div className="h-4 bg-muted rounded w-full mb-2" />
                  <div className="h-4 bg-muted rounded w-3/4" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-muted-foreground">
                No hay publicaciones aun. Se el primero en compartir.
              </p>
            </CardContent>
          </Card>
        ) : (
          posts.map((post) => {
            const category = getCategoryStyle(post.category)
            const Icon = category.icon
            return (
              <Card key={post.id} className="transition-colors hover:border-primary/30">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <Badge variant="outline" className={cn("text-xs shrink-0", category.color)}>
                      <Icon className="w-3 h-3 mr-1" />
                      {category.label}
                    </Badge>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatTimeAgo(post.created_at)}
                    </span>
                  </div>
                  <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                    {post.content}
                  </p>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
