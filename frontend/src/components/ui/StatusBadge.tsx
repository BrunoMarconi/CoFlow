import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type StatusBadgeVariant = "success" | "warning" | "info" | "neutral";

const VARIANTS: Record<StatusBadgeVariant, string> = {
  success: "bg-mint-100 text-primary-dark",
  warning: "bg-amber-100 text-amber-800",
  info: "bg-mint-50 text-primary-dark",
  neutral: "bg-surface-muted text-secondary",
};

export default function StatusBadge({
  children,
  variant = "neutral",
  className,
}: {
  children: ReactNode;
  variant?: StatusBadgeVariant;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-[26px] items-center rounded-full px-3 text-xs font-bold leading-none",
        VARIANTS[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
