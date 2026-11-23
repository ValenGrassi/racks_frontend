"use client"

import { History, LogIn, LogOut } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useToast } from "@/components/ui/toast"
import { useAppNav } from "@/lib/navigation"
import { useSession } from "@/lib/session"

/** Botón de ingreso o, con sesión iniciada, el avatar con el menú de la cuenta */
export function AccountMenu() {
  const { ready, loggedIn, isAdmin, logout } = useSession()
  const { go } = useAppNav()
  const notify = useToast()

  // Mientras se lee la sesión guardada, un lugar reservado (evita que el botón cambie de golpe)
  if (!ready) return <span className="ml-1 size-[30px] rounded-full bg-muted" aria-hidden />

  if (!loggedIn) {
    return (
      <button
        onClick={() => go("login")}
        aria-label="Iniciar sesión"
        className="ml-1 flex h-[34px] items-center gap-2 rounded-[10px] bg-surface-2 px-3 text-[13px] font-medium text-fg shadow-[inset_0_0_0_1px_var(--line)] transition-colors hover:bg-muted"
      >
        <LogIn className="size-4" />
        <span className="hidden sm:inline">Iniciar sesión</span>
      </button>
    )
  }

  const handleLogout = () => {
    logout()
    notify({ tone: "info", title: "Sesión cerrada" })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button aria-label="Cuenta: Usuario Admin" className="ml-1 rounded-full transition-[filter] hover:brightness-110">
          <Avatar />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={10}>
        <div className="flex items-center gap-2.5 px-2 pt-1.5 pb-2.5">
          <Avatar />
          <div className="min-w-0">
            <p className="text-[13.5px] font-medium text-fg">Usuario Admin</p>
            <p className="truncate text-[12px] text-fg-3">admin@cinemark.com</p>
          </div>
        </div>
        <DropdownMenuSeparator />
        {isAdmin && (
          <DropdownMenuItem onClick={() => go("logs")}>
            <History />
            Registro de actividad
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={handleLogout} className="text-critical-ink focus:bg-critical-wash focus:text-critical-ink [&_svg]:!text-critical-ink">
          <LogOut />
          Cerrar sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function Avatar() {
  return (
    <span className="flex size-[30px] shrink-0 items-center justify-center rounded-full bg-[linear-gradient(150deg,#9cc0ff,#4f7fe8)] text-[10.5px] font-bold tracking-wide text-[#0b1530]">
      UA
    </span>
  )
}
