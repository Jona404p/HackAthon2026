# ⚡ Guía Rápida - Sistema de Reportes Dinámico

## 🚀 Comienza en 5 Minutos

### 1️⃣ Verifica que Supabase esté Configurado

Asegúrate de que tus variables de entorno están en el proyecto:
```
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
```

### 2️⃣ Crea las Tablas en Supabase

Ve a tu Supabase Dashboard > SQL Editor y copia-pega el contenido de `SISTEMA_REPORTES.md` (sección "Configuración de Supabase").

### 3️⃣ Inicia el Dev Server

```bash
pnpm dev
```

Accede a `http://localhost:3000`

### 4️⃣ Prueba el Sistema

#### Crear un Reporte desde el Mapa

1. Navega a `/mapa`
2. Haz clic en el botón rojo **"Agregar Reporte"** (arriba a la derecha)
3. Haz clic en cualquier punto del mapa
4. Completa el formulario:
   - Categoría (ej: "Seguridad")
   - Descripción (ej: "Asalto en esta zona")
5. Haz clic en **"Publicar"**

✅ Resultado:
- Se crea un PIN en el mapa
- Se crea automáticamente un post en el foro
- Se vinculan automáticamente

#### Ver la Discusión desde el Mapa

1. Haz clic en el PIN que acabas de crear
2. Se abre un popup
3. Haz clic en **"Ver Discusión en el Foro"**

✅ Resultado:
- Te lleva a `/?post={id-del-post}`
- El post se destaca y despliegue automáticamente
- El foro se carga listo para comentar

#### Comentar en el Post

1. En el foro, desplázate hasta el post del reporte
2. Escribe un comentario anónimo en el cuadro
3. Haz clic en enviar

✅ Resultado:
- El comentario aparece en tiempo real
- El contador de comentarios se actualiza
- Otros usuarios ven tu comentario instantáneamente

---

## 🗂️ Componentes Clave

### `components/map/report-control.tsx`
- Panel flotante para crear reportes
- Manejo de clic en el mapa
- Formulario de reporte
- Vinculación automática con el foro

### `components/map/layers/reports-layer.tsx`
- Renderiza dinámicamente todos los PINs del mapa
- Actualizaciones en tiempo real con Supabase Realtime
- Popups con información del reporte

### `components/forum/anonymous-forum.tsx`
- Foro principal "Voz Ciudadana"
- Acepta `initialPostId` para desplegar post específico
- Sistema de comentarios anónimos
- Integración con reportes del mapa

### `app/api/reports/route.ts`
- API REST para obtener y crear reportes
- Endpoints GET y POST
- Validación de datos

---

## 🔄 Flujo en Tiempo Real

```
Usuario                    Mapa                    Foro                  Supabase
  │                         │                       │                        │
  ├──"Reportar"─────────────>│                       │                        │
  │                         │                       │                        │
  ├──Click en mapa──────────>│                       │                        │
  │                         │                       │                        │
  ├──Datos del reporte──────>│                       │                        │
  │                         │──INSERT post────────────────────────────────────>│
  │                         │                       │<────Realtime update──────
  │                         │────INSERT report─────────────────────────────────>│
  │                         │<────Realtime update────────────────────────────────
  │                         │                       │                        │
  │<────PIN aparece─────────│                       │                        │
  │                         │                       │<────POST aparece────────
  │                         │                       │                        │
  │                    [Usuario otro]              │                        │
  │                         │<────Click PIN─────────│                        │
  │                         │                       │                        │
  │<────Router a /?post=ID──────────────────────────│                        │
  │                         │                       │                        │
  │<────────────────────────────────POST destaca───│                        │
  │                         │                       │                        │
  ├──Comentario────────────────────────────────────>│                        │
  │                         │                       │────INSERT comentario───>│
  │                         │                       │<─────Realtime update────
  │                         │                       │                        │
  │<────────────────────────────────Aparece────────│<────Realtime update────
```

---

## 🎯 URLs Importantes

| Página | URL | Descripción |
|--------|-----|-------------|
| Mapa | `/mapa` | Mapa interactivo con reportes |
| Mapa centrado | `/mapa?lat=24&lng=-104&zoom=15` | Centra el mapa en coordenadas |
| Foro | `/` | Foro principal "Voz Ciudadana" |
| Post específico | `/?post=uuid` | Abre foro con post específico |

---

## ✅ Checklist de Verificación

- [ ] Variables de entorno configuradas
- [ ] Tablas de Supabase creadas
- [ ] Dev server iniciado
- [ ] Mapa se carga en `/mapa`
- [ ] Foro se carga en `/`
- [ ] Puedo crear un reporte en el mapa
- [ ] Se crea automáticamente un post en el foro
- [ ] Puedo comentar en el post
- [ ] Los comentarios aparecen en tiempo real
- [ ] Puedo ir del mapa al foro y viceversa

---

## 🐛 Troubleshooting

### "Variables de Supabase no configuradas"
**Solución**: Ve a Settings > Vars en v0 y agrega las variables

### "Las tablas de Supabase no existen"
**Solución**: Ejecuta el SQL en Supabase Dashboard > SQL Editor

### "El mapa no se carga"
**Solución**: El mapa requiere cliente del navegador. Asegúrate de que Leaflet esté instalado:
```bash
pnpm add leaflet react-leaflet
```

### "Los pins no aparecen en tiempo real"
**Solución**: Verifica que Realtime está habilitado en Supabase para esas tablas

### "Los comentarios no se guardan"
**Solución**: Verifica que la tabla `anonymous_comments` tiene RLS deshabilitada o políticas públicas

---

## 📚 Documentación Completa

Para más detalles, ve a `SISTEMA_REPORTES.md`

---

## 🎉 ¡Listo!

Tu sistema de reportes dinámico ya está funcionando. Los usuarios pueden:
- ✅ Reportar problemas directamente en el mapa
- ✅ Ver automáticamente una discusión en el foro
- ✅ Comentar y dar seguimiento
- ✅ Todo 100% anónimo y en tiempo real

¡Que disfrutes! 🚀
