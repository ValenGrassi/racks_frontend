import { useEffect, useState } from "react"
import { WS_URL } from "@/lib/api"
import type { UpsLiveData } from "@/types/cinema"

/**
 * Pide al backend el estado del UPS en vivo (por SNMP, cada ~3s).
 * Mientras no llegue el primer dato devuelve null. Al desmontar cierra el socket
 * y el backend deja de consultar el UPS.
 */
export function useUpsLive(upsIp: string) {
  const [data, setData] = useState<UpsLiveData | null>(null)

  useEffect(() => {
    setData(null)
    const ws = new WebSocket(WS_URL)
    ws.onopen = () => ws.send(JSON.stringify({ upsIp }))
    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data)
      if (msg.type === "ups-status") setData(msg)
    }
    ws.onerror = (err) => console.error("WebSocket UPS:", err)
    return () => ws.close()
  }, [upsIp])

  return data
}
