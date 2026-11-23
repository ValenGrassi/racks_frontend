"use client"

import { useEffect, useId, useRef, useState, type ReactNode } from "react"
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
} from "@dnd-kit/core"
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical, MousePointerClick, Plus, Save, Server, Settings2, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/loading"
import { EmptyState, MetricStrip, Panel, PanelHeader } from "@/components/ui/panel"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dot } from "@/components/ui/status"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/toast"
import { addLog } from "@/lib/activity-log"
import { api } from "@/lib/api"
import { totalPowerW, totalUpsVA, upsAutonomyHours } from "@/lib/calculations"
import {
  COMPONENT_TYPES,
  FALLBACK_ICON,
  STATUSES,
  TONES,
  formatNumber,
  formatUnit,
  hasPorts,
  hasStatus,
  portSpecsForSave,
  toDateInput,
} from "@/lib/rack"
import { cn } from "@/lib/utils"
import type { Cinema, ComponentSpecs, ComponentStatus, RackComponent } from "@/types/cinema"
import { PageLayout } from "./page-layout"
import { PortEditor } from "./port-editor"

interface RackEditorProps {
  cinema: Cinema
  onBack: () => void
  /** Ir a la vista del rack (desde la ruta "Ubicaciones › Cine › Editar rack") */
  onOpenRack: () => void
  onOpenConfig: () => void
  onSaved: (cinema: Cinema) => void
  /** Avisa si hay cambios sin guardar, para confirmar antes de salir */
  onDirtyChange?: (dirty: boolean) => void
}

/** Textos para lectores de pantalla al mover equipos con el teclado */
const SCREEN_READER = {
  instructions: {
    draggable: "Para mover un equipo, presioná espacio para tomarlo, usá las flechas para moverlo y espacio para soltarlo. Escape cancela.",
  },
}

/**
 * Pantalla para agregar, quitar, ordenar y modificar los componentes del rack de un cine.
 * La posición de cada equipo es su lugar en la lista (de arriba hacia abajo): se cambia arrastrando.
 */
