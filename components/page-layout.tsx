import { Fragment, type ReactNode } from "react"
import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { CONTAINER, cn } from "@/lib/utils"
import { AppHeader } from "./app-header"

export interface Crumb {
  label: string
  onClick?: () => void
  href?: string
}

interface PageLayoutProps {
  /** Ruta sobre el título: "Ubicaciones › Cine Palermo" */
  crumbs?: Crumb[]
  /** Texto chico sobre el título, cuando no hay ruta */
  eyebrow?: ReactNode
  title: string
  subtitle?: ReactNode
  /** Datos breves bajo el título (etiquetas, fechas) */
  meta?: ReactNode
  /** Botones a la derecha del título */
  actions?: ReactNode
  /** Resumen en cifras debajo del encabezado */
  overview?: ReactNode
  children: ReactNode
}

/** Estructura de todas las pantallas: menú flotante, encabezado (ruta, título, acciones, resumen) y contenido. */
export function PageLayout({ crumbs, eyebrow, title, subtitle, meta, actions, overview, children }: PageLayoutProps) {
  return (
    <>
      <AppHeader />

      <div className={cn(CONTAINER, "pt-8 md:pt-10")}>
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            {crumbs?.length ? <Breadcrumbs crumbs={crumbs} /> : eyebrow && <p className="text-[13px] text-fg-3">{eyebrow}</p>}
            <h1 className="mt-2.5 text-[34px] leading-[1.02] font-semibold tracking-[-0.045em] text-fg md:text-[46px]">{title}</h1>
            {subtitle && <div className="mt-3 text-[14.5px] text-fg-2">{subtitle}</div>}
            {meta && <div className="mt-3.5 flex flex-wrap items-center gap-x-3.5 gap-y-2">{meta}</div>}
          </div>
          {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
        </div>
        {overview && <div className="mt-7">{overview}</div>}
      </div>

      <main className={cn(CONTAINER, "pt-5 pb-24 md:pt-6")}>{children}</main>
    </>
  )
}

function Breadcrumbs({ crumbs }: { crumbs: Crumb[] }) {
  return (
    <nav aria-label="Ruta">
      <ol className="flex flex-wrap items-center gap-1.5 text-[13px]">
        {crumbs.map((crumb, i) => {
          const isLast = i === crumbs.length - 1
          const cls = "rounded-md text-fg-3 transition-colors hover:text-fg"
          return (
            <Fragment key={crumb.label}>
              {i > 0 && <ChevronRight className="size-3.5 text-fg-4" aria-hidden />}
              <li>
                {isLast ? (
                  <span aria-current="page" className="font-medium text-fg-2">
                    {crumb.label}
                  </span>
                ) : crumb.href ? (
                  <Link href={crumb.href} className={cls}>
                    {crumb.label}
                  </Link>
                ) : crumb.onClick ? (
                  <button onClick={crumb.onClick} className={cls}>
                    {crumb.label}
                  </button>
                ) : (
                  <span className="text-fg-3">{crumb.label}</span>
                )}
              </li>
            </Fragment>
          )
        })}
      </ol>
    </nav>
  )
}
