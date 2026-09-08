import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export default function SectionHeader({
  title,
  subtitle,
  action,
  className,
}: {
  title: string;
  subtitle?: ReactNode;
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
        <h2 className="type-section font-rounded text-foreground">{title}</h2>

        {subtitle && <p className="type-body mt-1 text-muted">{subtitle}</p>}
      </div>

      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
