import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Igual que AppCard pero pensada para envolver contenido navegable
 * (normalmente dentro de un <Link>): eleva 2px al hover y añade una
 * sombra algo más marcada, con una transición de 180ms.
 */
export default function InteractiveCard({
  children,
  className,
  padded = true,
}: {
  children: ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-18 border border-border bg-surface shadow-soft",
        "transition-all duration-180 ease-out",
        "hover:-translate-y-0.5 hover:shadow-[0_16px_32px_-12px_rgb(13_59_42/0.18)]",
        padded && "p-5 sm:p-6",
        className
      )}
    >
      {children}
    </div>
  );
}
