import { Cpu, Network, Router, Server, Shield, Unplug, Wifi, Zap, type LucideIcon } from "lucide-react"
import type { ComponentSpecs, ComponentStatus, ComponentType, PortConnection } from "@/types/cinema"

// ── Tonos de estado (ver tokens en app/globals.css) ────────────

export type Tone = "ok" | "warning" | "critical" | "info" | "accent" | "neutral"

/** `text`: texto legible · `wash`: fondo suave · `dot`/`bar`: color sólido */
export const TONES: Record<Tone, { text: string; wash: string; dot: string; bar: string }> = {
  ok: { text: "text-ok-ink", wash: "bg-ok-wash", dot: "bg-ok", bar: "bg-ok" },
  warning: { text: "text-warning-ink", wash: "bg-warning-wash", dot: "bg-warning", bar: "bg-warning" },
  critical: { text: "text-critical-ink", wash: "bg-critical-wash", dot: "bg-critical", bar: "bg-critical" },
  info: { text: "text-info-ink", wash: "bg-info-wash", dot: "bg-info", bar: "bg-info" },
  accent: { text: "text-accent-ink", wash: "bg-accent-wash", dot: "bg-accent", bar: "bg-accent" },
  neutral: { text: "text-fg-2", wash: "bg-muted", dot: "bg-fg-4", bar: "bg-fg-3" },
}

// ── Tipos de componente ────────────────────────────────────────

/** Nombre, ícono y código corto (para el dibujo del rack) de cada tipo */
export const COMPONENT_TYPES: Record<ComponentType, { label: string; code: string; icon: LucideIcon }> = {
  server: { label: "Servidor", code: "SRV", icon: Server },
  "patch-panel": { label: "Patch Panel", code: "PP", icon: Network },
  switch: { label: "Switch", code: "SW", icon: Network },
  router: { label: "Router", code: "RT", icon: Router },
  firewall: { label: "Firewall", code: "FW", icon: Shield },
  "wireless-controller": { label: "Controlador WiFi", code: "WLC", icon: Wifi },
  converter: { label: "Conversor", code: "CNV", icon: Unplug },
  ups: { label: "UPS", code: "UPS", icon: Zap },
}

export const FALLBACK_ICON: LucideIcon = Cpu

// ── Estados ────────────────────────────────────────────────────

/** `led`: color del LED en el dibujo del rack (que es oscuro en los dos temas) y en las leyendas */
export const STATUSES: Record<ComponentStatus, { label: string; tone: Tone; led: string }> = {
  online: { label: "En línea", tone: "ok", led: "#4ade80" },
  warning: { label: "Advertencia", tone: "warning", led: "#fbbf24" },
  offline: { label: "Desconectado", tone: "critical", led: "#f87171" },
  maintenance: { label: "Mantenimiento", tone: "info", led: "#c4b5fd" },
}

/** Equipos de red: tienen puertos y conexiones (todo menos servidores y UPS) */
export function hasPorts(type: ComponentType) {
  return type !== "server" && type !== "ups"
}

/**
 * Las pacheras son pasivas: no tienen estado (están o no están en el rack).
 * No muestran LED ni selector de estado y no cuentan en "en línea".
 * En la base se guardan como "online" porque el campo es obligatorio.
 */
export function hasStatus(type: ComponentType) {
  return type !== "patch-panel"
}

// ── Puertos ────────────────────────────────────────────────────

/**
 * Estado de cada puerto de un equipo, del 1 al total. Es la única regla que usan el dibujo del rack,
 * el inspector, el detalle de puertos y el editor:
 * - si el equipo tiene el detalle de puertos cargado, manda el detalle (cuáles están en uso y a qué se conectan);
 * - si solo tiene la cantidad de conexiones, se consideran en uso los primeros N puertos (N nunca supera el total).
 */
export function resolvePorts(specs: ComponentSpecs | null | undefined): PortConnection[] {
  const details = specs?.portDetails ?? []
  const total = specs?.ports ?? details.length
  if (!total) return []

  if (details.length) {
    const byNumber = new Map(details.map((d) => [d.portNumber, d]))
    return Array.from({ length: total }, (_, i) => {
      const detail = byNumber.get(i + 1)
      return {
        portNumber: i + 1,
        isConnected: !!detail?.isConnected,
        connectedTo: detail?.connectedTo ?? null,
        description: detail?.description ?? null,
      }
    })
  }

  const inUse = Math.min(specs?.connections ?? 0, total)
  return Array.from({ length: total }, (_, i) => ({ portNumber: i + 1, isConnected: i < inUse, connectedTo: null, description: null }))
}

/** Cantidad de puertos en uso según `resolvePorts` */
export function countConnected(specs: ComponentSpecs | null | undefined) {
  return resolvePorts(specs).filter((p) => p.isConnected).length
}

/**
 * Specs listos para guardar: "conexiones" pasa a ser la cantidad de puertos en uso (nunca más que el total)
 * y se descarta el detalle de puertos que quedó por encima del total.
 */
export function portSpecsForSave(specs: ComponentSpecs): ComponentSpecs {
  const ports = resolvePorts(specs)
  if (!ports.length) return specs
  return {
    ...specs,
    connections: ports.filter((p) => p.isConnected).length,
    portDetails: (specs.portDetails ?? []).filter((d) => d.portNumber <= ports.length),
  }
}

// ── Umbrales visuales ──────────────────────────────────────────

export function loadTone(percent: number): Tone {
  if (percent > 80) return "critical"
  if (percent > 60) return "warning"
  return "ok"
}

export function autonomyTone(hours: number): Tone {
  if (hours < 1) return "critical"
  if (hours < 2) return "warning"
  return "ok"
}

/** Meses de vida que le quedan a una batería de UPS */
export function batteryTone(monthsLeft: number): Tone {
  if (monthsLeft > 12) return "ok"
  if (monthsLeft > 6) return "warning"
  return "critical"
}

// ── Formato ────────────────────────────────────────────────────

const numberFormat = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 1 })

/** 15000 → "15.000", 1.7 → "1,7" */
export function formatNumber(value: number) {
  return numberFormat.format(value)
}

const dateFormat = new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "short", year: "numeric" })
const timeFormat = new Intl.DateTimeFormat("es-AR", { hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" })

/** "2025-08-15T00:00:00.000Z" → "14 ago 2025" (en hora local) */
export function formatDate(date: string) {
  return dateFormat
    .formatToParts(new Date(date))
    .filter((part) => part.type !== "literal")
    .map((part) => part.value.replace(".", ""))
    .join(" ")
}

/** "2026-11-03T14:22:10Z" → "11:22:10" (en hora local) */
export function formatTime(date: string) {
  return timeFormat.format(new Date(date))
}

/** Posición en el rack con dos dígitos: 7 → "U07" */
export function formatUnit(position: number) {
  return `U${String(position).padStart(2, "0")}`
}

/** "2024-03-15T00:00:00.000Z" → "2024-03-15" (formato de <input type="date">) */
export function toDateInput(date: string | Date) {
  return new Date(date).toISOString().split("T")[0]
}
