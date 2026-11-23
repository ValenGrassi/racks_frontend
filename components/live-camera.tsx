"use client"

import { useEffect, useRef, useState } from "react"
import Hls from "hls.js"
import { Video, VideoOff } from "lucide-react"
import { Spinner } from "@/components/ui/loading"
import { API_URL, WS_URL } from "@/lib/api"

/**
 * Video en vivo de la cámara del rack.
 * 1. Por WebSocket le pide al backend que arranque ffmpeg para esa IP (se apaga al cerrar el socket).
 * 2. Espera a que ffmpeg genere la playlist HLS.
 * 3. La reproduce con hls.js (o de forma nativa en Safari/iOS).
 */
export function LiveCamera({ ip }: { ip: string }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [state, setState] = useState<"loading" | "playing" | "error">("loading")

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const streamUrl = `${API_URL}/stream/${ip}/index.m3u8`
    let cancelled = false
    let hls: Hls | null = null
    setState("loading")

    const ws = new WebSocket(WS_URL)
    ws.onopen = () => ws.send(JSON.stringify({ cameraIp: ip }))

    const play = () => {
      if (Hls.isSupported()) {
        hls = new Hls()
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          video.play().catch(() => {})
          setState("playing")
        })
        hls.on(Hls.Events.ERROR, (_event, data) => data.fatal && setState("error"))
        hls.loadSource(streamUrl)
        hls.attachMedia(video)
      } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
        video.src = streamUrl
        video.onloadeddata = () => setState("playing")
      } else {
        setState("error")
      }
    }

    waitForStream(streamUrl, () => cancelled).then((ready) => {
      if (cancelled) return
      if (ready) play()
      else setState("error")
    })

    return () => {
      cancelled = true
      ws.close()
      hls?.destroy()
    }
  }, [ip])

  return (
    <figure className="glass overflow-hidden rounded-2xl">
      <div className="relative aspect-video bg-[radial-gradient(120%_100%_at_30%_10%,#1c2a48,#070b16_72%)]">
        <video ref={videoRef} autoPlay muted playsInline className="absolute inset-0 size-full object-cover" />

        {state === "playing" && (
          <span className="absolute top-3 left-3 flex items-center gap-2 rounded-full bg-black/45 px-2.5 py-1 text-[11.5px] font-medium text-white backdrop-blur-md">
            <span className="size-1.5 animate-pulse rounded-full bg-[#f87171]" />
            En vivo
          </span>
        )}

        {state === "loading" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-[#9aa7c2]">
            <Spinner />
            <span className="text-[12.5px]">Conectando con la cámara…</span>
          </div>
        )}

        {state === "error" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 px-6 text-center">
            <VideoOff className="mb-1.5 size-5 text-[#9aa7c2]" />
            <p className="text-[13.5px] font-medium text-white">No se puede acceder a la cámara</p>
            <p className="text-[12.5px] text-[#9aa7c2]">Revisar IP, CORS o el servidor de streaming.</p>
          </div>
        )}
      </div>

      <figcaption className="flex items-center justify-between gap-3 px-5 py-3">
        <span className="flex items-center gap-2 text-[13.5px] font-medium text-fg">
          <Video className="size-4 text-fg-3" />
          Cámara del rack
        </span>
        <span className="font-mono text-[12px] text-fg-3">{ip}</span>
      </figcaption>
    </figure>
  )
}

/** Consulta la playlist hasta que exista (máx. ~16 segundos). */
async function waitForStream(url: string, isCancelled: () => boolean) {
  for (let attempt = 0; attempt < 20 && !isCancelled(); attempt++) {
    try {
      const res = await fetch(url, { cache: "no-store" })
      if (res.ok) return true
    } catch {
      // el backend todavía no generó el archivo
    }
    await new Promise((r) => setTimeout(r, 800))
  }
  return false
}
