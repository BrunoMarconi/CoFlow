import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Igual que AppCard pero pensada para envolver contenido navegable
 * (normalmente dentro de un <Link>): eleva 2px al hover y añade una
 * sombra algo más marcada, con una transición de 180ms.
 *
 * El hover solo existe con ratón. En móvil, que es donde se usa, la
 * tarjeta no daba NINGUNA señal de haber recibido el toque hasta que
 * llegaba la pantalla siguiente — y ese hueco es justo donde una
 * interfaz deja de sentirse directa. `.press` la hunde un 1.5% en el
 * pointer-down (110ms), lo justo para que se note el contacto sin que
 * una tarjeta ancha se deforme.
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
        "press rounded-18 border border-border bg-surface shadow-soft",
        "hover:-translate-y-0.5 hover:shadow-raised",
        padded && "p-5 sm:p-6",
        className
      )}
    >
      {children}
    </div>
  );
}
