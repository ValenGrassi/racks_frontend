import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Ancho y márgenes laterales compartidos por la barra superior, los encabezados y el contenido */
export const CONTAINER = "mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-10 xl:px-12"
