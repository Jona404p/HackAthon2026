# Configuración de Imágenes en Reportes

Este documento proporciona instrucciones para configurar correctamente la subida y visualización de imágenes en los reportes.

## Configuración Requerida

### 1. Variables de Entorno ✓

Las siguientes variables de entorno ya están configuradas en tu proyecto:

```
NEXT_PUBLIC_SUPABASE_URL=https://ysdshuvpayfmpyeavfpp.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 2. Base de Datos

La tabla `anonymous_posts` debe tener la columna `image_url`. Verifica en Supabase:

**Supabase Dashboard → SQL Editor → Ejecuta:**

```sql
-- Verificar que la columna existe
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'anonymous_posts' 
AND column_name = 'image_url';

-- Si no existe, agrégala:
ALTER TABLE public.anonymous_posts
ADD COLUMN image_url TEXT;
```

### 3. Storage Bucket

El bucket `report-images` se creará automáticamente en el primer acceso.

**Si deseas hacerlo manualmente en Supabase Dashboard:**

1. Ve a **Storage** en la barra lateral izquierda
2. Haz clic en **Create new bucket**
3. Nombre: `report-images`
4. Configura como **Public** ✓
5. Haz clic en **Create bucket**

**Políticas de acceso (RLS):**

En Supabase Dashboard → Storage → report-images → Policies:

Debería permitir:
- ✓ SELECT: Público (para ver imágenes)
- ✓ INSERT: Público (para subir imágenes)

Si necesitas más seguridad, usa estas políticas:

```sql
-- Permitir lectura pública
CREATE POLICY "Allow public read" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'report-images');

-- Permitir inserción pública
CREATE POLICY "Allow public insert" ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'report-images');
```

## Prueba de Funcionalidad

### 1. Verifica el Setup Automático

Cuando abras la app, el componente `SetupInitializer` verificará automáticamente:
- ✓ Existencia del bucket `report-images`
- ✓ Tabla `anonymous_posts` existe
- ✓ Columna `image_url` existe

Abre la consola del navegador (F12) y busca logs `[v0]` para ver el estado.

### 2. Prueba Manual

```bash
# En tu proyecto, ejecuta:
curl https://tu-dominio.com/api/setup
```

Deberías ver una respuesta como:

```json
{
  "status": "ok",
  "message": "All systems ready",
  "hasImageBucket": true,
  "hasAnonymousPostsTable": true,
  "hasImageColumn": true
}
```

## Flujo de Subida de Imágenes

1. **Usuario selecciona imagen** en el formulario de reporte
2. **Se valida el archivo:**
   - Debe ser una imagen válida
   - Máximo 5 MB
3. **Se sube a Storage:**
   - Endpoint: `/api/reports/upload-image`
   - Bucket: `report-images`
   - Nombre: UUID aleatorio + extensión
4. **Se obtiene la URL pública**
5. **Se crea el post con image_url:**
   - Endpoint: `/api/reports` (POST)
   - Si la columna `image_url` no existe, se intenta sin ella (fallback)
6. **Se crea el reporte vinculado**

## Troubleshooting

### Error: "No se pudo subir la imagen"

**Posibles causas:**

1. **El bucket no existe o no es público**
   - Solución: Ve a Supabase Storage y crea/configura el bucket

2. **Archivo demasiado grande**
   - Límite: 5 MB
   - Solución: Comprime la imagen

3. **Tipo de archivo no permitido**
   - Permitidos: JPEG, PNG, WebP, AVIF
   - Solución: Convierte la imagen al formato correcto

### Error: "Error al crear el reporte"

**Si ves en consola:** `Post error: {}`

Esto significa que la columna `image_url` no existe en la base de datos.

**Solución:**

Ejecuta en Supabase SQL Editor:

```sql
ALTER TABLE public.anonymous_posts
ADD COLUMN image_url TEXT;
```

### Las imágenes no se muestran

**Posibles causas:**

1. **Bucket no es público**
   - Solución: En Supabase → Storage → report-images → Editar → Marcar como público

2. **Políticas RLS incorrectas**
   - Solución: Ver sección "Políticas de acceso" arriba

3. **La URL se guarda pero no se obtiene correctamente**
   - Solución: Verifica en Supabase que el archivo realmente existe en el storage

## Endpoints API

### POST /api/reports/upload-image
**Subir una imagen**

```bash
curl -X POST https://tu-dominio.com/api/reports/upload-image \
  -F "file=@/ruta/a/imagen.jpg"
```

Respuesta exitosa:
```json
{
  "publicUrl": "https://ysdshuvpayfmpyeavfpp.supabase.co/storage/v1/object/public/report-images/..."
}
```

### POST /api/reports
**Crear un reporte con imagen**

```bash
curl -X POST https://tu-dominio.com/api/reports \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": 24.2705,
    "longitude": -104.6532,
    "category": "accidente",
    "description": "Descripción del reporte",
    "image_url": "https://..."
  }'
```

### GET /api/setup
**Verificar configuración**

```bash
curl https://tu-dominio.com/api/setup
```

## Debugging

Para ver logs detallados, abre la consola (F12) y busca mensajes con `[v0]`:

- `[v0] Setup verification passed ✓` - Setup correcto
- `[v0] Error creating report:` - Error en la creación del reporte
- `[v0] Post error:` - Error al crear el post en el foro

## Referencias

- [Supabase Storage Docs](https://supabase.com/docs/guides/storage)
- [Supabase RLS Policies](https://supabase.com/docs/guides/auth/row-level-security)
- [Next.js File Uploads](https://nextjs.org/docs/app/building-your-application/routing/route-handlers#streaming)
