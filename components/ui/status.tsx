import type { ReactNode } from "react"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { STATUSES, TONES, type Tone } from "@/lib/rack"
import type { ComponentStatus } from "@/types/cinema"

/** Punto de color con un aro suave; `pulse` agrega un halo animado (para "en vivo") */
export function Dot({ tone = "neutral", pulse, className }: { tone?: Tone; pulse?: boolean; className?: string }) {
  return (
    <span className={cn("relative inline-flex size-2 shrink-0", className)}>
      {pulse && <span className={cn("absolute inset-0 animate-ping rounded-full opacity-50", TONES[tone].dot)} />}
      <span className={cn("relative inline-flex size-full rounded-full", TONES[tone].dot)} />
    </span>
  )
}

/** Etiqueta compacta */
export function Tag({ tone = "neutral", icon: Icon, children, className }: { tone?: Tone; icon?: LucideIcon; children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1.5 rounded-full px-2.5 text-[12px] font-medium whitespace-nowrap",
        TONES[tone].wash,
        TONES[tone].text,
        className
      )}
    >
      {Icon && <Icon className="size-3.5" />}
      {children}
    </span>
  )
}

/** Estado de un componente: punto + texto */
export function StatusTag({ status, className }: { status: ComponentStatus; className?: string }) {
  const info = STATUSES[status]
  return (
    <Tag tone={info?.tone} className={className}>
      <Dot tone={info?.tone} className="size-1.5" />
      {info?.label ?? status}
    </Tag>
  )
}

/** Tecla de atajo: "/" */
export function Kbd({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <kbd
      className={cn(
        "inline-flex h-5 min-w-5 items-center justify-center rounded-[5px] border border-line px-1 font-mono text-[11px] text-fg-3",
        className
      )}
    >
      {children}
    </kbd>
  )
}
