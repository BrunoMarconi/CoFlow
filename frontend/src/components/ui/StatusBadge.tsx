import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type StatusBadgeVariant = "success" | "warning" | "info" | "neutral";

const VARIANTS: Record<StatusBadgeVariant, string> = {
  success: "border-primary/25 bg-surface text-primary-dark",
  warning: "border-amber-200 bg-surface text-amber-800",
  info: "border-primary/20 bg-surface text-primary-dark",
  neutral: "border-border bg-surface text-secondary",
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
        "inline-flex h-[26px] items-center rounded-full border px-3 text-xs font-bold leading-none shadow-soft",
        VARIANTS[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
