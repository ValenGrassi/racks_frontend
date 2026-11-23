// Registro de actividad guardado en el navegador (localStorage).
// Solo lo ve quien hizo los cambios en esa misma computadora.

export interface LogEntry {
  id: string
  action: string
  cinema: string
  user: string
  timestamp: string
  details: string
}

const STORAGE_KEY = "rackLogs"

export function getLogs(): LogEntry[] {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]")
}

export function addLog(entry: Omit<LogEntry, "id" | "timestamp">) {
  const log = { ...entry, id: `log-${Date.now()}`, timestamp: new Date().toISOString() }
  localStorage.setItem(STORAGE_KEY, JSON.stringify([log, ...getLogs()]))
}
