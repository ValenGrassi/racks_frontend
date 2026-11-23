import { cn } from "@/lib/utils"

/**
 * Isotipo de SAR: tres capas apiladas en perspectiva (los equipos de un rack) con un LED verde encendido,
 * sobre un cuadrado redondeado azul noche. Es igual en los dos temas, como un ícono de aplicación.
 * Los degradados usan ids fijos: si hay varios logos en la página comparten la misma definición.
 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("size-8 shrink-0", className)} aria-hidden>
      <defs>
        <linearGradient id="sar-mark-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#24386a" />
          <stop offset="1" stopColor="#0a1326" />
        </linearGradient>
        <linearGradient id="sar-mark-top" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#dbe7ff" />
          <stop offset="1" stopColor="#7aa7ff" />
        </linearGradient>
        <linearGradient id="sar-mark-mid" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#82acff" />
          <stop offset="1" stopColor="#4f7fe8" />
        </linearGradient>
        <linearGradient id="sar-mark-low" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#4570d4" />
          <stop offset="1" stopColor="#2a4b9e" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill="url(#sar-mark-bg)" />
      <rect x="0.5" y="0.5" width="31" height="31" rx="8.5" fill="none" stroke="#ffffff" strokeOpacity="0.16" />
      <path d="M16 19.6 25 23.4 16 27.2 7 23.4Z" fill="url(#sar-mark-low)" />
      <path d="M16 14.4 25 18.2 16 22 7 18.2Z" fill="url(#sar-mark-mid)" />
      <path d="M16 9.2 25 13 16 16.8 7 13Z" fill="url(#sar-mark-top)" />
      <circle cx="21.2" cy="13" r="1.2" fill="#4ade80" />
    </svg>
  )
}

/** Isotipo + "SAR" con "Cinemark Hoyts" debajo. `compact` deja solo "SAR" en pantallas chicas. */
export function Brand({ compact }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <BrandMark className="drop-shadow-[0_6px_14px_rgb(79_127_232/0.35)]" />
      <span className="flex flex-col text-left leading-none">
        <span className="text-[15px] font-semibold tracking-[-0.02em] text-fg">SAR</span>
        <span className={cn("mt-[3px] text-[10.5px] font-medium tracking-[0.01em] text-fg-3", compact && "hidden sm:block")}>Cinemark Hoyts</span>
      </span>
    </span>
  )
}
