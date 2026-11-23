import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { Brand } from "./brand"

/** Pantalla de "no encontrado", para páginas inexistentes o racks que no existen. */
export function NotFoundMessage({ code = "Error 404", message }: { code?: string; message: string }) {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden">
      <div
        className="bg-grid pointer-events-none absolute inset-0 opacity-60 [mask-image:radial-gradient(ellipse_60%_55%_at_50%_45%,black,transparent)]"
        aria-hidden
      />
      <header className="relative flex h-16 items-center justify-between px-4 sm:px-8">
        <Link href="/" className="rounded-md p-1" aria-label="Inicio">
          <Brand />
        </Link>
        <ThemeToggle />
      </header>
      <main className="relative flex flex-1 flex-col items-center justify-center px-6 pb-16 text-center">
        <span className="glass rounded-full px-3 py-1 font-mono text-[12px] text-fg-2">{code}</span>
        <h1 className="mt-6 text-[40px] leading-[1.02] font-semibold tracking-[-0.045em] text-fg sm:text-[56px]">Página no encontrada</h1>
        <p className="mt-3 max-w-md text-[15px] text-fg-2">{message}</p>
        <Button asChild size="lg" className="mt-8">
          <Link href="/">
            <ArrowLeft className="transition-transform duration-150 group-hover/button:-translate-x-0.5" />
            Volver al inicio
          </Link>
        </Button>
      </main>
    </div>
  )
}
