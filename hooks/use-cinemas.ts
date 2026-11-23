import { useEffect, useState } from "react"
import { ApiError, api } from "@/lib/api"
import type { Cinema } from "@/types/cinema"

/** Ejecuta `fetcher` al montar (y cuando cambian `deps`) y expone datos, error y carga. */
function useFetch<T>(fetcher: () => Promise<T>, deps: unknown[]) {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<unknown>(null)
  const [isLoading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(null)
    fetcher()
      .then((d) => active && setData(d))
      .catch((e) => active && setError(e))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, deps)

  return { data, error, isLoading }
}

/**
 * Últimos datos conocidos de cada cine, en memoria mientras la pestaña está abierta.
 * Los llenan la lista de cines y los guardados del editor; así la vista de un rack se muestra al instante
 * en vez de pasar por la pantalla de carga, y se actualiza en segundo plano.
 */
const known = new Map<string, Cinema>()

export function rememberCinema(cinema: Cinema) {
  known.set(cinema.id, cinema)
}

export function useCinemas() {
  const { data, ...rest } = useFetch(() => api.getCinemas().then((list) => (list.forEach(rememberCinema), list)), [])
  return { cinemas: data ?? [], ...rest }
}

export function useCinema(id: string) {
  const cached = known.get(id) ?? null
  const { data, error, isLoading } = useFetch(() => api.getCinema(id).then((c) => (rememberCinema(c), c)), [id])
  const notFound = error instanceof ApiError && error.status === 404
  if (notFound) known.delete(id)
  return {
    // Mientras llega la versión del servidor se muestra la conocida
    cinema: notFound ? null : (data ?? cached),
    // Si ya había datos, un error de red no tapa la pantalla; que el cine ya no exista, sí
    error: notFound || !cached ? error : null,
    isLoading: isLoading && !cached,
  }
}
