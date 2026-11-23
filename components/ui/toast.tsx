"use client"

import { createContext, useCallback, useContext, useState, type ReactNode } from "react"
import { CheckCircle2, CircleAlert, Info, X } from "lucide-react"

type ToastTone = "success" | "error" | "info"

interface ToastOptions {
  tone?: ToastTone
  title: string
  description?: string
}

interface Toast extends ToastOptions {
  id: number
}

const ICONS = {
  success: <CheckCircle2 className="size-4 text-ok" />,
  error: <CircleAlert className="size-4 text-critical" />,
  info: <Info className="size-4 text-accent" />,
}

const ToastContext = createContext<(toast: ToastOptions) => void>(() => {})

/** Avisos breves abajo a la derecha. Vive en el layout raíz, así sobrevive a los cambios de página. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const dismiss = useCallback((id: number) => setToasts((prev) => prev.filter((t) => t.id !== id)), [])

  const notify = useCallback(
    (toast: ToastOptions) => {
      const id = Date.now() + Math.random()
      setToasts((prev) => [...prev, { ...toast, id }])
      setTimeout(() => dismiss(id), 4200)
    },
    [dismiss]
  )

  return (
    <ToastContext.Provider value={notify}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-4 bottom-4 z-[60] flex flex-col items-center gap-2 sm:inset-x-auto sm:right-5 sm:bottom-5 sm:items-end"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            className="glass-elevated pointer-events-auto flex w-full max-w-[360px] animate-toast items-start gap-3 rounded-xl py-3 pr-3 pl-3.5"
          >
            <span className="mt-0.5">{ICONS[toast.tone ?? "info"]}</span>
            <div className="min-w-0 flex-1">
              <p className="text-[13.5px] font-medium leading-snug text-fg">{toast.title}</p>
              {toast.description && <p className="mt-0.5 text-[12.5px] text-fg-3">{toast.description}</p>}
            </div>
            <button
              onClick={() => dismiss(toast.id)}
              className="rounded-lg p-0.5 text-fg-4 transition-colors hover:bg-muted hover:text-fg"
              aria-label="Cerrar aviso"
            >
              <X className="size-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  return useContext(ToastContext)
}
