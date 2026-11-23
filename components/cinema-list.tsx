"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { AlertTriangle, ChevronRight, CloudOff, PenLine, RotateCw, Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Meter } from "@/components/ui/meter"
import { EmptyState, MetricStrip, Skeleton } from "@/components/ui/panel"
import { Kbd, Tag } from "@/components/ui/status"
import { batteryMonthsLeft, isBatteryDue, totalPowerW, totalUpsVA, upsAutonomyHours } from "@/lib/calculations"
import { TONES, autonomyTone, batteryTone, formatDate, formatNumber, hasStatus } from "@/lib/rack"
import { cn } from "@/lib/utils"
import type { Cinema, RackComponent } from "@/types/cinema"
import { PageLayout } from "./page-layout"

interface CinemaListProps {
  cinemas: Cinema[]
  isLoading: boolean
  /** Error al cargar las ubicaciones (backend caído, red…) */
  error?: unknown
  onEditCinema: (cinema: Cinema) => void
}

/** Sin tildes y en minúsculas, para buscar "moron" y encontrar "Morón" */
const normalize = (text: string | null) =>
  (text ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()

/** UPS con batería por vencer o que no están en línea */
const countUpsAlerts = (cinema: Cinema) =>
  cinema.rackComponents.filter(
    (c) => c.type === "ups" && ((c.batteryInstallDate && isBatteryDue(c.batteryInstallDate)) || c.status !== "online")
  ).length

// Columnas de la tabla en pantallas anchas (debajo de xl cada fila se acomoda en bloques)
const COLUMNS = "xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1.2fr)_84px_92px_104px_minmax(0,0.9fr)_196px]"

/** Pantalla principal: todas las ubicaciones con el estado resumido de su rack. */
export function CinemaList({ cinemas, isLoading, error, onEditCinema }: CinemaListProps) {
  const [search, setSearch] = useState("")
  const searchRef = useRef<HTMLInputElement>(null)

  // "/" enfoca el buscador desde cualquier parte de la pantalla
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (e.key !== "/" || target.closest("input, textarea, [contenteditable]")) return
      e.preventDefault()
      searchRef.current?.focus()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  const filtered = cinemas
    .filter((c) => normalize(c.name).includes(normalize(search)) || normalize(c.location).includes(normalize(search)))
    .sort((a, b) => a.name.localeCompare(b.name))

  const allComponents = cinemas.flatMap((c) => c.rackComponents)
  // Las pacheras no tienen estado: no cuentan en "en línea"
  const activeComponents = allComponents.filter((c) => hasStatus(c.type))
  const totalAlerts = cinemas.reduce((sum, c) => sum + countUpsAlerts(c), 0)

  return (
    <PageLayout
      eyebrow="Infraestructura IT · Cinemark Hoyts"
      title="Ubicaciones"
      subtitle="Estado de los racks de servidores en todos los cines."
      overview={
        <MetricStrip
          loading={isLoading}
          items={[
            { label: "Cines", value: cinemas.length },
            {
              label: "Componentes en línea",
              value: activeComponents.filter((c) => c.status === "online").length,
              unit: `de ${activeComponents.length}`,
            },
            { label: "Alertas UPS", value: totalAlerts, tone: totalAlerts > 0 ? "critical" : undefined },
            { label: "Unidades UPS", value: allComponents.filter((c) => c.type === "ups").length },
          ]}
        />
      }
    >
      {/* Búsqueda */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="glass relative flex h-11 w-full items-center rounded-xl sm:max-w-[380px]">
          <span className="sr-only">Buscar</span>
          <Search className="pointer-events-none absolute left-3.5 size-4 text-fg-3" />
          <input
            ref={searchRef}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Escape" && setSearch("")}
            placeholder="Buscar por nombre o localidad"
            className="h-full w-full rounded-xl bg-transparent pr-11 pl-10 text-[14px] text-fg outline-none placeholder:text-fg-3 focus-visible:shadow-[0_0_0_3px_var(--accent-wash)] focus-visible:outline-none"
          />
          {search ? (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2.5 rounded-md p-1 text-fg-3 transition-colors hover:bg-muted hover:text-fg"
              aria-label="Limpiar búsqueda"
            >
              <X className="size-3.5" />
            </button>
          ) : (
            <Kbd className="pointer-events-none absolute right-3 hidden sm:inline-flex">/</Kbd>
          )}
        </label>
        {!isLoading && !error && (
          <p className="text-[13px] text-fg-3 tabular-nums">
            {filtered.length === cinemas.length ? `${cinemas.length} ubicaciones` : `${filtered.length} de ${cinemas.length} ubicaciones`}
          </p>
        )}
      </div>

      {/* Tabla */}
      <div className="glass overflow-hidden rounded-2xl">
        <div className={cn("hidden h-12 items-center gap-6 border-b border-line px-6 text-[12.5px] text-fg-3 xl:grid", COLUMNS)}>
          <span>Ubicación</span>
          <span>Baterías UPS</span>
          <span className="text-right">Consumo</span>
          <span className="text-right">Autonomía</span>
          <span className="text-right">Capacidad</span>
          <span>Rack</span>
          <span aria-hidden />
        </div>

        {isLoading ? (
          <ListSkeleton />
        ) : error ? (
          <EmptyState icon={<CloudOff />} title="No se pudieron cargar las ubicaciones">
            Revisá la conexión con el servidor y volvé a intentarlo.
            <div className="mt-5">
              <Button variant="secondary" size="sm" onClick={() => window.location.reload()}>
                <RotateCw />
                Reintentar
              </Button>
            </div>
          </EmptyState>
        ) : filtered.length === 0 ? (
          <EmptyState icon={<Search />} title={search ? "Sin resultados" : "Todavía no hay ubicaciones"}>
            {search ? (
              <>
                No hay ubicaciones que coincidan con “{search}”.
                <div className="mt-5">
                  <Button variant="secondary" size="sm" onClick={() => setSearch("")}>
                    Limpiar búsqueda
                  </Button>
                </div>
              </>
            ) : (
              "Cuando se carguen cines en el sistema van a aparecer acá."
            )}
          </EmptyState>
        ) : (
          <ol>
            {filtered.map((cinema) => (
              <CinemaRow key={cinema.id} cinema={cinema} onEdit={() => onEditCinema(cinema)} />
            ))}
          </ol>
        )}
      </div>
    </PageLayout>
  )
}

function CinemaRow({ cinema, onEdit }: { cinema: Cinema; onEdit: () => void }) {
  const components = cinema.rackComponents
  const upsList = components.filter((c) => c.type === "ups")
  const alerts = countUpsAlerts(cinema)
  const autonomy = upsAutonomyHours(components)
  const active = components.filter((c) => hasStatus(c.type))
  const online = active.filter((c) => c.status === "online").length
  const isEmpty = components.length === 0

  return (
    <li
      data-cinema={cinema.id}
      className={cn(
        "group relative grid gap-4 border-b border-line px-5 py-4 transition-colors duration-150 last:border-b-0 hover:bg-accent-wash md:grid-cols-2 md:gap-x-10 xl:items-center xl:gap-6 xl:px-6",
        isEmpty ? "xl:py-3" : "xl:py-4",
        COLUMNS
      )}
    >
      {/* Barra de acento al pasar el mouse */}
      <span className="absolute inset-y-0 left-0 w-0.5 bg-accent opacity-0 transition-opacity group-hover:opacity-100" aria-hidden />

      {/* Ubicación: el nombre es un enlace que cubre toda la fila */}
      <div className="min-w-0">
        <div className="flex min-w-0 items-center gap-2.5">
          <Link
            href={`/racks/${cinema.id}`}
            className="truncate text-[14.5px] font-semibold tracking-[-0.01em] text-fg outline-none after:absolute after:inset-0 after:content-[''] focus-visible:after:ring-2 focus-visible:after:ring-accent focus-visible:after:ring-inset"
          >
            {cinema.name}
          </Link>
          {alerts > 0 && (
            <Tag tone="critical" icon={AlertTriangle} className="shrink-0">
              {alerts} {alerts > 1 ? "alertas" : "alerta"} UPS
            </Tag>
          )}
          {isEmpty && <Tag className="shrink-0">Rack sin cargar</Tag>}
        </div>
        <p className="mt-0.5 truncate text-[12.5px] text-fg-3">{cinema.address}</p>
      </div>

      {/* Baterías de cada UPS */}
      <div className="min-w-0">
        <p className="mb-2 text-[12px] text-fg-3 xl:hidden">Baterías UPS</p>
        {isEmpty ? (
          <Empty />
        ) : upsList.length > 0 ? (
          <ul className="space-y-2">
            {upsList.map((ups) => (
              <BatteryLine key={ups.id} ups={ups} />
            ))}
          </ul>
        ) : (
          <p className="text-[12.5px] text-fg-4">Sin UPS registrados</p>
        )}
      </div>

      {/* Energía: en pantallas anchas cada cifra ocupa su columna; un guion si el rack está vacío */}
      <dl className="grid grid-cols-3 gap-4 xl:contents">
        <Metric label="Consumo" value={totalPowerW(components)} unit="W" empty={isEmpty} />
        <Metric label="Autonomía" value={autonomy} unit="h" toneClass={TONES[autonomyTone(autonomy)].text} empty={isEmpty} />
        <Metric label="Capacidad" value={totalUpsVA(components)} unit="VA" empty={isEmpty} />
      </dl>

      {/* Conteos y acciones */}
      <div className="flex items-center justify-between gap-3 border-t border-line pt-3 md:self-end md:border-t-0 md:pt-0 xl:contents">
        <div className="min-w-0 text-[12.5px] whitespace-nowrap">
          <p className={isEmpty ? "text-fg-4" : "text-fg-2"}>
            {isEmpty ? (
              "Sin equipos"
            ) : (
              <>
                <span className="tabular-nums">{online}</span> de <span className="tabular-nums">{active.length}</span> en línea
              </>
            )}
          </p>
          <p className="mt-0.5 text-[12px] text-fg-4">Actualizado {formatDate(cinema.lastUpdated)}</p>
        </div>
        <div className="relative z-10 flex shrink-0 justify-end gap-1">
          <Button variant="ghost" size="sm" onClick={onEdit}>
            <PenLine />
            Editar
          </Button>
          <Button asChild variant="secondary" size="sm">
            <Link href={`/racks/${cinema.id}`}>
              Ver rack
              <ChevronRight className="text-fg-3 transition-transform duration-150 group-hover:translate-x-0.5" />
            </Link>
          </Button>
        </div>
      </div>
    </li>
  )
}

function Empty() {
  return <span className="text-[13px] text-fg-4">—</span>
}

function Metric({ label, value, unit, toneClass, empty }: { label: string; value: number; unit: string; toneClass?: string; empty?: boolean }) {
  return (
    <div className="xl:text-right">
      <dt className="text-[12px] text-fg-3 xl:sr-only">{label}</dt>
      <dd className={cn("mt-0.5 text-[14px] font-medium tabular-nums xl:mt-0", empty ? "text-fg-4" : (toneClass ?? "text-fg"))}>
        {empty ? (
          "—"
        ) : (
          <>
            {formatNumber(value)}
            <span className="ml-0.5 text-[12px] font-normal text-fg-3">{unit}</span>
          </>
        )}
      </dd>
    </div>
  )
}

/** Vida restante de la batería de un UPS (48 meses = barra llena) */
function BatteryLine({ ups }: { ups: RackComponent }) {
  if (!ups.batteryInstallDate) {
    return (
      <li className="flex items-center justify-between gap-3 text-[12.5px]">
        <span className="truncate text-fg-2">{ups.name}</span>
        <span className="text-fg-4">Sin fecha</span>
      </li>
    )
  }

  const months = batteryMonthsLeft(ups.batteryInstallDate)
  const tone = batteryTone(months)

  return (
    <li className="text-[12.5px]">
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <span className="min-w-0 truncate text-fg-2" title={ups.name}>
          {ups.name}
        </span>
        <span className={cn("shrink-0 font-medium whitespace-nowrap tabular-nums", TONES[tone].text)}>
          {months === 0 ? "Cambiar baterías" : `${months} meses`}
        </span>
      </div>
      <Meter value={months} max={48} tone={tone} className="h-1" />
    </li>
  )
}

function ListSkeleton() {
  return (
    <div aria-busy="true" aria-label="Cargando ubicaciones">
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <div key={i} className={cn("grid gap-4 border-b border-line px-6 py-4 last:border-b-0 xl:items-center xl:gap-6", COLUMNS)}>
          <div className="space-y-2">
            <Skeleton className="h-4 w-44" />
            <Skeleton className="h-3 w-64 max-w-full" />
          </div>
          <Skeleton className="h-3 w-full" />
          <Skeleton className="hidden h-4 xl:block" />
          <Skeleton className="hidden h-4 xl:block" />
          <Skeleton className="hidden h-4 xl:block" />
          <Skeleton className="hidden h-8 w-28 xl:block" />
          <Skeleton className="h-8 w-40" />
        </div>
      ))}
    </div>
  )
}
