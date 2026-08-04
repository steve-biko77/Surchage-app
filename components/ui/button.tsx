import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold uppercase tracking-wide transition-colors duration-200 disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)] [&_svg]:size-4 [&_svg]:shrink-0 cursor-pointer touch-manipulation",
  {
    variants: {
      variant: {
        primary:
          "bg-gradient-to-b from-[#ff7a45] to-[#c2410c] text-[#1a0d05] shadow-[0_2px_12px_rgba(255,90,31,0.35)] hover:brightness-110 active:scale-[0.98] focus-visible:ring-[#FF5A1F]",
        secondary:
          "bg-gradient-to-b from-[#5ba3e0] to-[#2a5f8f] text-[#08131f] hover:brightness-110 active:scale-[0.98] focus-visible:ring-[#3B82C4]",
        outline:
          "border border-[var(--steel)] text-[var(--chalk)] bg-transparent hover:bg-white/5 active:scale-[0.98] focus-visible:ring-[var(--steel)]",
        ghost:
          "text-[var(--grey)] hover:text-[var(--chalk)] hover:bg-white/5 active:scale-[0.98] focus-visible:ring-[var(--steel)]",
        pill:
          "rounded-full border border-[var(--steel)] text-[var(--chalk)] normal-case font-medium tracking-normal hover:border-[#FF5A1F] hover:text-[#FF5A1F] active:scale-[0.96] focus-visible:ring-[#FF5A1F]",
      },
      size: {
        default: "h-11 px-4 py-2 min-w-11",
        sm: "h-9 px-3 text-xs min-w-9",
        lg: "h-12 px-6 text-base min-w-12",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
