"use client"

import { History, LayoutGrid } from "lucide-react"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { useAppNav } from "@/lib/navigation"
import { useSession } from "@/lib/session"
import { cn } from "@/lib/utils"
import { AccountMenu } from "./account-menu"
import { Brand } from "./brand"

/**
 * Menú flotante de todas las pantallas: logo, secciones (el Registro de actividad solo para el admin),
 * tema y cuenta. Queda fijo arriba al hacer scroll.
 */
export function AppHeader() {
  const { view, go } = useAppNav()
  const { isAdmin } = useSession()

  const items = [
    { label: "Ubicaciones", icon: LayoutGrid, active: view !== "logs", onClick: () => go("list") },
    ...(isAdmin ? [{ label: "Registro de actividad", icon: History, active: view === "logs", onClick: () => go("logs") }] : []),
  ]

  return (
    <header className="sticky top-0 z-40 flex justify-center px-3 pt-3 sm:pt-4">
      <nav aria-label="Principal" className="glass flex h-[52px] w-full max-w-fit items-center gap-1 rounded-2xl py-0 pr-2 pl-2.5 sm:gap-1.5">
        <button onClick={() => go("list")} className="flex items-center rounded-xl py-1 pr-1.5 transition-opacity hover:opacity-90" aria-label="SAR · Inicio">
          <Brand compact />
        </button>
        <span className="mx-2 h-6 w-px bg-line sm:mx-3" aria-hidden />

        {items.map(({ label, icon: Icon, active, onClick }) => (
          <button
            key={label}
            onClick={onClick}
            aria-current={active ? "page" : undefined}
            title={label}
            className={cn(
              "flex h-[34px] items-center gap-2 rounded-[10px] px-2.5 text-[13.5px] transition-colors sm:px-3.5",
              active ? "bg-surface-2 text-fg shadow-[inset_0_0_0_1px_var(--line)]" : "text-fg-3 hover:bg-muted hover:text-fg"
            )}
          >
            <Icon className="size-4 sm:hidden" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}

        <span className="mx-1.5 h-5 w-px bg-line sm:mx-2" aria-hidden />
        <ThemeToggle />
        <AccountMenu />
      </nav>
    </header>
  )
}
