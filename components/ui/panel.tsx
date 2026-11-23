import type { ComponentProps, CSSProperties, ReactNode } from "react"
import { cn } from "@/lib/utils"
import { TONES, type Tone } from "@/lib/rack"

/** Contenedor base: panel de cristal */
export function Panel({ className, ...props }: ComponentProps<"section">) {
  return <section className={cn("glass rounded-2xl", className)} {...props} />
}

interface PanelHeaderProps {
  title: ReactNode
  description?: ReactNode
  /** Ícono pequeño a la izquierda del título */
  icon?: ReactNode
  action?: ReactNode
  className?: string
}

export function PanelHeader({ title, description, icon, action, className }: PanelHeaderProps) {
  return (
    <header className={cn("flex items-start justify-between gap-4 px-5 pt-4 pb-3", className)}>
      <div className="flex min-w-0 items-start gap-2.5">
        {icon && <span className="mt-0.5 text-fg-3 [&_svg]:size-4">{icon}</span>}
        <div className="min-w-0">
          <h2 className="text-[14px] font-semibold tracking-[-0.01em] text-fg">{title}</h2>
          {description && <p className="mt-0.5 text-[12.5px] text-fg-3">{description}</p>}
        </div>
      </div>
      {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
    </header>
  )
}

export interface Metric {
  label: ReactNode
  value: ReactNode
  unit?: string
  tone?: Tone
  /** Texto chico debajo del valor */
  caption?: ReactNode
  /** Contenido extra debajo (por ejemplo, una barra) */
  extra?: ReactNode
}

/**
 * Franja de cifras en un panel de cristal, separadas por líneas verticales.
 * Va en el encabezado de las pantallas: resume el estado de un vistazo.
 */
export function MetricStrip({ items, loading, className }: { items: Metric[]; loading?: boolean; className?: string }) {
  return (
    <dl
      className={cn("glass grid grid-cols-2 rounded-2xl py-1.5 sm:grid-cols-[repeat(var(--cols),minmax(0,1fr))]", className)}
      style={{ "--cols": items.length } as CSSProperties}
    >
      {items.map((item, i) => (
        <div
          key={i}
          className={cn(
            "min-w-0 px-5 py-3.5 sm:px-6 sm:py-4",
            i % 2 === 1 && "border-l border-line",
            i > 0 && "sm:border-l sm:border-line",
            i >= 2 && "border-t border-line sm:border-t-0"
          )}
        >
          <dt className="truncate text-[12.5px] text-fg-3">{item.label}</dt>
          <dd className="mt-1.5">
            {loading ? (
              <Skeleton className="h-9 w-20" />
            ) : (
              <span
                className={cn(
                  "flex items-baseline gap-1.5 text-[30px] leading-none font-light tracking-[-0.045em] tabular-nums sm:text-[38px]",
                  item.tone ? TONES[item.tone].text : "text-fg"
                )}
              >
                {item.value}
                {item.unit && <span className="text-[13px] font-normal tracking-normal text-fg-3 sm:text-[15px]">{item.unit}</span>}
              </span>
            )}
            {!loading && item.caption && <span className="mt-2 block truncate text-[12px] text-fg-3">{item.caption}</span>}
            {!loading && item.extra}
          </dd>
        </div>
      ))}
    </dl>
  )
}

/** Bloque para indicar carga */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton", className)} />
}

/** Estado vacío: ícono en un recuadro de cristal, título y texto */
export function EmptyState({ icon, title, children, className }: { icon?: ReactNode; title: string; children?: ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-col items-center px-6 py-14 text-center", className)}>
      {icon && <div className="mb-4 flex size-11 items-center justify-center rounded-xl border border-line bg-surface-2 text-fg-3 [&_svg]:size-5">{icon}</div>}
      <p className="text-[16px] font-semibold tracking-[-0.015em] text-fg">{title}</p>
      {children && <div className="mt-1.5 max-w-sm text-[13.5px] text-fg-3">{children}</div>}
    </div>
  )
}