export function RackEditor({ cinema, onBack, onOpenRack, onOpenConfig, onSaved, onDirtyChange }: RackEditorProps) {
  const [components, setComponents] = useState<RackComponent[]>(cinema.rackComponents)
  const [selectedId, setSelectedId] = useState<RackComponent["id"] | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const notify = useToast()

  const ordered = [...components].sort((a, b) => a.position - b.position)
  const selectedIndex = ordered.findIndex((c) => c.id === selectedId)
  const selected = selectedIndex >= 0 ? ordered[selectedIndex] : null
  const formRef = useRef<HTMLDivElement>(null)
  // Solo visual: avisa que hay cambios que todavía no se guardaron
  const isDirty = JSON.stringify(components) !== JSON.stringify(cinema.rackComponents)

  useEffect(() => {
    onDirtyChange?.(isDirty)
  }, [isDirty, onDirtyChange])
  useEffect(() => () => onDirtyChange?.(false), [onDirtyChange])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  // En pantallas angostas el formulario queda debajo de la lista: bajar hasta él al elegir
  const select = (id: RackComponent["id"]) => {
    setSelectedId(id)
    if (window.matchMedia("(max-width: 1023px)").matches) {
      requestAnimationFrame(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }))
    }
  }

  const updateSelected = (changes: Partial<RackComponent>) =>
    setComponents((prev) => prev.map((c) => (c.id === selectedId ? { ...c, ...changes } : c)))

  const updateSelectedSpecs = (changes: Partial<ComponentSpecs>) =>
    setComponents((prev) => prev.map((c) => (c.id === selectedId ? { ...c, specs: { ...c.specs, ...changes } } : c)))

  // Soltar un equipo en otro lugar: las posiciones pasan a ser el nuevo orden (1, 2, 3…)
  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return
    const from = ordered.findIndex((c) => c.id === active.id)
    const to = ordered.findIndex((c) => c.id === over.id)
    setComponents(arrayMove(ordered, from, to).map((c, i) => ({ ...c, position: i + 1 })))
  }

  const nameOf = (id: string | number) => ordered.find((c) => c.id === id)?.name ?? "equipo"
  const placeOf = (id: string | number) => ordered.findIndex((c) => c.id === id) + 1
  const announcements: Announcements = {
    onDragStart: ({ active }) => `Tomaste ${nameOf(active.id)}, en la posición ${placeOf(active.id)}.`,
    onDragOver: ({ active, over }) => (over ? `${nameOf(active.id)} sobre la posición ${placeOf(over.id)}.` : undefined),
    onDragEnd: ({ active, over }) => (over ? `${nameOf(active.id)} quedó en la posición ${placeOf(over.id)}.` : undefined),
    onDragCancel: ({ active }) => `Se canceló el movimiento de ${nameOf(active.id)}.`,
  }

  const addComponent = () => {
    const component: RackComponent = {
      id: `nuevo-${Date.now()}`, // id temporal: el backend asigna el definitivo al guardar
      type: "server",
      name: "Nuevo Componente",
      status: "online",
      position: components.length + 1,
      powerConsumption: 0,
      description: "Componente nuevo",
      specs: {},
    }
    setComponents((prev) => [...prev, component])
    select(component.id)
  }

  const removeComponent = (id: RackComponent["id"]) => {
    setComponents((prev) => prev.filter((c) => c.id !== id))
    if (selectedId === id) setSelectedId(null)
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const rackComponents = ordered.map((c, i) => {
        const next: RackComponent = { ...c, position: i + 1 } // la posición es el orden en el rack
        // Los UPS sin fecha de batería toman la de hoy (es lo que muestra el formulario)
        if (c.type === "ups" && !c.batteryInstallDate) next.batteryInstallDate = toDateInput(new Date())
        // Las pacheras no tienen estado; el campo es obligatorio en la base y se guarda neutro
        if (!hasStatus(c.type)) next.status = "online"
        // "Conexiones activas" = puertos marcados en uso
        if (hasPorts(c.type) && c.specs) next.specs = portSpecsForSave(c.specs)
        return next
      })
      const updated = await api.updateCinema(cinema.id, { rackComponents })
      addLog({ action: "Editar Rack", cinema: cinema.name, user: "Usuario Admin", details: "Rack editado y guardado" })
      notify({ tone: "success", title: "Rack guardado", description: `Los cambios de ${updated.name} quedaron registrados.` })
      onSaved(updated)
    } catch (err) {
      console.error("Error guardando rack:", err)
      notify({ tone: "error", title: "Error al guardar los cambios", description: "Revisá la conexión con el servidor." })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <PageLayout
      crumbs={[{ label: "Ubicaciones", onClick: onBack }, { label: cinema.name, onClick: onOpenRack }, { label: "Editar rack" }]}
      title="Editar rack"
      subtitle={cinema.address}
      actions={
        <>
          {isDirty && !isSaving && (
            <span className="mr-1 flex animate-enter items-center gap-1.5 text-[12.5px] text-warning-ink">
              <Dot tone="warning" className="size-1.5" />
              Cambios sin guardar
            </span>
          )}
          <Button variant="secondary" onClick={onOpenConfig}>
            <Settings2 />
            Configuración
          </Button>
          <Button onClick={handleSave} disabled={isSaving} className="min-w-36">
            {isSaving ? <Spinner className="size-4" /> : <Save />}
            {isSaving ? "Guardando…" : "Guardar cambios"}
          </Button>
        </>
      }
      // Totales que se recalculan mientras se edita
      overview={
        <MetricStrip
          items={[
            { label: "Ubicación", value: cinema.location ?? "—" },
            { label: "Consumo total", value: formatNumber(totalPowerW(components)), unit: "W" },
            { label: "Autonomía UPS", value: formatNumber(upsAutonomyHours(components)), unit: "h" },
            { label: "Capacidad UPS", value: formatNumber(totalUpsVA(components)), unit: "VA" },
          ]}
        />
      }
    >
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        {/* El rack, de arriba hacia abajo: se reordena arrastrando */}
        <Panel className="overflow-hidden">
          <PanelHeader
            title="Componentes del rack"
            description={
              components.length > 1
                ? `${components.length} equipos · arrastrá para cambiar el orden`
                : `${components.length} ${components.length === 1 ? "equipo" : "equipos"}`
            }
            action={
              <Button variant="secondary" size="sm" onClick={addComponent}>
                <Plus />
                Agregar componente
              </Button>
            }
          />

          {components.length === 0 ? (
            <EmptyState icon={<Server />} title="Rack vacío" className="border-t border-line py-12">
              Agregá el primer componente para empezar a armar el rack.
            </EmptyState>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
              accessibility={{ announcements, screenReaderInstructions: SCREEN_READER.instructions }}
            >
              <SortableContext items={ordered.map((c) => c.id)} strategy={verticalListSortingStrategy}>
                <ul className="border-t border-line">
                  {ordered.map((component, index) => (
                    <RackRow
                      key={component.id}
                      component={component}
                      index={index}
                      selected={selectedId === component.id}
                      onSelect={() => select(component.id)}
                      onRemove={() => removeComponent(component.id)}
                    />
                  ))}
                </ul>
              </SortableContext>
            </DndContext>
          )}
        </Panel>

        {/* Formulario del componente elegido */}
        <div ref={formRef} className="scroll-thin scroll-mt-20 lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto lg:rounded-2xl">
          {selected ? (
            <ComponentForm key={selected.id} component={selected} order={selectedIndex + 1} onChange={updateSelected} onSpecsChange={updateSelectedSpecs} />
          ) : (
            <div className="rounded-2xl border border-dashed border-line-2">
              <EmptyState icon={<MousePointerClick />} title="Seleccioná un componente">
                Elegí un componente de la lista para editarlo, o agregá uno nuevo.
              </EmptyState>
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  )
}

interface RackRowProps {
  component: RackComponent
  index: number
  selected: boolean
  onSelect: () => void
  onRemove: () => void
}

/** Un equipo de la lista: se arrastra desde la manija, se elige con un click y se quita con la papelera */
function RackRow({ component, index, selected, onSelect, onRemove }: RackRowProps) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: component.id })
  const Icon = COMPONENT_TYPES[component.type]?.icon ?? FALLBACK_ICON
  const status = STATUSES[component.status]
  const withStatus = hasStatus(component.type)

  return (
    <li
      ref={setNodeRef}
      // Solo se mueve en vertical, como en el rack
      style={{ transform: CSS.Translate.toString(transform && { ...transform, x: 0 }), transition }}
      className={cn(
        "group relative border-b border-line bg-transparent last:border-b-0",
        isDragging && "z-10 rounded-xl border-transparent bg-elevated shadow-lg ring-1 ring-accent-line"
      )}
    >
      <button
        ref={setActivatorNodeRef}
        {...attributes}
        {...listeners}
        aria-label={`Mover ${component.name}`}
        className="absolute top-1/2 left-1.5 flex h-9 w-6 -translate-y-1/2 cursor-grab touch-none items-center justify-center rounded-md text-fg-4 transition-colors hover:bg-muted hover:text-fg-2 active:cursor-grabbing"
      >
        <GripVertical className="size-4" />
      </button>
      <button
        onClick={onSelect}
        aria-current={selected || undefined}
        className={cn(
          "flex w-full items-center gap-3 py-2.5 pr-14 pl-9 text-left transition-colors duration-150",
          selected ? "bg-accent-wash" : "hover:bg-muted"
        )}
      >
        {selected && <span className="absolute inset-y-0 left-0 w-0.5 bg-accent" />}
        <span className={cn("w-7 font-mono text-[11.5px] tabular-nums", selected ? "text-accent-ink" : "text-fg-4")}>{formatUnit(index + 1)}</span>
        <span className="flex size-8 shrink-0 items-center justify-center rounded-[9px] bg-surface-2 text-fg-3 shadow-[inset_0_0_0_1px_var(--line)]">
          <Icon className="size-3.5 stroke-[1.8]" />
        </span>
        <span className="flex min-w-0 flex-1 items-baseline gap-2">
          <span className="truncate text-[13.5px] font-medium text-fg">{component.name}</span>
          <span className="shrink-0 font-mono text-[10.5px] tracking-[0.04em] text-fg-3 uppercase">{COMPONENT_TYPES[component.type]?.label ?? component.type}</span>
        </span>
        {withStatus && component.status !== "online" && (
          <span className={cn("hidden text-[12px] sm:inline", TONES[status?.tone ?? "neutral"].text)}>{status?.label}</span>
        )}
        {withStatus && <Dot tone={status?.tone} />}
      </button>
      <Button
        variant="danger"
        size="icon"
        onClick={onRemove}
        className="absolute top-1/2 right-3 size-7 -translate-y-1/2 opacity-100 sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100"
        aria-label={`Quitar ${component.name}`}
      >
        <Trash2 className="size-3.5" />
      </Button>
    </li>
  )
}

