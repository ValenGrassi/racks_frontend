import * as React from "react"

import { cn } from "@/lib/utils"

/** Clases compartidas por Input, Textarea y el disparador de Select */
export const fieldClasses = cn(
  "w-full min-w-0 rounded-[10px] border border-line bg-subtle text-[13.5px] text-fg",
  "transition-[border-color,box-shadow,background-color] duration-150 outline-none",
  "placeholder:text-fg-4 hover:border-line-2",
  "focus-visible:border-accent focus-visible:bg-surface-2 focus-visible:shadow-[0_0_0_3px_var(--accent-wash)] focus-visible:outline-none",
  "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-line",
  "aria-invalid:border-critical aria-invalid:focus-visible:shadow-[0_0_0_3px_var(--critical-wash)]"
)

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return <input type={type} data-slot="input" className={cn(fieldClasses, "h-10 px-3", className)} {...props} />
}

export { Input }
