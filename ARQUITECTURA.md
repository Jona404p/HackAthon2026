# 🏗️ Arquitectura del Sistema de Reportes

## Diagrama General

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Next.js)                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────┐                  ┌──────────────────┐     │
│  │   Página /mapa   │                  │  Página / (Home) │     │
│  │   (InteractiveMap)│                 │ (AnonymousForum) │     │
│  └────────┬─────────┘                  └────────┬─────────┘     │
│           │                                     │                │
│  ┌────────▼─────────────────────────────────────▼────────┐      │
│  │  ReportControl                 CommentSection         │      │
│  │  - Botón "Reportar"            - Textarea comentario  │      │
│  │  - Selecciona ubicación        - Submit comentario    │      │
│  │  - Formulario de reporte       - Lista de comentarios │      │
│  └────────┬─────────────────────────────────┬───────────┘      │
│           │                                 │                   │
│  ┌────────▼──────────────────────────────────▼────────┐        │
│  │          Supabase Client (Real-time)               │        │
│  │  .from('map_reports').insert()                    │        │
│  │  .from('anonymous_posts').insert()                │        │
│  │  .from('anonymous_comments').insert()             │        │
│  │  .on('postgres_changes', ...).subscribe()         │        │
│  └────────┬──────────────────────────────────────────┘        │
│           │                                                     │
└───────────┼──────────────────────────────────────────────────────┘
            │
            │ (HTTP/WebSocket Realtime)
            │
┌───────────▼──────────────────────────────────────────────────────┐
│                    BACKEND (Supabase)                             │
├────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐ │
│  │   map_reports    │  │ anonymous_posts  │  │  anonymous_       │ │
│  │                  │  │                  │  │  comments         │ │
│  │ - id (UUID)      │  │ - id (UUID)      │  │                  │ │
│  │ - latitude       │  │ - content        │  │ - id (UUID)      │ │
│  │ - longitude      │  │ - category       │  │ - post_id        │ │
│  │ - category       │  │ - map_report_id  │  │ - content        │ │
│  │ - description    │  │ - created_at     │  │ - created_at     │ │
│  │ - post_id (FK)   │  │                  │  │                  │ │
│  │ - created_at     │  │                  │  │                  │ │
│  │                  │  │                  │  │                  │ │
│  │ RLS: Público     │  │ RLS: Público     │  │ RLS: Público     │ │
│  │ Realtime: ON     │  │ Realtime: ON     │  │ Realtime: ON     │ │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘ │
│           │                    │                      │             │
│           └────────┬───────────┴──────────────────────┘             │
│                    │                                                 │
│          ┌─────────▼──────────────┐                                 │
│          │   Realtime Pubsub      │                                 │
│          │ - INSERT events        │                                 │
│          │ - UPDATE events        │                                 │
│          │ - DELETE events        │                                 │
│          └───────────────────────┘                                  │
│                    │                                                 │
└────────────────────┼──────────────────────────────────────────────────┘
                     │
                     │ (WebSocket)
                     │
        ┌────────────▼─────────────┐
        │   Cliente Suscrito       │
        │ Recibe actualizaciones   │
        │ en tiempo real           │
        └─────────────────────────┘
