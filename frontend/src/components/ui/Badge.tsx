import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface BadgeProps {
  children: ReactNode;
  className?: string;
  variant?: "default" | "success" | "warning" | "danger" | "info";
}

const variants = {
  default: "border-border bg-surface text-secondary",
  success: "border-primary/25 bg-surface text-primary-dark",
  warning: "bg-amber-100 text-amber-700",
  danger: "bg-red-100 text-red-700",
  info: "border-border bg-surface text-brand-dark",
};

export default function Badge({
  children,
  className,
  variant = "default",
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold shadow-soft",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
