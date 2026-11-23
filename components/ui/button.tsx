import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  [
    "group/button inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap select-none",
    "font-medium transition-[background-color,background-image,border-color,color,box-shadow,filter] duration-150",
    "active:brightness-95 disabled:pointer-events-none disabled:opacity-45",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  ],
  {
    variants: {
      variant: {
        // Acción principal: degradé azul con brillo
        primary: "btn-primary hover:brightness-110",
        // Acción secundaria: cristal elevado
        secondary: "border border-line bg-surface-2 text-fg shadow-[inset_0_1px_0_var(--glass-highlight)] hover:border-line-2 hover:bg-muted",
        ghost: "text-fg-2 hover:bg-muted hover:text-fg",
        danger: "text-critical-ink hover:bg-critical-wash",
        // Sobre la imagen de la cámara
        inverse: "border border-white/12 bg-black/40 text-white backdrop-blur-md hover:bg-black/55",
      },
      size: {
        sm: "h-8 rounded-[9px] px-3 text-[13px]",
        md: "h-9 rounded-[10px] px-3.5 text-[13.5px]",
        lg: "h-11 rounded-[12px] px-5 text-[14px]",
        icon: "size-8 rounded-[9px]",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return <Comp data-slot="button" className={cn(buttonVariants({ variant, size, className }))} {...props} />
}

export { Button, buttonVariants }
