"use client"

import { useEffect, useState } from "react"
import { History } from "lucide-react"
import { EmptyState } from "@/components/ui/panel"
import { Tag } from "@/components/ui/status"
import { getLogs, type LogEntry } from "@/lib/activity-log"
import { formatDate, formatTime, type Tone } from "@/lib/rack"
import { PageLayout } from "./page-layout"

const ACTION_TONES: Record<string, Tone> = {
  "editar rack": "accent",
  "crear rack": "ok",
  "eliminar componente": "critical",
}

/** "Usuario Admin" → "UA" */
const initials = (name: string) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("")

/** Últimas 10 modificaciones guardadas en este navegador, agrupadas por día. */
export function LogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([])

  // localStorage solo existe en el navegador
  useEffect(() => {
    setLogs(getLogs())
  }, [])

  const latest = [...logs].sort((a, b) => b.timestamp.localeCompare(a.timestamp)).slice(0, 10)

  const days: [string, LogEntry[]][] = []
  for (const log of latest) {
    const day = formatDate(log.timestamp)
    const group = days.find(([d]) => d === day)
    if (group) group[1].push(log)
    else days.push([day, [log]])
  }

  return (
    <PageLayout
      eyebrow="Auditoría"
      title="Registro de actividad"
      subtitle="Historial de las modificaciones realizadas en el sistema."
      meta={
        <span className="text-[12.5px] text-fg-3">
          Últimos {latest.length} de un total de {logs.length} registros · guardados en este navegador
        </span>
      }
    >
      {latest.length === 0 ? (
        <div className="max-w-4xl rounded-2xl border border-dashed border-line-2">
          <EmptyState icon={<History />} title="Todavía no hay actividad">
            No hay registros de actividad disponibles. Los cambios guardados en el editor de racks aparecen acá.
          </EmptyState>
        </div>
      ) : (
        <div className="glass max-w-4xl overflow-hidden rounded-2xl">
          {days.map(([day, entries], i) => (
            <section key={day} className={i > 0 ? "border-t border-line" : undefined}>
              <h2 className="border-b border-line bg-subtle px-5 py-2 text-[12px] font-medium text-fg-3">{day}</h2>
              <ol className="divide-y divide-line">
                {entries.map((log) => (
                  <li
                    key={log.id}
                    className="grid gap-x-5 gap-y-1.5 px-5 py-3.5 transition-colors hover:bg-muted sm:grid-cols-[64px_minmax(0,1fr)_auto] sm:items-center"
                  >
                    <time dateTime={log.timestamp} className="font-mono text-[12px] text-fg-3 tabular-nums">
                      {formatTime(log.timestamp)}
                    </time>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Tag tone={ACTION_TONES[log.action.toLowerCase()] ?? "neutral"}>{log.action}</Tag>
                        <span className="text-[13.5px] font-medium text-fg">{log.cinema}</span>
                      </div>
                      <p className="mt-0.5 text-[13px] text-fg-3">{log.details}</p>
                    </div>
                    <span className="flex items-center gap-2 text-[12.5px] text-fg-2">
                      <span className="flex size-5 items-center justify-center rounded-full bg-muted text-[9px] font-semibold text-fg-3">
                        {initials(log.user)}
                      </span>
                      {log.user}
                    </span>
                  </li>
                ))}
              </ol>
            </section>
          ))}
        </div>
      )}
    </PageLayout>
  )
}
