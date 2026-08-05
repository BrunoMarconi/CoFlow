import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export default function SectionHeader({
  title,
  subtitle,
  action,
  className,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-4",
        className
      )}
    >
      <div className="min-w-0">
        <h2 className="text-xl font-bold tracking-[-0.01em] text-foreground">
          {title}
        </h2>

        {subtitle && (
          <p className="mt-1 text-sm text-muted">{subtitle}</p>
        )}
      </div>

      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
