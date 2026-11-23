"use client"

import { Moon, Sun } from "lucide-react"
import { currentTheme, setTheme } from "@/lib/theme"
import { cn } from "@/lib/utils"

/**
 * Botón para pasar de modo claro a oscuro y viceversa.
 * No guarda estado en React: el ícono lo decide la clase .dark de <html>, así no hay desajustes al cargar.
 */
export function ThemeToggle({ className }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={() => setTheme(currentTheme() === "dark" ? "light" : "dark")}
      className={cn(
        "flex size-[34px] items-center justify-center rounded-[10px] text-fg-2 transition-colors hover:bg-muted hover:text-fg",
        className
      )}
      aria-label="Cambiar entre modo claro y oscuro"
      title="Modo claro / oscuro"
    >
      <Sun className="hidden size-4 dark:block" />
      <Moon className="size-4 dark:hidden" />
    </button>
  )
}
