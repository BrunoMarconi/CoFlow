import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export default function AppCard({
  children,
  className,
  padded = true,
}: {
  children: ReactNode;
  className?: string;
  /** Desactiva el padding por defecto cuando la card tiene su propio
   * contenido a sangre (ej. una imagen de cabecera). */
  padded?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-18 border border-border bg-surface shadow-soft",
        padded && "p-5 sm:p-6",
        className
      )}
    >
      {children}
    </div>
  );
}
