import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-sans text-body-sm font-medium tracking-wider uppercase transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-virtuosa-antique-gold focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:   "bg-virtuosa-antique-gold text-white hover:bg-[#b8893e] hover:-translate-y-px rounded-[4px]",
        secondary: "border border-virtuosa-deep-brown text-virtuosa-deep-brown hover:bg-virtuosa-deep-brown hover:text-white rounded-[4px]",
        ghost:     "text-virtuosa-light-brown hover:text-virtuosa-deep-brown hover:underline underline-offset-4",
        dark:      "bg-virtuosa-deep-brown text-white hover:bg-[#4a3025] rounded-[4px]",
      },
      size: {
        sm:  "px-5 py-2.5 text-[11px]",
        md:  "px-8 py-4 text-body-sm",
        lg:  "px-10 py-5 text-body",
        icon:"w-10 h-10",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
