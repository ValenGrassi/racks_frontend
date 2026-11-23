import type { Cinema, RackComponent } from "@/types/cinema"

/** Backend (API REST, WebSocket y video de cámaras). Se configura en .env */
export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"
export const WS_URL = API_URL.replace(/^http/, "ws")

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json" },
  })
  if (!res.ok) throw new ApiError(res.status, `HTTP ${res.status} ${res.statusText}`)
  return res.json()
}

/** Lo que acepta PATCH /api/cinemas/:id */
export type CinemaUpdate = Partial<
  Pick<Cinema, "name" | "location" | "address" | "generator" | "cameraEnabled" | "cameraIp" | "upsEnabled" | "upsIp">
> & { rackComponents?: RackComponent[] }

export const api = {
  getCinemas: () => request<Cinema[]>("/api/cinemas"),
  getCinema: (id: string) => request<Cinema>(`/api/cinemas/${id}`),
  updateCinema: (id: string, changes: CinemaUpdate) =>
    request<Cinema>(`/api/cinemas/${id}`, { method: "PATCH", body: JSON.stringify(changes) }),
}
