import type { KeyboardEvent } from "react"
import { isBatteryDue } from "@/lib/calculations"
import { COMPONENT_TYPES, STATUSES, hasPorts, hasStatus, resolvePorts } from "@/lib/rack"
import { cn } from "@/lib/utils"
import type { Cinema, RackComponent } from "@/types/cinema"

interface RackDiagramProps {
  cinema: Cinema
  selectedId?: RackComponent["id"] | null
  onSelect: (component: RackComponent) => void
}

// Medidas del dibujo (unidades del viewBox, que mide 320 de ancho)
const TOP = 10 // y del primer equipo
const GAP = 4 // separación entre equipos
const BODY_X = 42
const BODY_W = 236
const TEXT_X = BODY_X + 21 // nombre y puertos arrancan después del LED
const BASE_HEIGHT = 24 // equipo sin puertos: una sola línea con nombre y tipo
const PORTS_PER_ROW = 24 // como el frente de un switch real
const PORT_STEP = 8.45
const ROW_HEIGHT = 7.5
const MAX_NAME = 28 // los nombres más largos se recortan con "…"

// El área del rack es oscura en los dos temas: los colores del dibujo son fijos (blancos translúcidos y azul)
const HW = {
  rail: "rgb(255 255 255 / 0.06)",
  hole: "#0a1020",
  ear: "rgb(255 255 255 / 0.07)",
  label: "#4f5b76",
  name: "#f2f5fb",
  muted: "#7d8aa6",
  selected: "#7aa7ff",
  portFree: "rgb(255 255 255 / 0.09)",
  patchFree: "rgb(255 255 255 / 0.18)",
  link: "#7aa7ff",
}

/** Alto de un equipo en el dibujo: una línea para el nombre y, si tiene puertos, una fila cada 24 */
function deviceHeight(rows: number) {
  return rows ? 22 + rows * ROW_HEIGHT + 3.5 : BASE_HEIGHT
}