interface ComponentFormProps {
  component: RackComponent
  /** Lugar del equipo en el rack (1 = arriba) */
  order: number
  onChange: (changes: Partial<RackComponent>) => void
  onSpecsChange: (changes: Partial<ComponentSpecs>) => void
}

/** Formulario del componente seleccionado; los campos extra dependen del tipo. */
function ComponentForm({ component, order, onChange, onSpecsChange }: ComponentFormProps) {
  const { type, specs } = component
  const Icon = COMPONENT_TYPES[type]?.icon ?? FALLBACK_ICON
  const toNumber = (value: string) => (value === "" ? null : Number(value))
  const fieldId = (name: string) => `${component.id}-${name}`

  return (
    <Panel className="overflow-hidden">
      <header className="flex items-center gap-3 border-b border-line px-5 py-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent-wash text-accent shadow-[inset_0_0_0_1px_var(--accent-line)]">
          <Icon className="size-4 stroke-[1.8]" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-[17px] font-semibold tracking-[-0.025em] text-fg">{component.name || "Sin nombre"}</p>
          <p className="font-mono text-[12px] text-fg-3">Editar componente · posición {formatUnit(order)}</p>
        </div>
      </header>

      <div className="divide-y divide-line">
        <Section title="General">
          <Field label="Nombre" htmlFor={fieldId("name")}>
            <Input id={fieldId("name")} value={component.name} onChange={(e) => onChange({ name: e.target.value })} />
          </Field>
          <Field label="Tipo">
            <Select value={type} onValueChange={(value) => onChange({ type: value as RackComponent["type"] })}>
              <SelectTrigger aria-label="Tipo">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(COMPONENT_TYPES).map(([value, { label, icon: TypeIcon }]) => (
                  <SelectItem key={value} value={value}>
                    <span className="flex items-center gap-2.5">
                      <TypeIcon className="size-4 stroke-[1.7] text-fg-3" />
                      {label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          {type !== "ups" && type !== "patch-panel" && (
            <Field label="Consumo de energía (W)" htmlFor={fieldId("power")}>
              <Input
                id={fieldId("power")}
                type="number"
                className="font-mono"
                value={component.powerConsumption ?? ""}
                onChange={(e) => onChange({ powerConsumption: toNumber(e.target.value) })}
              />
            </Field>
          )}
          {/* Las pacheras no tienen estado */}
          {hasStatus(type) && (
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Estado</Label>
              <StatusPicker value={component.status} onChange={(status) => onChange({ status })} />
            </div>
          )}
          <Field label="Descripción" htmlFor={fieldId("description")} wide>
            <Textarea id={fieldId("description")} value={component.description ?? ""} onChange={(e) => onChange({ description: e.target.value })} />
          </Field>
        </Section>

        {hasPorts(type) && (
          <Section title="Puertos">
            <Field label="Puertos totales" htmlFor={fieldId("ports")}>
              <Input
                id={fieldId("ports")}
                type="number"
                min={0}
                className="font-mono"
                value={specs?.ports ?? ""}
                onChange={(e) => onSpecsChange({ ports: toNumber(e.target.value) })}
              />
            </Field>
            <PortEditor componentId={component.id} specs={specs} onChange={onSpecsChange} />
          </Section>
        )}

        {type === "ups" && (
          <Section title="Configuración UPS">
            <Field label="Capacidad (VA)" htmlFor={fieldId("capacity")}>
              <Input
                id={fieldId("capacity")}
                type="number"
                className="font-mono"
                value={component.capacityVA ?? ""}
                onChange={(e) => onChange({ capacityVA: toNumber(e.target.value) })}
              />
            </Field>
            <Field label="Instalación de batería" htmlFor={fieldId("battery")}>
              <Input
                id={fieldId("battery")}
                type="date"
                className="font-mono"
                value={toDateInput(component.batteryInstallDate || new Date())}
                onChange={(e) => onChange({ batteryInstallDate: e.target.value || toDateInput(new Date()) })}
              />
            </Field>
          </Section>
        )}

        {type === "server" && (
          <Section title="Especificaciones del servidor">
            <Field label="CPU" htmlFor={fieldId("cpu")} wide>
              <Input id={fieldId("cpu")} value={specs?.cpu ?? ""} onChange={(e) => onSpecsChange({ cpu: e.target.value })} />
            </Field>
            <Field label="RAM" htmlFor={fieldId("ram")}>
              <Input id={fieldId("ram")} value={specs?.ram ?? ""} onChange={(e) => onSpecsChange({ ram: e.target.value })} />
            </Field>
            <Field label="Almacenamiento" htmlFor={fieldId("storage")}>
              <Input id={fieldId("storage")} value={specs?.storage ?? ""} onChange={(e) => onSpecsChange({ storage: e.target.value })} />
            </Field>
          </Section>
        )}
      </div>
    </Panel>
  )
}

/** Selector de estado: control segmentado con las cuatro opciones visibles */
function StatusPicker({ value, onChange }: { value: ComponentStatus; onChange: (status: ComponentStatus) => void }) {
  return (
    <div role="radiogroup" aria-label="Estado" className="grid grid-cols-2 gap-1 rounded-xl border border-line bg-subtle p-1 sm:grid-cols-4">
      {(Object.entries(STATUSES) as [ComponentStatus, (typeof STATUSES)[ComponentStatus]][]).map(([key, info]) => {
        const checked = value === key
        return (
          <button
            key={key}
            type="button"
            role="radio"
            aria-checked={checked}
            onClick={() => onChange(key)}
            className={cn(
              "flex h-9 items-center justify-center gap-2 rounded-[9px] border px-2 text-[13px] transition-[background-color,border-color,color] duration-150",
              checked ? "border-line-2 bg-surface-2 font-medium text-fg shadow-[inset_0_1px_0_var(--glass-highlight)]" : "border-transparent text-fg-3 hover:text-fg"
            )}
          >
            <Dot tone={info.tone} className="size-1.5" />
            <span className="truncate">{info.label}</span>
          </button>
        )
      })}
    </div>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  const id = useId()
  return (
    <div role="group" aria-labelledby={id} className="px-5 py-5">
      <h3 id={id} className="mb-4 text-[12.5px] font-semibold text-fg">
        {title}
      </h3>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </div>
  )
}

function Field({ label, htmlFor, wide, children }: { label: string; htmlFor?: string; wide?: boolean; children: ReactNode }) {
  return (
    <div className={cn("space-y-1.5", wide && "sm:col-span-2")}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  )
}
