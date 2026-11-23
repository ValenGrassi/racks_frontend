"use client"

import { AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"

interface LeaveDialogProps {
  open: boolean
  onStay: () => void
  onLeave: () => void
}

/** Confirmación al salir de una pantalla con cambios sin guardar */
export function LeaveDialog({ open, onStay, onLeave }: LeaveDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onStay()}>
      <DialogContent className="max-w-md">
        <div className="p-6">
          <div className="flex size-10 items-center justify-center rounded-xl bg-warning-wash text-warning-ink shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--warning)_30%,transparent)]">
            <AlertTriangle className="size-[18px]" />
          </div>
          <DialogTitle className="mt-4">Hay cambios sin guardar</DialogTitle>
          <DialogDescription className="mt-1.5 text-[13.5px]">Si salís ahora, los cambios que hiciste en esta pantalla se pierden.</DialogDescription>
          <div className="mt-6 flex flex-wrap justify-end gap-2">
            <Button variant="secondary" onClick={onStay} autoFocus>
              Seguir editando
            </Button>
            <Button variant="danger" className="border border-critical/30" onClick={onLeave}>
              Salir sin guardar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