/** Elevación frontal del rack: cada equipo se puede elegir con click o teclado. */
export function RackDiagram({ cinema, selectedId, onSelect }: RackDiagramProps) {
  // Ordenar por posición y calcular dónde va cada equipo (los que tienen más puertos son más altos)
  let y = TOP
  const items = [...cinema.rackComponents]
    .sort((a, b) => a.position - b.position)
    .map((component) => {
      const ports = hasPorts(component.type) ? resolvePorts(component.specs) : []
      const height = deviceHeight(Math.ceil(ports.length / PORTS_PER_ROW))
      const item = { component, ports, y, height }
      y += height + GAP
      return item
    })
  const height = Math.max(y - GAP + TOP, 120)

  const withStatus = cinema.rackComponents.filter((c) => hasStatus(c.type))
  const count = (status: string) => withStatus.filter((c) => c.status === status).length
  const upsCount = cinema.rackComponents.filter((c) => c.type === "ups").length
  const patchCount = cinema.rackComponents.length - withStatus.length

  const handleKey = (e: KeyboardEvent, component: RackComponent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      onSelect(component)
    }
  }

  return (
    <section className="glass overflow-hidden rounded-2xl">
      <header className="flex items-center justify-between gap-4 px-5 pt-4 pb-3">
        <h2 className="text-[14px] font-semibold tracking-[-0.01em] text-fg">Elevación frontal</h2>
        <span className="text-[12.5px] text-fg-3 tabular-nums">
          {items.length} {items.length === 1 ? "equipo" : "equipos"}
        </span>
      </header>

      <div className="mx-3 rounded-xl bg-rack px-2 py-1">
        {items.length === 0 ? (
          <p className="mx-1 my-3 rounded-lg border border-dashed border-rack-line px-6 py-16 text-center text-[13px] text-rack-muted">
            Este rack todavía no tiene componentes cargados.
          </p>
        ) : (
          // En escritorio el dibujo nunca supera el alto de la pantalla: si el rack es muy alto se achica un poco en lugar de pedir scroll
          <svg
            viewBox={`0 0 320 ${height}`}
            className="mx-auto block h-auto w-full lg:max-h-[calc(100vh-14.5rem)]"
            role="group"
            aria-label={`Rack de IT de ${cinema.name}`}
          >
            {/* Rieles con sus perforaciones */}
            {[22, 286].map((x) => (
              <g key={x}>
                <rect x={x} y="3" width="12" height={height - 6} rx="2" fill={HW.rail} />
                {Array.from({ length: Math.floor((height - 12) / 7) }, (_, i) => (
                  <rect key={i} x={x + 4} y={8 + i * 7} width="4" height="2.2" rx="0.8" fill={HW.hole} />
                ))}
              </g>
            ))}

            {items.map(({ component, ports, y, height }, index) => {
              const withLed = hasStatus(component.type)
              const status = STATUSES[component.status]
              const led = status?.led ?? HW.muted
              const selected = component.id === selectedId
              const batteryDue = component.type === "ups" && component.batteryInstallDate && isBatteryDue(component.batteryInstallDate)
              const typeLabel = COMPONENT_TYPES[component.type]?.label ?? component.type
              const name = component.name.length > MAX_NAME ? `${component.name.slice(0, MAX_NAME - 1)}…` : component.name
              const statusLabel = withLed && component.status !== "online" ? status?.label : null

              return (
                <g
                  key={component.id}
                  role="button"
                  tabIndex={0}
                  aria-pressed={selected}
                  aria-label={`${component.name}, ${typeLabel}${withLed ? `, ${status?.label ?? component.status}` : ""}`}
                  className="group outline-none"
                  onClick={() => onSelect(component)}
                  onKeyDown={(e) => handleKey(e, component)}
                >
                  <title>{component.name}</title>

                  {/* Número de orden junto al riel */}
                  <text x="11" y={y + Math.min(height, BASE_HEIGHT) / 2 + 2.5} textAnchor="middle" fill={selected ? HW.selected : HW.label} className="font-mono text-[7px]">
                    {String(index + 1).padStart(2, "0")}
                  </text>

                  {/* Orejas de montaje con tornillos */}
                  {[BODY_X - 8, BODY_X + BODY_W].map((x) => (
                    <g key={x}>
                      <rect x={x} y={y} width="8" height={height} rx="1.5" fill={HW.ear} />
                      <circle cx={x + 4} cy={y + 5} r="1.3" fill={HW.hole} />
                      <circle cx={x + 4} cy={y + height - 5} r="1.3" fill={HW.hole} />
                    </g>
                  ))}

                  {/* Halo de selección con brillo */}
                  {selected && (
                    <rect
                      x={BODY_X - 2}
                      y={y - 2}
                      width={BODY_W + 4}
                      height={height + 4}
                      rx="6"
                      fill="none"
                      stroke={HW.selected}
                      strokeOpacity="0.35"
                      strokeWidth="3"
                      style={{ filter: `drop-shadow(0 0 5px ${HW.selected})` }}
                    />
                  )}

                  {/* Frente del equipo: cristal translúcido */}
                  <rect
                    x={BODY_X}
                    y={y}
                    width={BODY_W}
                    height={height}
                    rx="4.5"
                    strokeWidth={selected ? 1.3 : 1}
                    className={cn(
                      "transition-[fill,stroke] duration-150",
                      selected
                        ? "fill-[rgb(122_167_255/0.13)] stroke-[#7aa7ff]"
                        : "fill-[rgb(255_255_255/0.035)] stroke-[rgb(255_255_255/0.09)] group-hover:fill-[rgb(255_255_255/0.06)] group-hover:stroke-[rgb(255_255_255/0.2)] group-focus-visible:stroke-[#7aa7ff]"
                    )}
                  />

                  {/* LED de estado con halo (las pacheras no tienen estado) */}
                  {withLed && (
                    <>
                      <circle cx={BODY_X + 11} cy={y + 12} r="5" fill={led} opacity="0.18" />
                      <circle cx={BODY_X + 11} cy={y + 12} r="2.3" fill={led} />
                    </>
                  )}

                  {/* Nombre y, al lado, el tipo de equipo */}
                  <text x={TEXT_X} y={y + 15} className="pointer-events-none">
                    <tspan fill={HW.name} className="font-sans text-[9.5px] font-medium">
                      {name}
                    </tspan>
                    <tspan dx="6" fill={HW.muted} className="font-mono text-[6.6px] tracking-[0.05em]">
                      {typeLabel.toUpperCase()}
                    </tspan>
                  </text>

                  {/* Estado (solo si no está en línea) y aviso de batería */}
                  {statusLabel && (
                    <text x={BODY_X + BODY_W - (batteryDue ? 18 : 8)} y={y + 14.5} textAnchor="end" fill={led} className="font-mono text-[6px] tracking-[0.06em]">
                      {statusLabel.toUpperCase()}
                    </text>
                  )}
                  {batteryDue && <circle cx={BODY_X + BODY_W - 10} cy={y + 12} r="2.6" fill={STATUSES.warning.led} className="animate-pulse" />}

                  {/* Puertos: en azul los que están en uso (cuadrados en pacheras, tipo RJ45 en el resto) */}
                  {ports.map((port, i) => {
                    const px = TEXT_X + (i % PORTS_PER_ROW) * PORT_STEP
                    const py = y + 22 + Math.floor(i / PORTS_PER_ROW) * ROW_HEIGHT
                    return component.type === "patch-panel" ? (
                      <rect
                        key={port.portNumber}
                        x={px + 0.6}
                        y={py - 0.2}
                        width="4.8"
                        height="4.8"
                        rx="1"
                        fill={port.isConnected ? "rgb(122 167 255 / 0.25)" : "none"}
                        stroke={port.isConnected ? HW.link : HW.patchFree}
                        strokeWidth="0.7"
                      />
                    ) : (
                      <rect key={port.portNumber} x={px} y={py} width="6.4" height="4.4" rx="1" fill={port.isConnected ? HW.link : HW.portFree} />
                    )
                  })}
                </g>
              )
            })}
          </svg>
        )}
      </div>

      {/* Leyenda: estados de los equipos activos (las pacheras van aparte, no tienen estado) */}
      <footer className="flex flex-wrap gap-x-4 gap-y-2 px-5 py-3.5 text-[12px] text-fg-3">
        {(["online", "warning", "offline", "maintenance"] as const).map((key) => (
          <span key={key} className="flex items-center gap-1.5">
            <span className="size-1.5 rounded-full" style={{ backgroundColor: STATUSES[key].led }} />
            <span className="font-semibold text-fg tabular-nums">{count(key)}</span>
            {STATUSES[key].label}
          </span>
        ))}
        <span className="flex items-center gap-1.5">
          <span className="font-semibold text-fg tabular-nums">{upsCount}</span>
          {upsCount === 1 ? "Unidad UPS" : "Unidades UPS"}
        </span>
        {patchCount > 0 && (
          <span className="flex items-center gap-1.5">
            <span className="font-semibold text-fg tabular-nums">{patchCount}</span>
            {patchCount === 1 ? "Patch panel" : "Patch panels"}
          </span>
        )}
      </footer>
    </section>
  )
}
