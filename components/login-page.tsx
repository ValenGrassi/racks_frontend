"use client"

import { useState, type FormEvent } from "react"
import { ArrowLeft, ArrowRight, CircleAlert, Lock, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/loading"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { Brand, BrandMark } from "./brand"

interface LoginPageProps {
  onLogin: (email: string, password: string) => void
  onCancel?: () => void
}

/** Login simulado: acepta cualquier email y contraseña (no hay autenticación real en el backend). */
export function LoginPage({ onLogin, onCancel }: LoginPageProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    if (!email || !password) {
      setError("Por favor completa todos los campos")
      setIsLoading(false)
      return
    }

    if (!email.includes("@")) {
      setError("Por favor ingresa un email válido")
      setIsLoading(false)
      return
    }

    // Simula la demora de un login real
    setTimeout(() => {
      onLogin(email, password)
      setIsLoading(false)
    }, 2000)
  }

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden">
      {/* Cuadrícula técnica que se desvanece hacia los bordes */}
      <div
        className="bg-grid pointer-events-none absolute inset-0 opacity-60 [mask-image:radial-gradient(ellipse_60%_55%_at_50%_45%,black,transparent)]"
        aria-hidden
      />

      <header className="relative flex h-16 items-center justify-between px-4 sm:px-8">
        <Brand />
        <div className="flex items-center gap-1">
          {onCancel && (
            <button
              onClick={onCancel}
              className="group flex h-[34px] items-center gap-1.5 rounded-[10px] px-3 text-[13px] text-fg-2 transition-colors hover:bg-muted hover:text-fg"
            >
              <ArrowLeft className="size-4 transition-transform duration-150 group-hover:-translate-x-0.5" />
              Volver a ubicaciones
            </button>
          )}
          <ThemeToggle />
        </div>
      </header>

      <main className="relative flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-[400px]">
          <div className="glass rounded-2xl p-7 sm:p-9">
            <BrandMark className="size-11 drop-shadow-[0_10px_24px_rgb(79_127_232/0.45)]" />
            <h1 className="mt-6 text-[28px] font-semibold tracking-[-0.04em] text-fg">Iniciar sesión</h1>
            <p className="mt-1.5 text-[14px] text-fg-3">Accedé al sistema de gestión de racks de servidores.</p>

            <form onSubmit={handleSubmit} className="mt-7 space-y-4">
              {error && (
                <div
                  role="alert"
                  className="flex animate-enter items-center gap-2 rounded-[10px] bg-critical-wash px-3 py-2.5 text-[13px] text-critical-ink shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--critical)_25%,transparent)]"
                >
                  <CircleAlert className="size-4 shrink-0" />
                  {error}
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-fg-4" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@cinemark.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-11 pl-9"
                    disabled={isLoading}
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">Contraseña</Label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-fg-4" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-11 pl-9"
                    disabled={isLoading}
                    autoComplete="current-password"
                  />
                </div>
              </div>

              <Button type="submit" size="lg" className="mt-3 w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Spinner className="size-4" />
                    Iniciando sesión…
                  </>
                ) : (
                  <>
                    Iniciar sesión
                    <ArrowRight className="transition-transform duration-150 group-hover/button:translate-x-0.5" />
                  </>
                )}
              </Button>
            </form>
          </div>

          <p className="mt-6 text-center text-[12.5px] text-fg-4">SAR · Sistema de Autogestión de Racks · Cinemark Hoyts</p>
        </div>
      </main>
    </div>
  )
}
