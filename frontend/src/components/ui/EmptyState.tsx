import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export default function EmptyState({
  title,
  description,
  icon,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-18 border border-dashed border-border bg-surface p-8 text-center sm:p-12",
        className
      )}
    >
      {icon && (
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-mint-50 text-primary [&>svg]:h-6 [&>svg]:w-6">
          {icon}
        </div>
      )}

      <h3 className="text-lg font-bold text-foreground">{title}</h3>

      {description && (
        <p className="mt-2 max-w-sm text-sm text-secondary">{description}</p>
      )}

      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
