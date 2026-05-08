# Sistema de Reportes Dinámico - SafeRoute Durango

## 📋 Descripción General

El sistema permite a los usuarios reportar problemas de seguridad, infraestructura y servicios públicos en el mapa interactivo de Durango. Cada reporte crea automáticamente una discusión en el foro de "Voz Ciudadana" donde otros usuarios pueden comentar y dar seguimiento.

## 🗺️ Flujo de Uso

### 1. Reportar desde el Mapa (`/mapa`)

```
Usuario hace clic en "Reportar Problema"
    ↓
Usuario hace clic en el mapa para seleccionar ubicación
    ↓
Se abre un formulario con:
  - Categoría (Seguridad, Vialidad, Servicios, Infraestructura, Otro)
  - Descripción del problema
    ↓
Usuario publica el reporte
    ↓
Se crea automáticamente:
  1. Un PIN en el mapa con la ubicación
  2. Un POST en el foro "Voz Ciudadana"
  3. Vinculación automática entre ambos
    ↓
Usuario puede ver la discusión desde el PIN del mapa
```

### 2. Ver Discusiones desde el Mapa

```
Usuario hace clic en un PIN en el mapa
    ↓
Se abre un popup con:
  - Categoría del problema
  - Descripción
  - Fecha de creación
  - Botón "Ver Discusión"
    ↓
Botón lleva a /?post={postId}
    ↓
El foro se carga y automáticamente despliegue el post específico
```

### 3. Comentar en el Foro

```
Usuario accede a /
    ↓
Ve el post del reporte del mapa
    ↓
Puede escribir comentarios anónimos
    ↓
Los comentarios se guardan en tiempo real
```

## 🔧 Configuración de Supabase

### Tablas Requeridas

Ejecuta este SQL en tu Supabase Dashboard:

```sql
-- Tabla para reportes del mapa
CREATE TABLE IF NOT EXISTS map_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  post_id UUID REFERENCES anonymous_posts(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla para posts anonimos del foro
CREATE TABLE IF NOT EXISTS anonymous_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  image_url TEXT,
  map_report_id UUID REFERENCES map_reports(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla para comentarios anonimos
CREATE TABLE IF NOT EXISTS anonymous_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES anonymous_posts(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar Row Level Security
ALTER TABLE map_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE anonymous_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE anonymous_comments ENABLE ROW LEVEL SECURITY;

-- Políticas de acceso público (sin autenticación requerida)
CREATE POLICY "Lectura publica de reportes" ON map_reports FOR SELECT USING (true);
CREATE POLICY "Insercion anonima de reportes" ON map_reports FOR INSERT WITH CHECK (true);
CREATE POLICY "Actualizacion de reportes" ON map_reports FOR UPDATE USING (true);

CREATE POLICY "Lectura publica de posts" ON anonymous_posts FOR SELECT USING (true);
CREATE POLICY "Insercion anonima de posts" ON anonymous_posts FOR INSERT WITH CHECK (true);

CREATE POLICY "Lectura publica de comentarios" ON anonymous_comments FOR SELECT USING (true);
CREATE POLICY "Insercion anonima de comentarios" ON anonymous_comments FOR INSERT WITH CHECK (true);

-- Habilitar Realtime para actualizaciones en tiempo real
ALTER PUBLICATION supabase_realtime ADD TABLE map_reports;
ALTER PUBLICATION supabase_realtime ADD TABLE anonymous_posts;
ALTER PUBLICATION supabase_realtime ADD TABLE anonymous_comments;

-- Bucket de almacenamiento para imágenes de reportes
-- Crea un bucket público llamado `report-images` en Storage y permite lectura anónima en sus objetos.
```

### Variables de Entorno

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key-aqui
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key-aqui
```

> `SUPABASE_SERVICE_ROLE_KEY` es necesario solo para el endpoint de subida de imágenes del reporte. No debe exponerse en el cliente.

## 📁 Estructura de Archivos

```
components/
├── map/
│   ├── interactive-map.tsx      # Contenedor principal del mapa
│   ├── report-control.tsx       # Control para crear reportes
│   ├── layer-control.tsx        # Panel de capas
│   └── layers/
│       ├── reports-layer.tsx    # Capa de reportes dinámicos
│       ├── risk-zones-layer.tsx
│       ├── safe-zones-layer.tsx
│       ├── routes-layer.tsx
│       └── transit-layer.tsx
└── forum/
    └── anonymous-forum.tsx      # Foro de Voz Ciudadana

