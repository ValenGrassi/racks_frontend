"use client"

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react"

// TODO: el login es simulado (la API no pide contraseña). Esta cuenta es la única que ve el Registro de actividad.
const ADMIN_EMAIL = "valengrassi7@gmail.com"
const ADMIN_PASSWORD = "123456"

/** La sesión se guarda en la pestaña del navegador: dura hasta cerrar sesión o cerrar la pestaña. */
const STORAGE_KEY = "sar-session"

interface Session {
  /** false hasta leer la sesión guardada (evita mostrar "Iniciar sesión" un instante al recargar) */
  ready: boolean
  loggedIn: boolean
  isAdmin: boolean
  login: (email: string, password: string) => void
  logout: () => void
}

const SessionContext = createContext<Session>({
  ready: false,
  loggedIn: false,
  isAdmin: false,
  login: () => {},
  logout: () => {},
})

export function SessionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState({ ready: false, loggedIn: false, isAdmin: false })

  // sessionStorage solo existe en el navegador
  useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "null")
      setState({ ready: true, loggedIn: !!saved?.loggedIn, isAdmin: !!saved?.isAdmin })
    } catch {
      setState((prev) => ({ ...prev, ready: true }))
    }
  }, [])

  const save = useCallback((loggedIn: boolean, isAdmin: boolean) => {
    setState({ ready: true, loggedIn, isAdmin })
    try {
      if (loggedIn) sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ loggedIn, isAdmin }))
      else sessionStorage.removeItem(STORAGE_KEY)
    } catch {
      // almacenamiento bloqueado: la sesión dura hasta recargar
    }
  }, [])

  const login = useCallback((email: string, password: string) => save(true, email === ADMIN_EMAIL && password === ADMIN_PASSWORD), [save])
  const logout = useCallback(() => save(false, false), [save])

  return <SessionContext.Provider value={{ ...state, login, logout }}>{children}</SessionContext.Provider>
}

export function useSession() {
  return useContext(SessionContext)
}
