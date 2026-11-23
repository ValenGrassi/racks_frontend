import { AlertTriangle, Zap } from "lucide-react"
import { Meter } from "@/components/ui/meter"
import { MetricStrip, Panel, PanelHeader } from "@/components/ui/panel"
import { StatusTag } from "@/components/ui/status"
import { batteryMonthsLeft, totalPowerW, totalUpsVA, upsAutonomyHours, upsLoadPercent } from "@/lib/calculations"
import { TONES, autonomyTone, batteryTone, formatNumber, loadTone, toDateInput } from "@/lib/rack"
import { cn } from "@/lib/utils"
import type { Cinema } from "@/types/cinema"

const NETWORK_TYPES = ["switch", "router", "firewall"]

/** Resumen de energía para el encabezado de la vista del rack. Calculado con los datos cargados (no en vivo). */
export function EnergyOverview({ cinema }: { cinema: Cinema }) {
  const components = cinema.rackComponents
  const totalW = totalPowerW(components)
  const load = upsLoadPercent(components)
  const autonomy = upsAutonomyHours(components)
  const upsCount = components.filter((c) => c.type === "ups").length

  return (
    <MetricStrip
      items={[
        { label: "Consumo total", value: formatNumber(totalW), unit: "W", caption: `${components.length} ${components.length === 1 ? "equipo" : "equipos"}` },
        {
          label: "Autonomía estimada",
          value: formatNumber(autonomy),
          unit: "h",
          tone: autonomyTone(autonomy),
          caption: `Con carga actual de ${formatNumber(totalW)} W`,
        },
        { label: "Capacidad UPS", value: formatNumber(totalUpsVA(components)), unit: "VA", caption: `${upsCount} ${upsCount === 1 ? "unidad" : "unidades"}` },
        {
          label: "Carga de UPS",
          value: load,
          unit: "%",
          tone: loadTone(load),
          extra: <Meter value={load} tone={loadTone(load)} className="mt-2.5 h-1 max-w-32" />,
        },
        // TODO: mostrar el valor real cuando haya un sensor de temperatura conectado
        {
          label: "Temperatura del rack",
          value: <span className="text-[17px] font-normal tracking-normal text-fg-3 sm:text-[19px]">Sin sensor</span>,
          caption: "Todavía no hay un sensor conectado",
        },
      ]}
    />
  )
}

/** Distribución del consumo por tipo de equipo y advertencias de energía. */
export function EnergyCard({ cinema }: { cinema: Cinema }) {
  const components = cinema.rackComponents
  const totalW = totalPowerW(components)
  const load = upsLoadPercent(components)
  const autonomy = upsAutonomyHours(components)

  const breakdown = [
    { label: "Servidores", color: "bg-chart-1", watts: totalPowerW(components.filter((c) => c.type === "server")) },
    { label: "Red", color: "bg-chart-2", watts: totalPowerW(components.filter((c) => NETWORK_TYPES.includes(c.type))) },
    {
      label: "Otros",
      color: "bg-chart-3",
      watts: totalPowerW(components.filter((c) => c.type !== "server" && c.type !== "ups" && !NETWORK_TYPES.includes(c.type))),
    },
  ]

  return (
    <Panel className="px-5 py-4 sm:px-6">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-[14px] font-semibold tracking-[-0.01em] text-fg">Distribución del consumo</h2>
        <span className="text-[12.5px] text-fg-3 tabular-nums">{formatNumber(totalW)} W · calculado con los datos del rack</span>
      </div>

      {(load > 50 || autonomy < 1) && (
        <div className="mt-3.5 flex gap-2.5 rounded-xl bg-critical-wash px-3.5 py-3 text-critical-ink shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--critical)_25%,transparent)]">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <div className="text-[13px]">
            <p className="font-medium">Advertencias de energía</p>
            <ul className="mt-0.5 space-y-0.5 opacity-90">
              {load > 50 && <li>Carga UPS alta ({load}%): considerar reducir consumo.</li>}
              {autonomy < 1 && <li>Autonomía baja: considerar agregar baterías.</li>}
            </ul>
          </div>
        </div>
      )}

      <div className="mt-4 flex h-2 gap-[3px] overflow-hidden rounded-full bg-muted">
        {totalW > 0 &&
          breakdown.map(
            (part) =>
              part.watts > 0 && (
                <div key={part.label} className={cn("h-full rounded-full transition-[width] duration-500", part.color)} style={{ width: `${(part.watts / totalW) * 100}%` }} />
              )
          )}
      </div>
      <ul className="mt-3.5 flex flex-wrap gap-x-7 gap-y-2">
        {breakdown.map((part) => (
          <li key={part.label} className="flex items-center gap-2 text-[13px]">
            <span className={cn("size-2 rounded-full", part.color)} />
            <span className="text-fg-2">{part.label}</span>
            <span className="font-medium text-fg tabular-nums">
              {formatNumber(part.watts)} <span className="font-normal text-fg-3">W</span>
            </span>
            {totalW > 0 && <span className="text-[12px] text-fg-4 tabular-nums">{Math.round((part.watts / totalW) * 100)}%</span>}
          </li>
        ))}
      </ul>
    </Panel>
  )
}

/** Unidades UPS del rack con su estado y la vida útil de la batería. */
export function BatteryCard({ cinema }: { cinema: Cinema }) {
  const upsList = cinema.rackComponents.filter((c) => c.type === "ups")

  return (
    <Panel className="overflow-hidden">
      <PanelHeader icon={<Zap />} title="Baterías UPS" description={`${upsList.length} ${upsList.length === 1 ? "unidad" : "unidades"} · vida útil de 48 meses`} />
      {upsList.length === 0 ? (
        <p className="px-5 pb-5 text-[13px] text-fg-4">Sin UPS registrados en este rack.</p>
      ) : (
        <ul className="divide-y divide-line border-t border-line">
          {upsList.map((ups) => {
            const months = ups.batteryInstallDate ? batteryMonthsLeft(ups.batteryInstallDate) : null
            const tone = months === null ? "neutral" : batteryTone(months)
            return (
              <li key={ups.id} className="px-5 py-3.5">
                <div className="flex items-center justify-between gap-3">
                  <span className="min-w-0 truncate text-[13.5px] font-medium text-fg">{ups.name}</span>
                  <StatusTag status={ups.status} />
                </div>
                {months === null ? (
                  <p className="mt-1.5 text-[12.5px] text-fg-4">Sin fecha de instalación de batería</p>
                ) : (
                  <>
                    <div className="mt-2 flex items-baseline justify-between gap-3">
                      <span className="text-[12px] text-fg-3">
                        {ups.capacityVA ? `${formatNumber(ups.capacityVA)} VA · ` : ""}instalada {toDateInput(ups.batteryInstallDate!)}
                      </span>
                      <span className={cn("shrink-0 text-[20px] leading-none font-light tracking-[-0.04em] tabular-nums", TONES[tone].text)}>
                        {months === 0 ? <span className="text-[13px] font-medium tracking-normal whitespace-nowrap">Cambiar baterías</span> : months}
                        {months > 0 && <span className="ml-1 text-[12px] font-normal tracking-normal text-fg-3">meses</span>}
                      </span>
                    </div>
                    <Meter value={months} max={48} tone={tone} className="mt-2 h-1" />
                  </>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </Panel>
  )
}
