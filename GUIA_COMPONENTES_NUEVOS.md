# Guía de Componentes Nuevos - UI/UX Mejorada

## Componentes Creados

### 1. MobileNavTabs
**Ubicación:** `components/layout/mobile-nav-tabs.tsx`

Componente de navegación responsiva que muestra tabs en móvil (barra inferior) y navegación horizontal en desktop.

**Características:**
- Tabs con iconos en móvil (solo símbolos)
- Tooltips en hover
- Indicador visual de página activa (punto en móvil, underline en desktop)
- Animación suave del underline
- Fully accessible con ARIA labels

**Uso:**
```tsx
import { MobileNavTabs } from "@/components/layout/mobile-nav-tabs"

// En el navbar después del header
{isMapPage && <MobileNavTabs />}
```

**Props:** Ninguno (utiliza usePathname internamente)

---

### 2. FloatingSearchBar
**Ubicación:** `components/map/floating-search-bar.tsx`

Barra de búsqueda flotante similar a Google Maps para buscar destinos.

**Características:**
- Input responsive (flotante en móvil, integrada en desktop)
- Botón de limpieza rápida (X)
- Botón de geolocalización integrado
- Focus states visuales
- Soporte para búsqueda por texto

**Props:**
```tsx
interface FloatingSearchBarProps {
  onSearch: (query: string) => void  // Callback cuando el usuario busca
  onLocationClick: () => void         // Callback al hacer clic en ubicación
  placeholder?: string                // Placeholder personalizado
  className?: string                  // Clases Tailwind adicionales
}
```

**Ejemplo de uso:**
```tsx
<FloatingSearchBar
  onSearch={(query) => console.log("Buscando:", query)}
  onLocationClick={() => getCurrentLocation()}
  placeholder="¿Dónde quieres ir?"
/>
```

---

### 3. RouteResultCard
**Ubicación:** `components/map/route-result-card.tsx`

Card compacta para mostrar resultados de rutas seguras con información de seguridad.

**Características:**
- Grid de 3 columnas: Tiempo, Distancia, Seguridad
- Indicadores de color según nivel de seguridad (verde, ámbar, rojo)
- Información contextual de precaución
- Botón para iniciar navegación
- Expandible en desktop con detalles

**Props:**
```tsx
interface RouteResultCardProps {
  destination: string                 // Nombre del destino
  duration: string                    // Tiempo estimado (ej: "15 min")
  distance: string                    // Distancia (ej: "2.5 km")
  safetyLevel: "high" | "medium" | "low"  // Nivel de seguridad
  estimatedTime?: string              // Tiempo estimado alternativo
  onNavigate?: () => void             // Callback al iniciar navegación
  onClose?: () => void                // Callback para cerrar
  isExpanded?: boolean                // Estado expandido (desktop)
  onToggleExpand?: () => void         // Callback para expandir/contraer
}
```

**Ejemplo de uso:**
```tsx
<RouteResultCard
  destination="Calle Principal 123"
  duration="15 min"
  distance="2.5 km"
  safetyLevel="high"
  onNavigate={() => startNavigation()}
  onClose={() => setShowResult(false)}
/>
```

---

### 4. CollapsibleLegend
**Ubicación:** `components/map/collapsible-legend.tsx`

Leyenda colapsable reutilizable para mostrar información de capas del mapa.

**Características:**
- Modo móvil: Sheet con scroll y header sticky
- Modo desktop: Card flotante con collapse/expand animado
- Items con color, label y descripción
- Máximo contraste y accesibilidad
- Smooth animations

**Props:**
```tsx
interface CollapsibleLegendProps {
  items: LegendItem[]         // Array de items con {color, label, description}
  title: string               // Título de la leyenda
  icon?: React.ReactNode      // Emoji o icono
  mobile?: boolean            // Modo móvil (true) o desktop (false)
  onClose?: () => void        // Callback para cerrar (móvil)
}

interface LegendItem {
  color: string               // Color hex/rgb
  label: string               // Texto del label
  description?: string        // Descripción adicional
}
```