app/
├── mapa/
│   └── page.tsx                 # Página del mapa (soporta ?lat=&lng=&zoom=)
├── page.tsx                     # Página principal con foro (soporta ?post=)
└── api/
    └── reports/
        └── route.ts             # API REST para reportes

lib/
├── map/
│   ├── layer-registry.ts        # Registro central de capas
│   ├── types.ts
│   └── ...
└── supabase/
    └── client.ts                # Cliente de Supabase
```

## 🔄 Flujo de Datos en Tiempo Real

### Crear Reporte

```
ReportControl (Usuario hace clic en "Reportar")
    ↓
Selecciona ubicación en el mapa
    ↓
Completa formulario con categoría y descripción
    ↓
submitReport() en report-control.tsx
    ↓
POST a Supabase:
  1. INSERT anonymous_posts
  2. INSERT map_reports (con post_id)
    ↓
Supabase Realtime notifica:
  - Otros clientes reciben la actualización
  - ReportsLayer se actualiza automáticamente
  - Nuevo PIN aparece en el mapa
```

### Ver Discusión

```
Usuario hace clic en PIN del mapa
    ↓
Se muestra popup con:
  - Botón "Ver Discusión"
    ↓
onClick → router.push(`/?post={postId}`)
    ↓
Página principal carga:
  - AnonymousForum con initialPostId={postId}
  - El post se resalta automáticamente
  - Se hace scroll hasta el post
```

### Comentar en Post

```
Usuario lee el post del reporte
    ↓
Escribe comentario anónimo
    ↓
CommentSection maneja el envío
    ↓
POST a Supabase: INSERT anonymous_comments
    ↓
Realtime actualiza:
  - Contador de comentarios se incrementa
  - Nuevo comentario aparece en tiempo real
```

## 🎨 Categorías de Reportes

| Categoría | Color | Icono | Foro |
|-----------|-------|-------|------|
| Seguridad | Rojo | Shield | seguridad |
| Vialidad | Ámbar | Car | vialidad |
| Servicios | Azul | Building | servicios |
| Infraestructura | Púrpura | Construction | infraestructura |
| Otro | Gris | HelpCircle | general |

## 🔗 URLs y Parámetros

### Mapa
```
/mapa                          # Mapa estándar
/mapa?lat=24.02&lng=-104.65&zoom=15  # Centrado en coordenadas específicas
```

### Foro
```
/                              # Foro principal
/?post=uuid-del-post           # Foro con post específico abierto
/?post=uuid-del-post#forum     # Mismo, con ancla al foro
```

### API
```
GET /api/reports               # Obtener todos los reportes
POST /api/reports              # Crear nuevo reporte
Body: {
  latitude: number,
  longitude: number,
  category: string,
  description: string
}
```

## ⚡ Características Principales

- ✅ **100% Anónimo**: Sin registro, sin autenticación, sin cookies
- ✅ **Tiempo Real**: Actualizaciones en vivo con Supabase Realtime
- ✅ **Vinculación Automática**: Cada reporte crea post en el foro
- ✅ **Mapa Dinámico**: PINs se actualizan sin recargar la página
- ✅ **Responsive**: Funciona en desktop y móvil
- ✅ **Accesible**: Navegación clara y controles intuitivos

## 🚀 Próximas Mejoras

- [ ] Filtrar reportes por categoría en el mapa
- [ ] Búsqueda de reportes por ubicación
- [ ] Estadísticas de reportes por zona
- [ ] Notificaciones de nuevo comentarios en posts del usuario
- [ ] Export de reportes a CSV
- [ ] Moderación de contenido inapropiado

## 📞 Soporte

Para problemas técnicos o preguntas, contacta al equipo de desarrollo.
