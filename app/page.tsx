"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { CinemaList } from "@/components/cinema-list"
import { LeaveDialog } from "@/components/leave-dialog"
import { LoginPage } from "@/components/login-page"
import { LogsPage } from "@/components/logs-page"
import { RackConfig } from "@/components/rack-config"
import { RackEditor } from "@/components/rack-editor"
import { rememberCinema, useCinemas } from "@/hooks/use-cinemas"
import { NavProvider, type NavTarget, type View } from "@/lib/navigation"
import { useSession } from "@/lib/session"
import type { Cinema } from "@/types/cinema"

/**
 * Página principal. Cambia de pantalla según `view`:
 * lista de cines → login / registro de actividad / editor de rack → configuración del rack.
 * La vista de un rack es otra ruta (/racks/[id]); desde ahí se vuelve con /?editar=<id> o /?vista=registro.
 */
export default function HomePage() {
  const router = useRouter()
  const session = useSession()
  const { cinemas, isLoading, error } = useCinemas()
  const [view, setView] = useState<View>("list")
  const [selected, setSelected] = useState<Cinema | null>(null)
  // Pedido que llegó por la URL, pendiente hasta que carguen los datos o la sesión
  const intent = useRef<{ editar: string | null; vista: string | null } | null>(null)
  // Cambios sin guardar en el editor o la configuración, y la salida que espera confirmación
  const [dirty, setDirty] = useState(false)
  const [pendingLeave, setPendingLeave] = useState<(() => void) | null>(null)

  const backToList = () => {
    setSelected(null)
    setView("list")
  }

  const openEditor = (cinema: Cinema) => {
    setSelected(cinema)
    setView("edit")
  }

  /** Salir de la pantalla actual; si hay cambios sin guardar, primero se pide confirmación */
  const leave = (action: () => void) => {
    if ((view === "edit" || view === "config") && dirty) setPendingLeave(() => action)
    else action()
  }

  const confirmLeave = () => {
    const action = pendingLeave
    setPendingLeave(null)
    setDirty(false)
    action?.()
  }

  // Cada pantalla arranca desde arriba
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [view])

  // Cerrar o recargar la pestaña con cambios sin guardar también avisa (lo muestra el navegador)
  useEffect(() => {
    if (!dirty) return
    const warn = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener("beforeunload", warn)
    return () => window.removeEventListener("beforeunload", warn)
  }, [dirty])

  // Leer /?editar=<id> o /?vista=... una sola vez y limpiar la URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (!params.toString()) return
    intent.current = { editar: params.get("editar"), vista: params.get("vista") }
    window.history.replaceState(null, "", "/")
    if (intent.current.vista === "login") setView("login")
  }, [])

  useEffect(() => {
    const id = intent.current?.editar
    if (!id || isLoading) return
    const cinema = cinemas.find((c) => c.id === id)
    if (cinema) openEditor(cinema)
    intent.current!.editar = null
  }, [cinemas, isLoading])

  useEffect(() => {
    if (intent.current?.vista !== "registro" || !session.ready) return
    if (session.isAdmin) setView("logs")
    intent.current.vista = null
  }, [session.ready, session.isAdmin])

  // El registro de actividad es solo para el admin: si cierra sesión, volver a la lista
  useEffect(() => {
    if (view === "logs" && session.ready && !session.isAdmin) setView("list")
  }, [view, session.ready, session.isAdmin])

  const handleLogin = (email: string, password: string) => {
    session.login(email, password)
    setView("list")
  }

  const go = (target: NavTarget) => leave(() => (target === "list" ? backToList() : setView(target)))

  /** Vista del rack. Si se pasan datos nuevos (recién guardados), se muestran al instante. */
  const showRack = (cinema: Cinema) => {
    rememberCinema(cinema)
    router.push(`/racks/${cinema.id}`)
  }

  let screen
  if (view === "login") screen = <LoginPage onLogin={handleLogin} onCancel={backToList} />
  else if (view === "logs") screen = <LogsPage />
  else if (view === "edit" && selected)
    screen = (
      <RackEditor
        cinema={selected}
        onBack={() => leave(backToList)}
        onOpenRack={() => leave(() => router.push(`/racks/${selected.id}`))}
        onOpenConfig={() => leave(() => setView("config"))}
        onSaved={showRack}
        onDirtyChange={setDirty}
      />
    )
  else if (view === "config" && selected)
    screen = (
      <RackConfig
        cinema={selected}
        onBack={() => leave(backToList)}
        onOpenRack={() => leave(() => router.push(`/racks/${selected.id}`))}
        onSaved={showRack}
        onDirtyChange={setDirty}
      />
    )
  else screen = <CinemaList cinemas={cinemas} isLoading={isLoading} error={error} onEditCinema={openEditor} />

  return (
    <NavProvider value={{ view, go }}>
      {screen}
      <LeaveDialog open={!!pendingLeave} onStay={() => setPendingLeave(null)} onLeave={confirmLeave} />
    </NavProvider>
  )
}
