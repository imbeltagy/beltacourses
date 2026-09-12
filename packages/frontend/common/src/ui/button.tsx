import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground before:border-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground before:border-destructive-foreground hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "border shadow-xs hover:bg-primary/10 text-primary before:border-primary border-primary/40",
        secondary:
          "bg-secondary text-secondary-foreground before:border-secondary-foreground hover:bg-secondary/80",
        ghost:
          "hover:bg-accent before:border-foreground hover:text-accent-foreground hover:before:border-accent-foreground dark:hover:bg-accent/50",
        link: "text-primary before:border-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  loading = false,
  children,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    loading?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(
        "relative",
        buttonVariants({ variant, size, className }),
        "before:absolute before:top-1/2 before:left-1/2 before:h-6 before:w-6 before:-translate-x-1/2 before:-translate-y-1/2 before:animate-spin before:rounded-full before:border-2 before:!border-t-transparent before:content-['']",
        loading
          ? "!text-transparent select-none"
          : "before:!border-transparent",
      )}
      {...props}
      disabled={loading || props.disabled}
    >
      {children}
    </Comp>
  );
}

export { Button, buttonVariants };