**Ejemplo de uso:**
```tsx
const legendItems = [
  { color: "#22c55e", label: "Muy Seguro", description: "Bajo riesgo" },
  { color: "#ef4444", label: "Alto Riesgo", description: "Riesgo significativo" },
]

// Desktop
<CollapsibleLegend
  items={legendItems}
  title="Mapa de Riesgo"
  icon="🗺️"
  mobile={false}
/>

// Móvil en Sheet
<CollapsibleLegend
  items={legendItems}
  title="Mapa de Riesgo"
  icon="🗺️"
  mobile={true}
  onClose={() => setShowLegend(false)}
/>
```

---

## Patrones de Implementación

### Patrón 1: Navbar con Navegación Inferior (Móvil)

```tsx
export default function MapPage() {
  return (
    <div className="flex flex-col h-[100dvh]">
      <Navbar backToHome />
      {/* El navbar automáticamente añade MobileNavTabs si isMapPage */}
      
      <main className="flex-1 pt-14 pb-20 md:pb-0 md:pt-16">
        {/* Contenido principal */}
      </main>
    </div>
  )
}
```

### Patrón 2: Sheet Modal con FAB

```tsx
export default function RoutesPage() {
  const [isPanelOpen, setIsPanelOpen] = useState(false)

  return (
    <div className="relative flex-1">
      {/* Mapa */}
      <div className="absolute inset-0">Map Component</div>

      {/* FAB + Sheet */}
      <div className="lg:hidden absolute bottom-20 right-4 z-40">
        <Sheet open={isPanelOpen} onOpenChange={setIsPanelOpen}>
          <SheetTrigger asChild>
            <Button className="rounded-full w-14 h-14 shadow-lg shadow-primary/30">
              <Settings2 className="w-6 h-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="max-h-[85vh]">
            {/* Handle bar */}
            <div className="flex justify-center pt-3 pb-2 shrink-0">
              <div className="w-10 h-1.5 rounded-full bg-muted-foreground/30" />
            </div>
            {/* Contenido */}
          </SheetContent>
        </Sheet>
      </div>
    </div>
  )
}
```

### Patrón 3: Componentes Responsivos (Mobile + Desktop)

```tsx
// Mobile legend
{isMobile && (
  <Sheet open={showLegend} onOpenChange={setShowLegend}>
    <SheetTrigger asChild>
      <Button className="rounded-full w-14 h-14">
        <Info className="w-6 h-6" />
      </Button>
    </SheetTrigger>
    <SheetContent side="bottom" className="max-h-[85vh]">
      <CollapsibleLegend
        items={items}
        title="Leyenda"
        mobile={true}
        onClose={() => setShowLegend(false)}
      />
    </SheetContent>
  </Sheet>
)}

// Desktop legend
{!isMobile && (
  <CollapsibleLegend
    items={items}
    title="Leyenda"
    mobile={false}
  />
)}
```

---

## Espaciado y Responsive

### Padding de Contenido Principal
```tsx
// Móvil: Evitar nav inferior (pb-20) y superior (pt-14)
// Desktop: Solo superior (pt-16), sin inferior
<main className="pt-14 pb-20 md:pb-0 md:pt-16">
  {children}
</main>
```

### Posicionamiento de FAB
```tsx
// Móvil: bottom-20 (evita nav inferior de 16*4=64px más margen)
// Desktop: hidden (usa panel lateral)
<div className="lg:hidden absolute bottom-20 right-4 z-40">
  {fab}
</div>
```

---

## Mejores Prácticas

1. **Siempre usar `z-40` o `z-50`** para FABs y sheets
2. **Touch targets mínimo 44x44px** en móvil
3. **Usar `shadow-lg shadow-primary/30`** para FABs premium
4. **Handle bars visibles** en sheets (w-10 h-1.5)
5. **Indicadores animados** para feedback visual
6. **Tooltips** en iconos únicamente (móvil)
7. **Aria-labels** en todos los botones y controles
8. **Screen reader only text** con clase `sr-only`

---

## Breakpoints Utilizados

- `md:` (768px) - Cambio principal de móvil a desktop
- `lg:` (1024px) - Cambios de layout más complejos
- `xl:` (1280px) - Ajustes finos de ancho

---

## Animaciones y Transiciones

- **Transiciones de 200-300ms** para cambios suaves
- **`active:scale-95`** para feedback en botones
- **Underlines animados** con `transition-all duration-300`
- **Opacity transitions** para fade in/out

Consulta los componentes específicos para ejemplos de implementación.
