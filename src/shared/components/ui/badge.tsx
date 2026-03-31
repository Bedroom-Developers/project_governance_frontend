import { useRender } from "@base-ui/react/use-render";
import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";

import { cn } from "@/shared/lib/utils";

const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden whitespace-nowrap rounded-md border px-2.5 py-1 text-xs font-semibold [&>svg]:size-3 [&>svg]:pointer-events-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40",
  {
    variants: {
      variant: {
        default:
          "border-primary/15 bg-primary/10 text-primary [a&]:hover:bg-primary/15",
        secondary:
          "border-border bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/85",
        destructive:
          "border-destructive/20 bg-destructive/10 text-destructive [a&]:hover:bg-destructive/15 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40",
        outline:
          "border-border bg-background text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Badge({
  className,
  variant,
  render = <span />,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { render?: useRender.RenderProp }) {
  return useRender({
    render,
    props: {
      "data-slot": "badge",
      className: cn(badgeVariants({ variant }), className),
      ...props,
    },
  });
}

export { Badge, badgeVariants };
