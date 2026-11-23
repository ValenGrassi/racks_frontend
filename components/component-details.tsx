import type { ReactNode } from "react"
import { AlertTriangle, Maximize2, MousePointerClick } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Meter } from "@/components/ui/meter"
import { Panel } from "@/components/ui/panel"
import { StatusTag } from "@/components/ui/status"
import { batteryMonthsLeft, isBatteryDue } from "@/lib/calculations"
import { COMPONENT_TYPES, FALLBACK_ICON, TONES, batteryTone, formatNumber, formatUnit, hasPorts, hasStatus, resolvePorts, toDateInput } from "@/lib/rack"
import { cn } from "@/lib/utils"
import type { RackComponent } from "@/types/cinema"
import { PortDetailsModal } from "./port-details-modal"

/** Inspector: datos del componente elegido en el dibujo del rack. */
export function ComponentDetails({ component }: { component: RackComponent | null }) {
  if (!component) {
    return (
      <div className="flex items-center gap-4 rounded-2xl border border-dashed border-line-2 px-5 py-5">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-line bg-surface-2 text-accent">
          <MousePointerClick className="size-5" />
        </div>
        <div>
          <p className="text-[14.5px] font-semibold text-fg">Seleccioná un componente</p>
          <p className="mt-0.5 text-[13px] text-fg-3">Hacé clic en cualquier router, switch, patchera o UPS del rack para ver sus detalles.</p>
        </div>
      </div>
    )
  }

  const { specs, type } = component
  const typeInfo = COMPONENT_TYPES[type]
  const Icon = typeInfo?.icon ?? FALLBACK_ICON
  // Puertos según la regla única (detalle cargado o, si no hay, los primeros N en uso)
  const portList = hasPorts(type) ? resolvePorts(specs) : []
  const connections = portList.filter((p) => p.isConnected).length
  const showPower = type !== "ups" && type !== "patch-panel" && !!component.powerConsumption

  const properties: { label: string; value: ReactNode; accent?: boolean }[] = []
  if (type === "server") {
    if (specs?.cpu) properties.push({ label: "CPU", value: specs.cpu })
    if (specs?.ram) properties.push({ label: "RAM", value: specs.ram })
    if (specs?.storage) properties.push({ label: "Almacenamiento", value: specs.storage })
  }
  if (portList.length > 0) {
    properties.push({ label: "Total de puertos", value: portList.length })
    properties.push({ label: "Conexiones activas", value: connections, accent: true })
    properties.push({ label: "Puertos libres", value: portList.length - connections })
  }
  if (type === "ups" && component.capacityVA) properties.push({ label: "Capacidad", value: `${formatNumber(component.capacityVA)} VA` })
  if (showPower) properties.push({ label: "Consumo de energía", value: `${formatNumber(component.powerConsumption!)} W` })
  // Los textos largos (CPU, discos) van en tamaño normal; los números, grandes y finos
  const isNumeric = (value: ReactNode) => typeof value === "number" || (typeof value === "string" && value.length <= 10)

  return (
    <Panel className="px-5 pt-5 pb-5 sm:px-6">
      <header className="flex flex-wrap items-start gap-4">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-[14px] bg-accent-wash text-accent shadow-[inset_0_0_0_1px_var(--accent-line),0_10px_24px_-14px_var(--accent)]">
          <Icon className="size-[22px] stroke-[1.6]" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <h2 className="text-[21px] font-semibold tracking-[-0.03em] text-fg">{component.name}</h2>
            {hasStatus(type) && <StatusTag status={component.status} />}
          </div>
          <p className="mt-1 text-[13px] text-fg-3">
            {formatUnit(component.position)} · {typeInfo?.label ?? type}
            {component.model && ` · ${component.model}`}
          </p>
        </div>
        {portList.length > 0 && (
          <PortDetailsModal component={component}>
            <Button variant="secondary" size="sm">
              <Maximize2 className="size-3.5" />
              Ver todos los puertos
            </Button>
          </PortDetailsModal>
        )}
      </header>

      {component.description && <p className="mt-4 text-[14px] leading-relaxed text-fg-2">{component.description}</p>}

      {properties.length > 0 && (
        <dl className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-[repeat(auto-fit,minmax(112px,1fr))]">
          {properties.map((p) => (
            <div key={p.label} className="min-w-0 rounded-xl bg-subtle px-3.5 py-3 shadow-[inset_0_0_0_1px_var(--line)]">
              <dt className="truncate text-[12px] text-fg-3">{p.label}</dt>
              <dd
                className={cn(
                  "mt-1 text-fg tabular-nums",
                  isNumeric(p.value) ? "text-[24px] leading-tight font-light tracking-[-0.04em]" : "text-[13.5px] font-medium",
                  p.accent && "text-accent"
                )}
              >
                {p.value}
              </dd>
            </div>
          ))}
        </dl>
      )}

      {portList.length > 0 && (
        <div className="mt-5">
          <div className="mb-2.5 flex items-center justify-between gap-3 text-[12.5px]">
            <p className="font-medium text-fg-2">Mapa de puertos</p>
            <p className="text-fg-3">
              {connections} en uso · {portList.length - connections} libres
            </p>
          </div>
          {/* Un casillero por puerto, en filas de 12 (24 en pantallas anchas), como el frente de un switch */}
          <div className="grid grid-cols-12 gap-1 sm:grid-cols-24">
            {portList.map((port) => (
                <span
                  key={port.portNumber}
                  title={
                    port.isConnected ? `Puerto ${port.portNumber}: en uso${port.connectedTo ? ` → ${port.connectedTo}` : ""}` : `Puerto ${port.portNumber}: libre`
                  }
                  className={cn(
                    "h-3 rounded-[3px]",
                    port.isConnected ? "bg-accent shadow-[0_0_8px_-2px_var(--accent)]" : "bg-muted shadow-[inset_0_0_0_1px_var(--line)]"
                  )}
                />
              ))}
          </div>
        </div>
      )}

      {type === "ups" && component.batteryInstallDate && <BatteryInfo installDate={component.batteryInstallDate} />}
    </Panel>
  )
}

function BatteryInfo({ installDate }: { installDate: string }) {
  const months = batteryMonthsLeft(installDate)
  const due = isBatteryDue(installDate)
  const tone = batteryTone(months)

  return (
    <div className="mt-5 rounded-xl bg-subtle p-4 shadow-[inset_0_0_0_1px_var(--line)]">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-[12px] text-fg-3">Batería</p>
          <p className={cn("mt-1 flex items-baseline gap-1.5 text-[30px] leading-none font-light tracking-[-0.045em] tabular-nums", TONES[tone].text)}>
            {months}
            <span className="text-[13px] font-normal tracking-normal text-fg-3">meses de vida útil</span>
          </p>
        </div>
        <p className="text-right text-[12px] text-fg-3">
          Instalada el
          <span className="block font-mono text-[12.5px] text-fg-2">{toDateInput(installDate)}</span>
        </p>
      </div>
      <Meter value={months} max={48} tone={tone} marks={[12]} className="mt-3.5" />
      {due && (
        <p className="mt-3 flex items-center gap-2 text-[13px] text-critical-ink">
          <AlertTriangle className="size-4" />
          Se recomienda reemplazar la batería
        </p>
      )}
    </div>
  )
}
