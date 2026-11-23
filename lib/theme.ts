// Tema oscuro / claro. El oscuro ("Cristal nocturno") es el predeterminado; la elección se guarda en el navegador.
// <html> arranca con la clase "dark" y el script de app/layout.tsx la cambia a "light" antes de pintar
// si esa fue la elección guardada, así no hay parpadeo al cargar.

export const THEME_STORAGE_KEY = "sar-theme"

export type Theme = "light" | "dark"

export function currentTheme(): Theme {
  return document.documentElement.classList.contains("light") ? "light" : "dark"
}

export function setTheme(theme: Theme) {
  const root = document.documentElement
  // Sin transiciones durante el cambio: todo pasa de un tema al otro en el mismo cuadro
  root.classList.add("theme-switching")
  root.classList.toggle("light", theme === "light")
  root.classList.toggle("dark", theme === "dark")
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme)
  } catch {
    // navegación privada o almacenamiento bloqueado: el tema dura hasta recargar
  }
  requestAnimationFrame(() => requestAnimationFrame(() => root.classList.remove("theme-switching")))
}
