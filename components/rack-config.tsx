"use client"

import { useEffect, useState, type ReactNode } from "react"
import { CircleAlert, Save, Video, Zap, type LucideIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/loading"
import { Panel } from "@/components/ui/panel"
import { Dot } from "@/components/ui/status"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/components/ui/toast"
import { api } from "@/lib/api"
import { cn } from "@/lib/utils"
import type { Cinema } from "@/types/cinema"
import { PageLayout } from "./page-layout"

interface RackConfigProps {
  cinema: Cinema
  onBack: () => void
  /** Ir a la vista del rack (desde la ruta "Ubicaciones › Cine › Configuración") */
  onOpenRack: () => void
  onSaved: (cinema: Cinema) => void
  /** Avisa si hay cambios sin guardar, para confirmar antes de salir */
  onDirtyChange?: (dirty: boolean) => void
}

/** Pantalla para activar la cámara y el UPS en vivo de un cine e indicar sus IPs. */
export function RackConfig({ cinema, onBack, onOpenRack, onSaved, onDirtyChange }: RackConfigProps) {
  const [cameraEnabled, setCameraEnabled] = useState(cinema.cameraEnabled)
  const [cameraIp, setCameraIp] = useState(cinema.cameraIp ?? "")
  const [upsEnabled, setUpsEnabled] = useState(cinema.upsEnabled)
  const [upsIp, setUpsIp] = useState(cinema.upsIp ?? "")
  const [errors, setErrors] = useState<{ camera?: string; ups?: string }>({})
  const [isSaving, setIsSaving] = useState(false)
  const notify = useToast()

  // Solo visual: avisa que hay cambios que todavía no se guardaron
  const isDirty =
    cameraEnabled !== cinema.cameraEnabled ||
    cameraIp !== (cinema.cameraIp ?? "") ||
    upsEnabled !== cinema.upsEnabled ||
    upsIp !== (cinema.upsIp ?? "")

  useEffect(() => {
    onDirtyChange?.(isDirty)
  }, [isDirty, onDirtyChange])
  useEffect(() => () => onDirtyChange?.(false), [onDirtyChange])

  const handleSave = async () => {
    const found = {
      camera: cameraEnabled && !cameraIp ? "Debes ingresar una IP para activar la cámara en tiempo real" : undefined,
      ups: upsEnabled && !upsIp ? "Debes ingresar una IP para activar el monitoreo en tiempo real" : undefined,
    }
    setErrors(found)
    if (found.camera || found.ups) return

    setIsSaving(true)
    try {
      const updated = await api.updateCinema(cinema.id, {
        cameraEnabled,
        cameraIp: cameraEnabled ? cameraIp : null,
        upsEnabled,
        upsIp: upsEnabled ? upsIp : null,
      })
      notify({ tone: "success", title: "Configuración guardada", description: `${updated.name} quedó configurado correctamente.` })
      onSaved(updated)
    } catch (err) {
      console.error("Error guardando configuración:", err)
      notify({ tone: "error", title: "Error al guardar los cambios", description: "Revisá la conexión con el servidor." })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <PageLayout
      crumbs={[{ label: "Ubicaciones", onClick: onBack }, { label: cinema.name, onClick: onOpenRack }, { label: "Configuración" }]}
      title="Monitoreo en vivo"
      subtitle="Activá la cámara y el UPS de este rack para verlos en tiempo real desde la vista del rack."
      actions={
        <>
          {isDirty && !isSaving && (
            <span className="mr-1 flex animate-enter items-center gap-1.5 text-[12.5px] text-warning-ink">
              <Dot tone="warning" className="size-1.5" />
              Cambios sin guardar
            </span>
          )}
          <Button onClick={handleSave} disabled={isSaving} className="min-w-36">
            {isSaving ? <Spinner className="size-4" /> : <Save />}
            {isSaving ? "Guardando…" : "Guardar cambios"}
          </Button>
        </>
      }
    >
      <div className="max-w-3xl space-y-5">
        <LiveDeviceSettings
          id="camera"
          icon={Video}
          title="Cámara del rack"
          description="Transmite el video de la cámara IP en la vista del rack."
          toggleLabel="Activar cámara en tiempo real"
          placeholder="Ej: 192.168.1.100"
          enabled={cameraEnabled}
          onEnabledChange={setCameraEnabled}
          ip={cameraIp}
          onIpChange={setCameraIp}
          error={errors.camera}
        />
        <LiveDeviceSettings
          id="ups"
          icon={Zap}
          title="UPS"
          description="Lee carga, autonomía y autopruebas del UPS por SNMP cada 3 segundos."
          toggleLabel="Activar UPS en tiempo real"
          placeholder="Ej: 192.168.1.120"
          enabled={upsEnabled}
          onEnabledChange={setUpsEnabled}
          ip={upsIp}
          onIpChange={setUpsIp}
          error={errors.ups}
        />
      </div>
    </PageLayout>
  )
}

interface LiveDeviceSettingsProps {
  id: string
  icon: LucideIcon
  title: string
  description: ReactNode
  toggleLabel: string
  placeholder: string
  enabled: boolean
  onEnabledChange: (enabled: boolean) => void
  ip: string
  onIpChange: (ip: string) => void
  error?: string
}

/** Bloque de ajustes de un dispositivo: interruptor, IP y una barra inferior con el estado */
function LiveDeviceSettings({
  id,
  icon: Icon,
  title,
  description,
  toggleLabel,
  placeholder,
  enabled,
  onEnabledChange,
  ip,
  onIpChange,
  error,
}: LiveDeviceSettingsProps) {
  return (
    <Panel className={cn("overflow-hidden transition-[border-color] duration-200", error && "border-critical/40")}>
      <div className="flex items-start gap-4 p-5">
        <div
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-lg border transition-colors duration-200",
            enabled ? "border-accent-line bg-accent-wash text-accent-ink" : "border-line bg-subtle text-fg-3"
          )}
        >
          <Icon className="size-[18px] stroke-[1.7]" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-[15px] font-semibold tracking-[-0.015em] text-fg">{title}</h2>
          <p className="mt-0.5 text-[13px] text-fg-3">{description}</p>

          <div className="mt-4 max-w-xs space-y-1.5">
            <Label htmlFor={`${id}-ip`}>Dirección IP</Label>
            <Input
              id={`${id}-ip`}
              value={ip}
              onChange={(e) => onIpChange(e.target.value)}
              disabled={!enabled}
              placeholder={placeholder}
              aria-invalid={!!error}
              className="font-mono"
            />
          </div>
        </div>
        <Switch id={`${id}-enabled`} checked={enabled} onCheckedChange={onEnabledChange} aria-label={toggleLabel} className="mt-0.5" />
      </div>

      <footer className={cn("flex items-center gap-2 border-t px-5 py-3 text-[12.5px]", error ? "border-critical/20 bg-critical-wash" : "border-line bg-subtle")}>
        {error ? (
          <p role="alert" className="flex items-center gap-1.5 text-critical-ink">
            <CircleAlert className="size-3.5" />
            {error}
          </p>
        ) : (
          <p className="flex items-center gap-2 text-fg-3">
            <Dot tone={enabled ? "ok" : "neutral"} className="size-1.5" />
            {enabled ? "Activo: se mostrará en la vista del rack" : "Desactivado"}
          </p>
        )}
      </footer>
    </Panel>
  )
}