```

## Flujo de Crear Reporte

```
┌─────────────────────────────────────────────────────────────────┐
│ USUARIO: Hace clic en "Reportar Problema"                       │
└────────────────┬────────────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────────────┐
│ ReportControl: isReporting = true                               │
│ - Cambia cursor a crosshair                                     │
│ - Habilita escucha de clicks en el mapa                         │
└────────────────┬────────────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────────────┐
│ USUARIO: Hace clic en el mapa en ubicación específica           │
└────────────────┬────────────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────────────┐
│ ReportControl: MapClickHandler triggered                         │
│ - Captura lat/lng del click                                      │
│ - Abre formulario dialog                                         │
│ - Coloca PIN temporal en la ubicación                            │
└────────────────┬────────────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────────────┐
│ USUARIO: Completa formulario                                    │
│ - Selecciona categoría (seguridad, vialidad, etc)               │
│ - Escribe descripción                                           │
│ - Hace clic en "Publicar"                                       │
└────────────────┬────────────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────────────┐
│ submitReport() ejecutado:                                        │
│                                                                  │
│ 1. Validar campos (ubicación, categoría, descripción)           │
│ 2. POST a Supabase:                                             │
│    a) INSERT anonymous_posts                                    │
│    b) INSERT map_reports (con post_id)                          │
│ 3. Toast: "Reporte creado"                                      │
│ 4. Reset form state                                             │
└────────────────┬────────────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────────────┐
│ Supabase Realtime notifica a todos los clientes:                │
│ - INSERT en map_reports                                         │
│ - INSERT en anonymous_posts                                     │
└────────────────┬────────────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────────────┐
│ ReportsLayer detecta cambios:                                    │
│ - setReports((prev) => [newReport, ...prev])                    │
│ - Renderiza nuevo Marker con popup                              │
│ - PIN aparece en el mapa                                        │
└────────────────┬────────────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────────────┐
│ AnonymousForum detecta cambios:                                  │
│ - setReports((prev) => [newPost, ...prev])                      │
│ - Nuevo post aparece en el foro                                 │
│ - Se muestra badge "Desde el Mapa"                              │
└─────────────────────────────────────────────────────────────────┘
```

## Flujo de Ver Discusión

```
┌─────────────────────────────────────────────────────────────────┐
│ USUARIO: Ve PIN en el mapa y lo hace click                      │
└────────────────┬────────────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────────────┐
│ ReportsLayer: Marker.onClick                                    │
│ - Abre Popup de Leaflet                                         │
│ - Muestra info del reporte                                      │
│ - Botón "Ver Discusión"                                         │
└────────────────┬────────────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────────────┐
│ USUARIO: Hace clic en "Ver Discusión"                           │
└────────────────┬────────────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────────────┐
│ ReportsLayer: Button onClick                                    │
│ - router.push(`/?post=${report.post_id}`)                       │
│ - Navega a home con query param post=uuid                       │
└────────────────┬────────────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────────────┐
│ HomePage carga:                                                  │
│ - useSearchParams() obtiene post param                           │
│ - Pasa initialPostId={postId} a AnonymousForum                  │
└────────────────┬────────────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────────────┐
│ AnonymousForum mounted:                                          │
│ - highlightPostId = initialPostId || searchParams.get("post")   │
│ - Carga posts desde Supabase                                    │
│ - Detecta highlightPostId en useEffect                          │
│ - scrollIntoView({ behavior: "smooth", block: "center" })       │
│ - Post se resalta con borde azul                                │
└────────────────┬────────────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────────────┐
│ USUARIO: Ve el post del reporte en el foro:                     │
│ - Contenido original del reporte                                │
│ - Badge "Desde el Mapa" (si existe map_report_id)               │
│ - Link "Ver ubicación en el mapa"                               │
│ - Sección de comentarios                                        │
└─────────────────────────────────────────────────────────────────┘
```

## Flujo de Comentar

```
┌─────────────────────────────────────────────────────────────────┐
│ USUARIO: Lee post en el foro y escribe comentario               │
└────────────────┬────────────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────────────┐
│ CommentSection: onChange → setNewComment                        │
│ - Actualiza estado local del comentario                         │
└────────────────┬────────────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────────────┐
│ USUARIO: Hace clic en "Enviar"                                  │
└────────────────┬────────────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────────────┐
│ CommentSection: handleSubmit                                    │
│ - setIsSubmitting(true)                                         │
│ - POST a Supabase INSERT anonymous_comments                     │
│ - setNewComment("")                                             │
│ - onCommentAdded(postId)                                        │
└────────────────┬────────────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────────────┐
│ AnonymousForum: handleCommentAdded                              │
│ - Incrementa comment_count del post: count + 1                  │
│ - setPosts(prev => map(p => count++))                           │
└────────────────┬────────────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────────────┐
│ Supabase Realtime notifica:                                     │
│ - INSERT en anonymous_comments                                  │
└────────────────┬────────────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────────────┐
│ CommentSection (subscription):                                  │
│ - Detecta nuevo comentario                                      │
│ - setComments((prev) => [newComment, ...prev])                  │
│ - Nuevo comentario aparece en tiempo real                       │
└─────────────────────────────────────────────────────────────────┘
```

## Dependencias de Componentes

```
app/page.tsx (HomePage)
├── Navbar
└── AnonymousForum
    ├── CommentSection (para cada Post)
    │   └── useMap (para generar URL con ubicación)
    └── useSearchParams (para initialPostId)

