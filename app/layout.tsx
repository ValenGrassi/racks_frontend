import type { Metadata } from "next"
import type { ReactNode } from "react"
import { GeistMono } from "geist/font/mono"
import { GeistSans } from "geist/font/sans"
import { ToastProvider } from "@/components/ui/toast"
import { SessionProvider } from "@/lib/session"
import { THEME_STORAGE_KEY } from "@/lib/theme"
import "./globals.css"

export const metadata: Metadata = {
  title: "SAR · Racks de IT · Cinemark Hoyts",
  description: "Sistema de Autogestión de Racks",
  generator: "Next.js",
}

// Se ejecuta antes de pintar: si el tema guardado es el claro, lo aplica (el oscuro ya viene en el HTML)
const themeScript = `try{if(localStorage.getItem("${THEME_STORAGE_KEY}")==="light"){var c=document.documentElement.classList;c.remove("dark");c.add("light")}}catch(e){}`

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    // suppressHydrationWarning: el script de arriba puede cambiar la clase del tema antes de que cargue React
    <html lang="es" className={`${GeistSans.variable} ${GeistMono.variable} dark`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-screen">
        <SessionProvider>
          <ToastProvider>{children}</ToastProvider>
        </SessionProvider>
      </body>
    </html>
  )
}
