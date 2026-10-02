"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import SearchInput from "@/components/ui/SearchInput";
import { useMobileChrome } from "@/providers/MobileChromeProvider";
import { MOTION_DURATION, MOTION_SPRING } from "@/lib/motionTokens";
import { cn } from "@/lib/utils";

/* Sangrado hasta los bordes del área de contenido (los mismos paddings
 * que pone AppShell): la franja fija y la fila de chips llegan de lado a
 * lado en vez de cortarse contra el margen. */
const BLEED = "-mx-6 px-6 sm:-mx-8 sm:px-8 lg:-mx-10 lg:px-10";

/** Buscador compartido por Personas y Comunidades: una sola píldora
 * (texto + filtros) y, debajo, una fila de atajos. Se escribe en el
 * sitio — tocar la barra solo enfoca el input, la pantalla no cambia.
 *
 * Fijo al hacer scroll pero sin tarjeta propia: en reposo se funde con
 * la página, y solo al quedarse pegado gana el mismo cristal que la
 * Navbar, de borde a borde, para leerse como una extensión de ella. */
export default function DiscoveryToolbar({
  value,
  onChange,
  onClear,
  placeholder,
  searchLabel,
  activeFilterCount,
  filtersOpen,
  onOpenFilters,
  children,
}: {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
  placeholder: string;
  /** Nombre accesible del input (el placeholder no cuenta como etiqueta). */
  searchLabel: string;
  /** Filtros del panel que están puestos — se muestran como número en
   * el botón, para saber que hay algo filtrando sin abrir el panel. */
  activeFilterCount: number;
  filtersOpen: boolean;
  onOpenFilters: () => void;
  /** Atajos bajo la barra (CityChip, QuickChip, ChipDivider). */
  children?: ReactNode;
}) {
  const { isNavHidden } = useMobileChrome();
  const stickyRef = useRef<HTMLDivElement>(null);
  const [stuck, setStuck] = useState(false);

  useEffect(() => {
    const element = stickyRef.current;
    if (!element) return;

    let frame = 0;

    function measure() {
      frame = 0;
      if (!element) return;
      const stickyTop = parseFloat(getComputedStyle(element).top) || 0;
      setStuck(element.getBoundingClientRect().top <= stickyTop + 1);
    }

    function schedule() {
      if (!frame) frame = window.requestAnimationFrame(measure);
    }

    measure();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    // El `top` cambia con transición cuando la Navbar entra o sale:
    // al acabar puede no haber ningún scroll que vuelva a medir.
    element.addEventListener("transitionend", schedule);

    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      element.removeEventListener("transitionend", schedule);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  const hasActiveFilters = activeFilterCount > 0;

  return (
    <div
      ref={stickyRef}
      // Un nivel por debajo de la Navbar: cuando vuelve a bajar, pasa
      // por encima de la franja en vez de quedar tapada por ella.
      className={cn(
        "sticky z-[calc(var(--z-sticky-header)_-_1)] mt-4 pb-1 pt-2.5",
        BLEED
      )}
      style={{
        // Pegado justo debajo de la Navbar, y al tope cuando ella se
        // retira — con su misma duración y curva, para moverse juntas.
        top: isNavHidden
          ? "var(--safe-top)"
          : "calc(var(--safe-top) + var(--mobile-header-height))",
        transition: `top ${MOTION_DURATION.normal}s ease-out`,
      }}
    >
      <div
        aria-hidden="true"
        className={cn(
          "material-chrome pointer-events-none absolute inset-x-0 bottom-0 border-b bg-background/85 backdrop-blur-xl transition-opacity duration-200",
          stuck ? "border-border opacity-100" : "border-transparent opacity-0"
        )}
        // Sin la Navbar encima, la franja cubre también la zona segura
        // (notch) para que el contenido no asome por detrás.
        style={{ top: isNavHidden ? "calc(var(--safe-top) * -1)" : 0 }}
      />

      <div className="relative">
        {/* El aro sigue al input, no a toda la píldora (focus-within):
            al cerrar el panel el foco vuelve al botón de filtros, y la
            barra no debe parecer lista para escribir. */}
        <div
          role="search"
          className="flex h-12 items-center gap-1.5 rounded-full bg-surface pl-4 pr-1.5 shadow-[0_1px_2px_rgba(16,45,34,0.06)] ring-1 ring-border transition-shadow duration-200 has-[input:focus]:ring-2 has-[input:focus]:ring-primary/40"
        >
          <SearchInput
            bare
            value={value}
            onChange={(event) => onChange(event.target.value)}
            onClear={onClear}
            placeholder={placeholder}
            aria-label={searchLabel}
            enterKeyHint="search"
            // Los resultados ya se actualizan al escribir: Intro solo
            // tiene que quitar el teclado de en medio para verlos.
            onKeyDown={(event) => {
              if (event.key === "Enter") event.currentTarget.blur();
            }}
          />

          <span aria-hidden="true" className="h-5 w-px shrink-0 bg-border" />

          <motion.button
            type="button"
            onClick={onOpenFilters}
            aria-haspopup="dialog"
            aria-expanded={filtersOpen}
            aria-label={
              hasActiveFilters
                ? `Filtros, ${activeFilterCount} ${activeFilterCount === 1 ? "activo" : "activos"}`
                : "Filtros"
            }
            whileTap={{ scale: 0.94 }}
            transition={MOTION_SPRING.snappy}
            className={cn(
              "flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3 transition-colors duration-200",
              hasActiveFilters
                ? "bg-brand-dark text-white"
                : "bg-flat text-brand-dark hover:bg-flat-strong"
            )}
          >
            <FilterIcon />
            <span className="hidden text-sm font-bold sm:inline">Filtros</span>
            {hasActiveFilters && (
              <motion.span
                key={activeFilterCount}
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={MOTION_SPRING.quick}
                className="flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-2xs font-bold tabular-nums text-brand-dark"
              >
                {activeFilterCount}
              </motion.span>
            )}
          </motion.button>
        </div>

        {children && (
          <div
            className={cn(
              "mt-1.5 flex items-center gap-2 overflow-x-auto py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
              BLEED
            )}
          >
            {children}
          </div>
        )}
      </div>
    </div>
  );
}

const CHIP_BASE =
  "relative flex h-9 shrink-0 items-center rounded-full ring-1 transition-colors duration-200 " +
  // 36px de chip, 44px de zona táctil: el pseudo-elemento amplía el
  // área pulsable sin engordar la fila.
  "before:absolute before:inset-x-0 before:-inset-y-1";

/* La letra va en un <span> interior y no en el <button>: la regla global
 * `button { font: inherit }` de globals.css está fuera de capa y gana a
 * cualquier utilidad text-* / font-* puesta en el propio botón. */
const CHIP_TEXT = "text-[13px] font-semibold";

/** Atajo de un filtro que se activa y desactiva con un toque. */
export function QuickChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        CHIP_BASE,
        "px-3.5",
        active
          ? "bg-brand-dark text-white ring-brand-dark"
          : "bg-surface text-foreground ring-border hover:bg-surface-soft"
      )}
    >
      <span className={CHIP_TEXT}>{children}</span>
    </button>
  );
}

