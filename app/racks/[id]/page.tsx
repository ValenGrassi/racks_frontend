"use client"

import { useParams, useRouter } from "next/navigation"
import { CloudOff, RotateCw } from "lucide-react"
import { AppHeader } from "@/components/app-header"
import { NotFoundMessage } from "@/components/not-found-message"
import { RackDashboard } from "@/components/rack-dashboard"
import { Button } from "@/components/ui/button"
import { EmptyState, Skeleton } from "@/components/ui/panel"
import { useCinema } from "@/hooks/use-cinemas"
import { ApiError } from "@/lib/api"
import { CONTAINER, cn } from "@/lib/utils"

/** /racks/[id]: vista de un rack. Es la URL que se comparte con el QR. */
export default function RackPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { cinema, isLoading, error } = useCinema(id)
  const goHome = () => router.push("/")

  if (isLoading) return <RackSkeleton />

  if (error instanceof ApiError && error.status === 404) {
    return <NotFoundMessage code="Rack no encontrado" message="El rack solicitado no existe o no está disponible." />
  }

  if (error || !cinema) {
    return (
      <>
        <AppHeader />
        <div className={cn(CONTAINER, "pt-16")}>
          <div className="glass mx-auto max-w-lg rounded-2xl">
            <EmptyState icon={<CloudOff />} title="No se pudo cargar el cine">
              Revisá la conexión con el servidor y volvé a intentarlo.
              <div className="mt-5 flex justify-center gap-2">
                <Button variant="secondary" size="sm" onClick={goHome}>
                  Volver al inicio
                </Button>
                <Button size="sm" onClick={() => window.location.reload()}>
                  <RotateCw />
                  Reintentar
                </Button>
              </div>
            </EmptyState>
          </div>
        </div>
      </>
    )
  }

  return <RackDashboard cinema={cinema} onBack={goHome} />
}

/** Silueta de la vista del rack mientras cargan los datos */
function RackSkeleton() {
  return (
    <div aria-busy="true" aria-label="Cargando datos del cine">
      <AppHeader />
      <div className={cn(CONTAINER, "pt-8 md:pt-10")}>
        <Skeleton className="h-3 w-40" />
        <Skeleton className="mt-4 h-11 w-80 max-w-full" />
        <Skeleton className="mt-3 h-4 w-72" />
        <div className="glass mt-7 grid grid-cols-2 gap-6 rounded-2xl px-6 py-5 sm:grid-cols-5">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-2.5">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-9 w-20" />
            </div>
          ))}
        </div>
      </div>
      <div className={cn(CONTAINER, "grid gap-5 pt-6 lg:grid-cols-[minmax(0,384px)_minmax(0,1fr)] xl:grid-cols-[minmax(0,384px)_minmax(0,1fr)_minmax(0,340px)]")}>
        <div className="glass space-y-1.5 rounded-2xl p-4">
          <div className="mb-3 h-3 w-28 rounded bg-muted" />
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="h-11 animate-pulse rounded-lg bg-muted" style={{ animationDelay: `${i * 80}ms` }} />
          ))}
        </div>
        <div className="space-y-5">
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-36 rounded-2xl" />
        </div>
        <div className="hidden space-y-5 xl:block">
          <Skeleton className="h-40 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
        </div>
      </div>
    </div>
  )
}
