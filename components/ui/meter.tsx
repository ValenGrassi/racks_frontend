import type { ReactNode } from "react"
import { cn } from "@/lib/utils"
import { TONES, type Tone } from "@/lib/rack"

interface MeterProps {
  value: number
  max?: number
  tone?: Tone
  /** Marcas de referencia, en el mismo rango que `value` (p. ej. umbrales) */
  marks?: number[]
  className?: string
}

/** Barra fina de progreso con marcas opcionales */
export function Meter({ value, max = 100, tone = "neutral", marks = [], className }: MeterProps) {
  const percent = Math.max(0, Math.min(100, (value / max) * 100))

  return (
    <div
      className={cn("relative h-1.5 w-full overflow-hidden rounded-full bg-muted", className)}
      role="meter"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
    >
      <div className={cn("h-full rounded-full transition-[width] duration-500 ease-[var(--ease-out-quick)]", TONES[tone].bar)} style={{ width: `${percent}%` }} />
      {marks.map((mark) => (
        <span key={mark} className="absolute top-0 h-full w-px bg-canvas/70" style={{ left: `${(mark / max) * 100}%` }} />
      ))}
    </div>
  )
}

const RING_COLORS: Record<Tone, string> = {
  ok: "var(--ok)",
  warning: "var(--warning)",
  critical: "var(--critical)",
  info: "var(--info)",
  accent: "var(--accent)",
  neutral: "var(--fg-3)",
}

/** Anillo de progreso con el valor en el centro (carga del UPS en vivo) */
export function Ring({ value, tone = "accent", size = 104, stroke = 8, children }: { value: number; tone?: Tone; size?: number; stroke?: number; children?: ReactNode }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const percent = Math.max(0, Math.min(100, value))

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} role="meter" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--muted)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={RING_COLORS[tone]}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${(c * percent) / 100} ${c}`}
          className="transition-[stroke-dasharray] duration-700 ease-[var(--ease-out-quick)]"
          style={{ filter: `drop-shadow(0 0 6px ${RING_COLORS[tone]})` }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">{children}</div>
    </div>
  )
}