/** Selector de ciudad con aspecto de chip. Por debajo es un <select>
 * nativo invisible: en móvil abre el selector del sistema y el chip
 * mide lo que mide la ciudad elegida, no la opción más larga.
 *
 * Sin ciudad elegida dice solo "Ciudad" (un selector por rellenar, y
 * corto para no empujar los atajos fuera de pantalla); con una elegida
 * se marca igual que un atajo activo, porque está filtrando. */
export function CityChip({
  value,
  options,
  onChange,
}: {
  /** "" = todas. */
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
}) {
  const active = value !== "";

  return (
    <label
      className={cn(
        CHIP_BASE,
        "cursor-pointer gap-1.5 pl-3 pr-2.5 has-[select:focus-visible]:ring-2 has-[select:focus-visible]:ring-primary",
        active
          ? "bg-brand-dark text-white ring-brand-dark"
          : "bg-surface text-foreground ring-border hover:bg-surface-soft"
      )}
    >
      <PinIcon active={active} />
      <span className={CHIP_TEXT}>{value || "Ciudad"}</span>
      <ChevronDownIcon active={active} />
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-label="Ciudad"
        className="absolute inset-0 cursor-pointer appearance-none opacity-0"
      >
        <option value="">Todas las ciudades</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

/** Separa el selector de ciudad de los atajos de filtro: son dos
 * cosas distintas y antes compartían fila con el mismo aspecto. */
export function ChipDivider() {
  return <span aria-hidden="true" className="mx-0.5 h-5 w-px shrink-0 bg-border" />;
}

function FilterIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-4 w-4" aria-hidden="true">
      <path d="M4 7h10" />
      <path d="M18 7h2" />
      <path d="M4 17h2" />
      <path d="M10 17h10" />
      <circle cx="16" cy="7" r="2" />
      <circle cx="8" cy="17" r="2" />
    </svg>
  );
}

function PinIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={cn("h-3.5 w-3.5 shrink-0", active ? "text-white" : "text-primary")} aria-hidden="true">
      <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

function ChevronDownIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={cn("h-3.5 w-3.5 shrink-0", active ? "text-white/70" : "text-muted")} aria-hidden="true">
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}
