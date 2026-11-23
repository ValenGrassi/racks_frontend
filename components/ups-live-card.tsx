"use client"

import type { ReactNode } from "react"
import { AlertTriangle, Zap } from "lucide-react"
import { Ring } from "@/components/ui/meter"
import { Panel, Skeleton } from "@/components/ui/panel"
import { Dot, Tag } from "@/components/ui/status"
import { useUpsLive } from "@/hooks/use-ups-live"
import { loadTone, type Tone } from "@/lib/rack"

const SELF_TEST_RESULTS: Record<number, { label: string; tone: Tone }> = {
  1: { label: "Pasó", tone: "ok" },
  2: { label: "Falló", tone: "critical" },
  3: { label: "No se pudo realizar", tone: "warning" },
  4: { label: "En curso", tone: "info" },
}

/** Centésimas de segundo (formato SNMP) → "1h 05m" */
function formatRuntime(ticks: number) {
  const totalMinutes = Math.floor(ticks / 100 / 60)
  return `${Math.floor(totalMinutes / 60)}h ${String(totalMinutes % 60).padStart(2, "0")}m`
}

/** Estado del UPS leído en vivo por SNMP a través del backend. */
export function UpsLiveCard({ upsIp }: { upsIp: string }) {
  const ups = useUpsLive(upsIp)
  const test = ups ? SELF_TEST_RESULTS[ups.selfTestResult] : null

  return (
    <Panel className="overflow-hidden">
      <header className="flex items-start justify-between gap-3 px-5 pt-4">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 text-[14px] font-semibold tracking-[-0.01em] text-fg">
            <Zap className="size-4 text-fg-3" />
            UPS en vivo
          </h2>
          <p className="mt-0.5 truncate text-[12.5px] text-fg-3">
            {ups ? ups.name : "Esperando lectura del UPS…"} · <span className="font-mono">{upsIp}</span>
            {ups?.model && ` · ${ups.model}`}
          </p>
        </div>
        <span className="flex shrink-0 items-center gap-2 text-[12.5px] text-fg-3">
          <Dot tone={ups ? "ok" : "neutral"} pulse={!!ups} className="size-1.5" />
          {ups ? "Cada 3 s" : "Conectando"}
        </span>
      </header>

      <div className="flex items-center gap-5 px-5 pt-4 pb-5">
        {!ups ? (
          <>
            <Skeleton className="size-[104px] shrink-0 rounded-full" />
            <div className="flex-1 space-y-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="space-y-1.5">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-5 w-24" />
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            <Ring value={ups.loadPercentage} tone={loadTone(ups.loadPercentage)}>
              <div>
                <span className="block text-[26px] leading-none font-light tracking-[-0.04em] text-fg tabular-nums">{ups.loadPercentage}%</span>
                <span className="text-[11.5px] text-fg-3">carga</span>
              </div>
            </Ring>
            <dl className="min-w-0 flex-1 space-y-2.5">
              <Row label="Autonomía restante" value={formatRuntime(ups.runtimeRemaining)} />
              <Row label="Voltaje de salida" value={`${ups.outputVoltage} V`} />
              <Row label="Última autoprueba correcta" value={<span className="font-mono text-[13.5px]">{ups.ultimaAutoprueba}</span>} />
              <div>
                <dt className="text-[12px] text-fg-3">Último test</dt>
                <dd className="mt-1">
                  <Tag tone={test?.tone ?? "neutral"}>{test?.label ?? ups.selfTestResult}</Tag>
                </dd>
              </div>
            </dl>
          </>
        )}
      </div>

      {ups?.selfTestResult === 2 && (
        <div className="flex items-center gap-2.5 border-t border-line bg-critical-wash px-5 py-3 text-[13px] text-critical-ink">
          <AlertTriangle className="size-4 shrink-0" />
          Última autoprueba fallida: revisar baterías.
        </div>
      )}
    </Panel>
  )
}

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <dt className="text-[12px] text-fg-3">{label}</dt>
      <dd className="text-[17px] font-normal tracking-[-0.02em] text-fg tabular-nums">{value}</dd>
    </div>
  )
}
