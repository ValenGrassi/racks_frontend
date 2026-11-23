"use client"

import { useEffect, useRef, useState } from "react"
import { QRCodeCanvas } from "qrcode.react"
import { Download, Share2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Panel } from "@/components/ui/panel"
import { useToast } from "@/components/ui/toast"

/** Enlace público a la vista de un rack (window solo existe en el navegador) */
function useRackUrl(cinemaId: string) {
  const [url, setUrl] = useState("")
  useEffect(() => {
    setUrl(`${window.location.origin}/racks/${cinemaId}`)
  }, [cinemaId])
  return url
}

/** Botón "Compartir rack" del encabezado: comparte el enlace o, si no se puede, lo copia */
export function ShareRackButton({ cinemaId }: { cinemaId: string }) {
  const url = useRackUrl(cinemaId)
  const notify = useToast()

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({ title: "Rack", text: "Mirá este rack del cine", url }).catch(() => {})
    } else {
      await navigator.clipboard.writeText(url)
      notify({ tone: "success", title: "Enlace copiado al portapapeles" })
    }
  }

  return (
    <Button onClick={handleShare} disabled={!url}>
      <Share2 />
      Compartir rack
    </Button>
  )
}

/** QR con el link al rack, para pegarlo en el rack físico, con su botón de descarga. */
export function QrCard({ cinemaId }: { cinemaId: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const url = useRackUrl(cinemaId)

  const handleDownload = () => {
    if (!canvasRef.current) return
    const link = document.createElement("a")
    link.href = canvasRef.current.toDataURL("image/png")
    link.download = `rack-qr-${cinemaId}.png`
    link.click()
  }

  return (
    <Panel className="flex items-center gap-4 p-4 sm:gap-5 sm:p-5">
      {/* El QR va siempre sobre blanco, también en modo oscuro, para que se pueda escanear */}
      <div className="flex size-[104px] shrink-0 items-center justify-center rounded-xl bg-white shadow-[0_8px_24px_-12px_rgb(0_0_0/0.5)]">
        {url && <QRCodeCanvas ref={canvasRef} value={url} size={88} bgColor="#ffffff" fgColor="#060a14" />}
      </div>
      <div className="min-w-0 flex-1">
        <h2 className="text-[14px] font-semibold tracking-[-0.01em] text-fg">Acceso directo</h2>
        <p className="mt-0.5 text-[13px] text-fg-3">Escaneá el código desde el rack físico.</p>
        <p className="mt-1 truncate font-mono text-[11.5px] text-fg-4">{url}</p>
        <Button variant="secondary" size="sm" className="mt-3" onClick={handleDownload} disabled={!url}>
          <Download />
          Descargar QR
        </Button>
      </div>
    </Panel>
  )
}
