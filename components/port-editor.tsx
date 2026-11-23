"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { resolvePorts } from "@/lib/rack"
import { cn } from "@/lib/utils"
import type { ComponentSpecs, PortConnection } from "@/types/cinema"

interface PortEditorProps {
  componentId: string | number
  specs: ComponentSpecs | null | undefined
  onChange: (changes: Partial<ComponentSpecs>) => void
}

const pad = (n: number) => String(n).padStart(2, "0")

/**
 * Frente del equipo para marcar qué puertos están en uso y qué conecta cada uno.
 * Si el equipo todavía no tiene el detalle, arranca con los primeros N en uso (N = conexiones cargadas).
 * "Conexiones activas" se calcula sola a partir de los puertos marcados.
 */
export function PortEditor({ componentId, specs, onChange }: PortEditorProps) {
  const ports = resolvePorts(specs)
  const inUse = ports.filter((p) => p.isConnected).length
  const [selected, setSelected] = useState<number | null>(null)
  const current = ports.find((p) => p.portNumber === selected) ?? null

  // Guarda el detalle completo de puertos. Los que quedaron por encima del total se conservan:
  // si se vuelve a subir el total reaparecen; al guardar el rack se descartan.
  const save = (next: PortConnection[]) => {
    const beyond = (specs?.portDetails ?? []).filter((d) => d.portNumber > ports.length)
    onChange({ portDetails: [...next, ...beyond], connections: next.filter((p) => p.isConnected).length })
  }

  const updatePort = (portNumber: number, changes: Partial<PortConnection>) =>
    save(ports.map((p) => (p.portNumber === portNumber ? { ...p, ...changes } : p)))

  // "Marcar todos" conserva las notas; "Liberar todos" deja el equipo en limpio (sin conexiones ni descripciones).
  // Apagar un puerto suelto, en cambio, conserva sus notas por si se vuelve a prender.
  const setAll = (isConnected: boolean) =>
    save(ports.map((p) => (isConnected ? { ...p, isConnected } : { ...p, isConnected, connectedTo: null, description: null })))

  if (!ports.length) {
    return <p className="text-[12.5px] text-fg-3 sm:col-span-2">Indicá los puertos totales para marcar cuáles están en uso.</p>
  }

  return (
    <div className="space-y-3 sm:col-span-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <Label>Puertos en uso</Label>
          <p className="mt-0.5 text-[12.5px] text-fg-3">
            <span className="font-medium text-accent tabular-nums">{inUse}</span> en uso · {ports.length - inUse} libres. Tocá un puerto para editarlo.
          </p>
        </div>
        <div className="flex gap-1">
          <button type="button" onClick={() => setAll(true)} className="rounded-lg px-2.5 py-1.5 text-[12.5px] text-fg-2 transition-colors hover:bg-muted hover:text-fg">
            Marcar todos
          </button>
          <button type="button" onClick={() => setAll(false)} className="rounded-lg px-2.5 py-1.5 text-[12.5px] text-fg-2 transition-colors hover:bg-muted hover:text-fg">
            Liberar todos
          </button>
        </div>
      </div>

      {/* Frente del equipo: un botón por puerto */}
      <div role="group" aria-label="Puertos del equipo" className="grid grid-cols-8 gap-1.5 rounded-xl bg-rack p-2.5 shadow-[inset_0_0_0_1px_var(--rack-line)] sm:grid-cols-12">
        {ports.map((port) => {
          const isSelected = selected === port.portNumber
          return (
            <button
              key={port.portNumber}
              type="button"
              aria-pressed={isSelected}
              aria-label={`Puerto ${port.portNumber}, ${port.isConnected ? "en uso" : "libre"}`}
              title={port.connectedTo ? `Conectado a ${port.connectedTo}` : undefined}
              onClick={() => setSelected(isSelected ? null : port.portNumber)}
              className={cn(
                "flex h-7 items-center justify-center rounded-md border font-mono text-[10.5px] tabular-nums transition-[background-color,border-color,box-shadow] duration-150",
                port.isConnected
                  ? "border-[#7aa7ff]/55 bg-[#7aa7ff]/15 text-[#c4d6ff] shadow-[0_0_12px_-4px_#7aa7ff]"
                  : "border-white/10 text-[#7d8aa6] hover:border-white/25 hover:text-[#b6c0d4]",
                isSelected && "border-[#7aa7ff] ring-2 ring-[#7aa7ff]/70"
              )}
            >
              {pad(port.portNumber)}
            </button>
          )
        })}
      </div>

      {/* Detalle del puerto elegido */}
      {current && (
        <div key={current.portNumber} className="animate-enter rounded-xl bg-subtle p-3.5 shadow-[inset_0_0_0_1px_var(--line)]">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[13.5px] font-semibold text-fg">Puerto {pad(current.portNumber)}</p>
            <label className="flex items-center gap-2.5 text-[13px] text-fg-2">
              En uso
              <Switch
                checked={current.isConnected}
                onCheckedChange={(isConnected) => updatePort(current.portNumber, { isConnected })}
                aria-label={`Puerto ${current.portNumber} en uso`}
              />
            </label>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor={`${componentId}-port-${current.portNumber}-to`}>Conectado a</Label>
              <Input
                id={`${componentId}-port-${current.portNumber}-to`}
                value={current.connectedTo ?? ""}
                placeholder="Ej: Servidor Cine 01"
                // Escribir a qué se conecta marca el puerto en uso
                onChange={(e) => updatePort(current.portNumber, { connectedTo: e.target.value, ...(e.target.value ? { isConnected: true } : {}) })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`${componentId}-port-${current.portNumber}-desc`}>Descripción</Label>
              <Input
                id={`${componentId}-port-${current.portNumber}-desc`}
                value={current.description ?? ""}
                placeholder="Ej: Uplink sala 3"
                onChange={(e) => updatePort(current.portNumber, { description: e.target.value })}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
