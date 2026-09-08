import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

/**
 * Button (vendored shadcn shell, T-006 supertaskr look — no stock shadcn
 * styling remains). Two first-class looks from the design handoff:
 *
 * - default:  the ink pill ("Open a folder…") — --primary fill, radius 10
 * - outline:  the quiet control ("Toggle theme") — surface fill, --input
 *             border, hairline shadow-card lift (none in dark)
 *
 * Everything resolves to tokens.css; focus is the keyboard-only 2px
 * --ring outline the whole app shares. No transitions — the motion
 * budget is spent on the pulse dots.
 */
const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center font-medium whitespace-nowrap select-none outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/85",
        outline:
          "border border-input bg-background text-foreground shadow-card hover:bg-muted dark:bg-secondary dark:hover:bg-accent",
        secondary: "bg-secondary text-secondary-foreground hover:bg-accent",
        ghost: "text-muted-foreground hover:bg-muted hover:text-foreground",
        destructive:
          "border border-status-rejected-border bg-status-rejected text-destructive hover:border-status-rejected-border-strong",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "rounded-lg px-3.5 py-1.75 text-sm",
        sm: "rounded-md px-2.25 py-1 text-xs",
        lg: "rounded-lg px-5 py-2.75 text-base",
        icon: "size-8 rounded-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
