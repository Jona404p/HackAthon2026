"use client"

import { useState } from "react"
import { Search, MapPin, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface FloatingSearchBarProps {
  onSearch: (query: string) => void
  onLocationClick: () => void
  placeholder?: string
  className?: string
}

export function FloatingSearchBar({
  onSearch,
  onLocationClick,
  placeholder = "¿Dónde quieres ir?",
  className,
}: FloatingSearchBarProps) {
  const [value, setValue] = useState("")
  const [isFocused, setIsFocused] = useState(false)

  const handleClear = () => {
    setValue("")
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (value.trim()) {
      onSearch(value)
    }
  }

  return (
    <div
      className={cn(
        "fixed md:relative left-0 right-0 z-40 md:z-30",
        "bottom-auto md:bottom-auto top-20 md:top-0",
        className
      )}
    >
      <form
        onSubmit={handleSearch}
        className="flex items-center gap-2 px-4 py-3 md:px-0 md:py-0 bg-background/95 md:bg-transparent backdrop-blur-sm md:backdrop-blur-none border-b border-border/40 md:border-0"
      >
        <div
          className={cn(
            "flex-1 flex items-center gap-2 rounded-2xl border border-border/60 bg-background px-4 py-3 transition-all",
            isFocused && "border-primary/40 shadow-lg shadow-primary/5"
          )}
        >
          <Search className="w-4 h-4 text-muted-foreground shrink-0" aria-hidden="true" />
          <Input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={placeholder}
            className="border-0 bg-transparent px-0 text-sm placeholder:text-muted-foreground focus-visible:outline-none"
            aria-label="Buscar destino"
          />
          {value && (
            <button
              type="button"
              onClick={handleClear}
              className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
              aria-label="Limpiar búsqueda"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onLocationClick}
          className="rounded-full hover:bg-secondary"
          title="Usar mi ubicación"
          aria-label="Usar mi ubicación actual"
        >
          <MapPin className="w-5 h-5" />
        </Button>
      </form>
    </div>
  )
}
