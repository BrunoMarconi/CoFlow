import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export default function PageHeader({
  title,
  subtitle,
  action,
  metric,
  className,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  metric?: ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between",
        className
      )}
    >
      <div className="min-w-0">
        <h1 className="text-[28px] font-bold tracking-[-0.01em] text-foreground">
          {title}
        </h1>

        {subtitle && (
          <p className="mt-1.5 max-w-lg text-[15px] leading-6 text-secondary">
            {subtitle}
          </p>
        )}

        {metric && <div className="mt-3">{metric}</div>}
      </div>

      {action && <div className="shrink-0">{action}</div>}
    </header>
  );
}
