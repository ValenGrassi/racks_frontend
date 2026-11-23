"use client"

import { useRef, useState } from "react"
import Link from "next/link"
import { MapPin, PenLine, ServerCrash } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tag } from "@/components/ui/status"
import { homeUrl } from "@/lib/navigation"
import { formatDate } from "@/lib/rack"
import type { Cinema, RackComponent } from "@/types/cinema"
import { ComponentDetails } from "./component-details"
import { LiveCamera } from "./live-camera"
import { PageLayout } from "./page-layout"
import { BatteryCard, EnergyCard, EnergyOverview } from "./power-consumption-card"
import { RackDiagram } from "./rack-diagram"
import { QrCard, ShareRackButton } from "./share-rack-card"
import { UpsLiveCard } from "./ups-live-card"

interface RackDashboardProps {
  cinema: Cinema
  onBack: () => void
}

/**
 * Vista de un rack. Arriba, el resumen de energía. Abajo, en tres columnas:
 * el dibujo del rack · el inspector, el consumo y la cámara · el UPS en vivo, las baterías y el QR.
 */
export function RackDashboard({ cinema, onBack }: RackDashboardProps) {
  // Se guarda el id: si llegan datos más nuevos del servidor, el inspector muestra la versión actual
  const [selectedId, setSelectedId] = useState<RackComponent["id"] | null>(null)
  const selected = cinema.rackComponents.find((c) => c.id === selectedId) ?? null
  const detailsRef = useRef<HTMLDivElement>(null)

  const showCamera = cinema.cameraEnabled && !!cinema.cameraIp
  const showUps = cinema.upsEnabled && !!cinema.upsIp

  const handleSelect = (component: RackComponent) => {
    setSelectedId(component.id)
    detailsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  return (
    <PageLayout
      crumbs={[{ label: "Ubicaciones", onClick: onBack }, { label: cinema.name }]}
      title={cinema.name}
      subtitle={
        <span className="flex items-center gap-1.5">
          <MapPin className="size-4 shrink-0 text-fg-3" />
          {cinema.address}
        </span>
      }
      meta={
        <>
          <Tag tone={cinema.generator ? "ok" : "critical"} icon={ServerCrash}>
            {cinema.generator ? "Tiene generador" : "No tiene generador"}
          </Tag>
          {cinema.location && <span className="font-mono text-[12px] text-fg-3">{cinema.location}</span>}
          <span className="text-[13px] text-fg-3">Actualizado {formatDate(cinema.lastUpdated)}</span>
        </>
      }
      actions={
        <>
          <Button asChild variant="secondary">
            <Link href={homeUrl.edit(cinema.id)}>
              <PenLine />
              Editar rack
            </Link>
          </Button>
          <ShareRackButton cinemaId={cinema.id} />
        </>
      }
      overview={<EnergyOverview cinema={cinema} />}
    >
      <div className="grid gap-5 lg:grid-cols-[minmax(0,384px)_minmax(0,1fr)] xl:grid-cols-[minmax(0,384px)_minmax(0,1fr)_minmax(0,340px)]">
        <div className="lg:sticky lg:top-20 lg:row-span-2 lg:self-start xl:row-span-1">
          <RackDiagram cinema={cinema} selectedId={selected?.id} onSelect={handleSelect} />
        </div>

        <div className="min-w-0 space-y-5">
          <div ref={detailsRef} className="scroll-mt-20">
            <ComponentDetails component={selected} />
          </div>
          <EnergyCard cinema={cinema} />
          {showCamera && <LiveCamera ip={cinema.cameraIp!} />}
        </div>

        <div className="min-w-0 space-y-5 lg:col-start-2 xl:col-start-3 xl:row-start-1">
          {showUps && <UpsLiveCard upsIp={cinema.upsIp!} />}
          <BatteryCard cinema={cinema} />
          <QrCard cinemaId={cinema.id} />
        </div>
      </div>
    </PageLayout>
  )
}
