import { cn } from "@/lib/utils"

/** Arco que gira, para esperas cortas */
export function Spinner({ className }: { className?: string }) {
  return (
    <svg className={cn("size-5 animate-spin text-current", className)} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9.5" stroke="currentColor" strokeOpacity="0.18" strokeWidth="2" />
      <path d="M21.5 12a9.5 9.5 0 0 0-9.5-9.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}
