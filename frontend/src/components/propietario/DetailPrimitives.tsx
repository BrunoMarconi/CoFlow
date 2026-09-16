import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { PropertyStatus } from "@/types/property";

/* Piezas compartidas por las dos fichas de vivienda: la del equipo
 * (/equipo/viviendas/[id]) y la del propietario (/propietarios/pisos/[id]).
 *
 * Antes cada una resolvía lo mismo a su manera —cuadrículas de cajitas
 * con icono, chips de colores, badges distintos para el mismo estado—, y
 * el resultado era que dos pantallas que describen el mismo objeto no se
 * leían igual. Aquí vive un único lenguaje: secciones con cabecera,
 * filas dato → valor y un punto de estado con el mismo significado en
 * toda la app. */

export type Tone = "positive" | "pending" | "neutral" | "muted";

const DOT_TONE: Record<Tone, string> = {
  positive: "bg-primary",
  pending: "bg-amber-500",
  neutral: "bg-blue-600",
  muted: "bg-muted",
};

const STATUS_TONE: Record<PropertyStatus, Tone> = {
  DRAFT: "pending",
  READY: "positive",
  PUBLISHED: "positive",
  PAUSED: "muted",
  RENTED: "neutral",
  ARCHIVED: "muted",
};

export function statusTone(status: PropertyStatus): Tone {
  return STATUS_TONE[status];
}

/* Nombres de estado tal y como los ve el propietario. El equipo usa los
 * suyos (TEAM_STATUS_LABELS): para ellos "READY" es «Publicada», porque
 * es lo que han hecho; para el propietario todavía no hay escaparate, y
 * llamarlo publicado sería prometer algo que no ocurre. */
export const OWNER_STATUS_LABELS: Record<PropertyStatus, string> = {
  DRAFT: "Borrador",
  READY: "Preparada",
  PAUSED: "Pausada",
  PUBLISHED: "Publicada",
  RENTED: "Alquilada",
  ARCHIVED: "Archivada",
};

/** Estado como punto + texto, no como pastilla de color: en una ficha con
 * varios datos, seis fondos de colores distintos compiten entre sí y
 * ninguno acaba destacando. */
export function StatusDot({ tone, label }: { tone: Tone; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-dark">
      <span aria-hidden="true" className={cn("h-1.5 w-1.5 shrink-0 rounded-full", DOT_TONE[tone])} />
      {label}
    </span>
  );
}

export function DetailSection({
  title,
  action,
  first = false,
  children,
}: {
  title: string;
  action?: ReactNode;
  /** La primera sección no lleva línea superior: ya la separa la cabecera. */
  first?: boolean;
  children: ReactNode;
}) {
  return (
    <section className={cn(first ? "" : "mt-8 border-t border-black/[0.07] pt-8")}>
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="type-overline text-muted">{title}</h2>
        {action}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

/** Fila etiqueta → valor con hilo de separación. Un valor ausente se dice
 * ("Sin indicar") en vez de desaparecer: en una ficha de gestión, saber
 * que un dato falta es tan útil como el dato. */
export function DataRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: string | null;
  tone?: Tone;
}) {
  const missing = value === null || value === "";

  /* El hilo va arriba y no abajo: así, cuando la lista se parte en dos
   * columnas, basta con quitárselo a la primera fila de cada una
   * (`first` y el segundo hijo) para que ninguna columna arranque con
   * una línea suelta — con `border-b` habría que adivinar cuál es la
   * última fila de cada columna, que depende de si el total es par.
   *
   * El corte es `@lg`, una consulta de contenedor y no de ventana: esta
   * lista vive dentro de una columna que se estrecha cuando aparece el
   * panel lateral, así que lo que decide si caben dos columnas es el
   * hueco real, no el tamaño de la pantalla. */
  return (
    <div className="flex items-baseline justify-between gap-4 border-t border-black/[0.05] py-2.5 first:border-t-0 @lg:[&:nth-child(2)]:border-t-0">
      <dt className="text-sm text-secondary">{label}</dt>
      <dd
        className={cn(
          "text-right text-sm font-bold",
          missing ? "font-semibold text-muted" : tone === "positive" ? "text-primary-dark" : "text-brand-dark"
        )}
      >
        {missing ? "Sin indicar" : value}
      </dd>
    </div>
  );
}

/** Tarjeta de la columna lateral. Fondo claro y filo fino a propósito: el
 * verde oscuro se reserva para la acción principal, que es lo único que
 * debería tirar del ojo dentro del panel. */
export function SidePanel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-card border border-black/[0.06] bg-surface p-5 shadow-soft", className)}>
      {children}
    </div>
  );
}
