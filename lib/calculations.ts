import type { RackComponent } from "@/types/cinema"

// ── Baterías de UPS ────────────────────────────────────────────

/** Vida útil estimada de una batería de UPS */
const BATTERY_LIFE_MONTHS = 48

export function batteryMonthsLeft(installDate: string): number {
  const install = new Date(installDate)
  const now = new Date()
  const monthsUsed = (now.getFullYear() - install.getFullYear()) * 12 + (now.getMonth() - install.getMonth())
  return Math.max(0, BATTERY_LIFE_MONTHS - monthsUsed)
}

/** true si a la batería le quedan 12 meses o menos */
export function isBatteryDue(installDate: string): boolean {
  return batteryMonthsLeft(installDate) <= 12
}

// ── Energía del rack ───────────────────────────────────────────

export function totalPowerW(components: RackComponent[]): number {
  return components.reduce((sum, c) => sum + (c.powerConsumption ?? 0), 0)
}

export function totalUpsVA(components: RackComponent[]): number {
  return components.filter((c) => c.type === "ups").reduce((sum, c) => sum + (c.capacityVA ?? 0), 0)
}

/** Porcentaje de la capacidad de los UPS que consume el rack */
export function upsLoadPercent(components: RackComponent[]): number {
  const capacity = totalUpsVA(components)
  return capacity ? Math.round((totalPowerW(components) / capacity) * 100) : 0
}

/**
 * Autonomía estimada en horas (redondeada a 1 decimal).
 * Fórmula simplificada: energía de las baterías × eficiencia × estado de batería / consumo.
 * Se asume 1 pack de 480 Wh, 2 packs desde 5 kVA y 4 packs desde 10 kVA.
 */
export function upsAutonomyHours(components: RackComponent[]): number {
  const consumptionW = totalPowerW(components)
  const capacityVA = totalUpsVA(components)
  if (!consumptionW || !capacityVA) return 0

  const packs = capacityVA >= 10000 ? 4 : capacityVA >= 5000 ? 2 : 1
  const energyWh = 480 * packs
  const efficiency = 0.9
  const batteryFactor = 0.7

  return Math.round(((energyWh * efficiency * batteryFactor) / consumptionW) * 10) / 10
}
