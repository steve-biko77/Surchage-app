import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide [&_svg]:size-3",
  {
    variants: {
      variant: {
        default: "bg-white/5 text-[var(--grey)] border border-[var(--steel)]",
        accent: "bg-[var(--accent-wash)] text-[var(--accent-text)] border border-[var(--accent)]/40",
        info: "bg-[#122233] text-[#7fb8e8] border border-[#3B82C4]/40",
        success: "bg-[#0f2a1a] text-[#4CAF50] border border-[#4CAF50]/40",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant, className }))} {...props} />;
}

export { Badge, badgeVariants };
