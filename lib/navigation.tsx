"use client"

import { createContext, useContext } from "react"
import { useRouter } from "next/navigation"

/** Pantallas de la página principal (app/page.tsx) */
export type View = "list" | "login" | "logs" | "edit" | "config"

/** Destinos del menú superior */
export type NavTarget = "list" | "logs" | "login"

interface AppNav {
  /** Pantalla actual de la página principal; null en otras rutas (vista de un rack) */
  view: View | null
  go: (target: NavTarget) => void
}

const NavContext = createContext<AppNav | null>(null)

/** Lo provee app/page.tsx para que el menú cambie de pantalla sin recargar */
export const NavProvider = NavContext.Provider

/** Parámetros de la URL que entiende la página principal: /?vista=registro, /?vista=login, /?editar=<id> */
export const homeUrl = {
  list: "/",
  logs: "/?vista=registro",
  login: "/?vista=login",
  edit: (cinemaId: string) => `/?editar=${encodeURIComponent(cinemaId)}`,
}

/** Navegación del menú. Fuera de la página principal, navega a "/" con el parámetro que corresponde. */
export function useAppNav(): AppNav {
  const ctx = useContext(NavContext)
  const router = useRouter()
  return ctx ?? { view: null, go: (target) => router.push(homeUrl[target]) }
}