app/mapa/page.tsx (MapaPage)
├── Navbar
└── InteractiveMap
    ├── MapContainer (Leaflet)
    ├── TileLayer (CartoDB)
    ├── ZoomControl
    ├── MapCenterHandler (useSearchParams)
    ├── LayerControl
    │   └── LAYER_REGISTRY (mapeo de capas)
    └── ReportControl
        ├── useMap
        ├── useMapEvents
        └── Dialog (formulario)

lib/map/layer-registry.ts
├── RiskZonesLayer
├── SafeZonesLayer
├── RoutesLayer
├── TransitLayer
└── ReportsLayer
    ├── useMap
    ├── Marker (Leaflet)
    ├── Popup
    └── useRouter (para navegar al foro)

lib/supabase/client.ts
└── Supabase Client (reutilizado por todos)
```

## Llamadas a BD (Supabase)

| Operación | Tabla | Método | Trigger |
|-----------|-------|--------|---------|
| Obtener posts | anonymous_posts | SELECT | Carga inicial foro |
| Crear post | anonymous_posts | INSERT | Crear reporte en mapa |
| Obtener comentarios | anonymous_comments | SELECT | Cargar comentarios |
| Crear comentario | anonymous_comments | INSERT | Usuario envía comentario |
| Obtener reportes | map_reports | SELECT | Carga inicial mapa |
| Crear reporte | map_reports | INSERT | Usuario reporta en mapa |
| Actualizar reporte | map_reports | UPDATE | Vincular post al reporte |
| Realtime: posts | anonymous_posts | SUBSCRIBE | Cuando llega nuevo post |
| Realtime: reportes | map_reports | SUBSCRIBE | Cuando llega nuevo reporte |
| Realtime: comentarios | anonymous_comments | SUBSCRIBE | Cuando llega comentario |

## Stack Tecnológico

```
┌─────────────────────────────────┐
│    Frontend (Next.js 16)        │
│  - React 19 (RSC + Hooks)       │
│  - TypeScript                   │
│  - Tailwind CSS v4              │
│  - shadcn/ui (componentes)      │
│  - Lucide Icons                 │
│  - Leaflet (Mapas)              │
│  - React Leaflet                │
│  - Sonner (Toasts)              │
│  - SWR (Data fetching)          │
└─────────────────────────────────┘
         │         │        │
         ▼         ▼        ▼
   ┌──────────────────────────────┐
   │  Vercel Deployment           │
   │  - Auto scaling              │
   │  - Edge Functions            │
   │  - Image Optimization        │
   └──────────────────────────────┘

┌──────────────────────────────────┐
│   Backend (Supabase)             │
│  - PostgreSQL Database           │
│  - Row Level Security (RLS)      │
│  - Realtime Pub/Sub              │
│  - Authentication (anónimo)      │
│  - REST API (generado auto)      │
└──────────────────────────────────┘
```

---

✨ Este sistema permite una experiencia completamente dinámica, en tiempo real, y 100% anónima.
