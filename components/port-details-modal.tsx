"use client"

import type { ReactNode } from "react"
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { COMPONENT_TYPES, FALLBACK_ICON, resolvePorts } from "@/lib/rack"
import { cn } from "@/lib/utils"
import type { RackComponent } from "@/types/cinema"

interface PortDetailsModalProps {
  component: RackComponent
  /** El botón que abre el modal */
  children: ReactNode
}

const pad = (n: number) => String(n).padStart(2, "0")

/** Modal con el detalle de cada puerto de un equipo de red. */
export function PortDetailsModal({ component, children }: PortDetailsModalProps) {
  // Misma regla que el dibujo del rack: detalle cargado o, si no hay, los primeros N en uso
  const ports = resolvePorts(component.specs)
  const inUse = ports.filter((p) => p.isConnected).length
  const Icon = COMPONENT_TYPES[component.type]?.icon ?? FALLBACK_ICON
  const target = (port: (typeof ports)[number]) => (port.connectedTo && port.connectedTo !== "NULL" ? port.connectedTo : null)

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-3xl">
        <div className="px-6 pt-6 pb-5">
          <div className="flex items-center gap-3.5 pr-8">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent-wash text-accent shadow-[inset_0_0_0_1px_var(--accent-line)]">
              <Icon className="size-[18px]" />
            </div>
            <div className="min-w-0">
              <DialogTitle>{component.name}</DialogTitle>
              <DialogDescription className="mt-0.5">
                {component.model && `Modelo ${component.model} · `}
                {ports.length} puertos totales · {inUse} en uso
              </DialogDescription>
            </div>
          </div>

          {/* Frente del equipo: un puerto por casillero, en azul los conectados */}
          <div className="mt-5 rounded-xl bg-rack p-3 shadow-[inset_0_0_0_1px_var(--rack-line)]">
            <div className="grid grid-cols-8 gap-1.5 sm:grid-cols-12">
              {ports.map((port) => (
                <span
                  key={port.portNumber}
                  title={port.isConnected ? (target(port) ? `Conectado a ${target(port)}` : "En uso") : "Puerto libre"}
                  className={cn(
                    "flex h-7 items-center justify-center rounded-md border font-mono text-[10.5px] tabular-nums",
                    port.isConnected
                      ? "border-[#7aa7ff]/55 bg-[#7aa7ff]/15 text-[#c4d6ff] shadow-[0_0_12px_-4px_#7aa7ff]"
                      : "border-white/10 text-[#7d8aa6]"
                  )}
                >
                  {pad(port.portNumber)}
                </span>
              ))}
            </div>
          </div>
          <div className="mt-3 flex gap-5 text-[12px] text-fg-3">
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-accent" />
              En uso
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full border border-line-2" />
              Libre
            </span>
          </div>
        </div>

        <div className="scroll-thin max-h-[40vh] min-h-0 flex-1 overflow-y-auto border-t border-line">
          <div className="sticky top-0 z-10 hidden grid-cols-[64px_minmax(0,1fr)_minmax(0,1fr)] gap-4 border-b border-line bg-elevated px-6 py-2.5 text-[12px] text-fg-3 sm:grid">
            <span>Puerto</span>
            <span>Conectado a</span>
            <span>Descripción</span>
          </div>
          <ol className="divide-y divide-line">
            {ports.map((port) => (
              <li
                key={port.portNumber}
                className="grid grid-cols-[48px_minmax(0,1fr)] gap-x-4 gap-y-0.5 px-6 py-2.5 transition-colors hover:bg-muted sm:grid-cols-[64px_minmax(0,1fr)_minmax(0,1fr)]"
              >
                <span className="font-mono text-[12.5px] text-fg-3 tabular-nums">{pad(port.portNumber)}</span>
                {port.isConnected ? (
                  <span className="flex min-w-0 items-center gap-2 text-[13.5px] text-fg">
                    <span className="size-1.5 shrink-0 rounded-full bg-accent" />
                    {target(port) ? <span className="truncate">{target(port)}</span> : <span className="text-fg-3">En uso · sin detalle</span>}
                  </span>
                ) : (
                  <span className="text-[13.5px] text-fg-4">Puerto libre</span>
                )}
                <span className="col-start-2 truncate text-[12.5px] text-fg-3 sm:col-start-auto">
                  {port.description && port.description !== "No conectado" ? port.description : ""}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </DialogContent>
    </Dialog>
  )
}
