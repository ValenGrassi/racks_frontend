// Tipos que devuelve el backend (ver backend/prisma/schema.prisma)

export type ComponentType =
  | "server"
  | "patch-panel"
  | "ups"
  | "switch"
  | "router"
  | "firewall"
  | "wireless-controller"
  | "converter"

export type ComponentStatus = "online" | "offline" | "warning" | "maintenance"

export interface PortConnection {
  portNumber: number
  isConnected: boolean
  connectedTo?: string | null
  description?: string | null
}

export interface ComponentSpecs {
  cpu?: string | null
  ram?: string | null
  storage?: string | null
  ports?: number | null
  connections?: number | null
  portDetails?: PortConnection[]
}

export interface RackComponent {
  /** number = ya guardado en la base; string = recién agregado en el editor, todavía sin guardar */
  id: number | string
  type: ComponentType
  name: string
  model?: string | null
  status: ComponentStatus
  /** Posición en el rack (unidad "U") */
  position: number
  description?: string
  powerConsumption?: number | null
  /** Solo UPS */
  capacityVA?: number | null
  /** Solo UPS */
  batteryInstallDate?: string | null
  specs?: ComponentSpecs | null
}

export interface Cinema {
  id: string
  name: string
  location: string | null
  address: string
  generator: boolean
  cameraEnabled: boolean
  cameraIp: string | null
  upsEnabled: boolean
  upsIp: string | null
  lastUpdated: string
  rackComponents: RackComponent[]
}

/** Lo que manda el UPS en vivo por WebSocket (ver backend/src/live/ups-monitor.ts) */
export interface UpsLiveData {
  name: string
  model: string
  outputVoltage: number
  loadPercentage: number
  /** Centésimas de segundo */
  runtimeRemaining: number
  ultimaAutoprueba: string
  /** 1 ok, 2 falló, 3 no se pudo hacer, 4 en curso */
  selfTestResult: number
}
