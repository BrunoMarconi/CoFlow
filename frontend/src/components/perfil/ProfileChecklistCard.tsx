"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { MOTION_SPRING } from "@/lib/motionTokens";
import type { ProfileCompletionItem } from "@/lib/profileCompletion";

/* Las tareas del perfil como fichas que se pasan con el pulgar.
 *
 * Sustituye a la lista vertical: nueve filas apiladas convertían una
 * ayuda en un muro de deberes. En horizontal solo se ven tres a la vez,
 * las pendientes van delante, y las ya hechas se quedan detrás — huecas
 * y con su check — para que el avance se vea sin ocupar sitio. */

const TASK_ICONS: Record<string, React.ReactNode> = {
  avatar: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="9" r="3.4" /><path d="M4.5 20a7.5 7.5 0 0 1 15 0" /></svg>
  ),
  bio: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" /></svg>
  ),
  phone: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="2.5" width="12" height="19" rx="3" /><path d="M11 18.5h2" /></svg>
  ),
  age: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="16" rx="3" /><path d="M8 3v4M16 3v4M3 11h18" /></svg>
  ),
  occupation: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2.5" y="7" width="19" height="13" rx="2.5" /><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" /></svg>
  ),
  budget: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M15 8.6c-.5-.7-1.5-1.2-3-1.2-2 0-3 1-3 2.3 0 3.4 6 1.4 6 4.7 0 1.4-1.2 2.4-3.2 2.4-1.5 0-2.7-.5-3.5-1.5" /></svg>
  ),
  email: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2.5" y="5" width="19" height="14" rx="3" /><path d="m3 7.5 9 6 9-6" /></svg>
  ),
  onboarding: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 4h9a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h1" /><path d="M9 3h6v3H9zM8.5 12l2 2 4-4" /></svg>
  ),
  photos: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2.5" y="5" width="19" height="15" rx="3" /><circle cx="8.5" cy="10" r="1.6" /><path d="m4 17 5-4.5 4.5 4L17 13l3.5 3" /></svg>
  ),
};

export default function ProfileChecklistCard({
  items,
}: {
  items: ProfileCompletionItem[];
}) {
  const doneCount = items.filter((item) => item.done).length;
  // Las pendientes primero: al llegar en el scroll, lo accionable está
  // delante y lo conseguido queda como recompensa al final.
  const ordered = [...items].sort(
    (a, b) => Number(a.done) - Number(b.done)
  );
  const isComplete = doneCount === items.length;

  return (
    /* min-w-0 no es opcional: como hijo de un grid/flex, el valor por
       defecto es min-width:auto, así que la fila de fichas ensancharía la
       columna hasta su contenido en vez de desplazarse dentro de ella —
       y arrastraría con ella al resto de la pantalla. */
    <section className="min-w-0 rounded-panel bg-surface py-4 shadow-soft">
      <div className="flex items-baseline justify-between gap-3 px-4 sm:px-5">
        <h2 className="text-base font-bold tracking-[-0.02em] text-foreground">
          {isComplete ? "Perfil completo" : "Completa tu perfil"}
        </h2>
        <span className="shrink-0 text-xs font-semibold tabular-nums text-muted">
          {doneCount}/{items.length}
        </span>
      </div>

      {/* scrollbar oculta a propósito: el corte de la tercera ficha ya
          dice que hay más, y una barra gris rompería la fila. */}
      <div className="mt-3.5 flex snap-x snap-mandatory gap-2.5 overflow-x-auto px-4 pb-1.5 [-ms-overflow-style:none] [scrollbar-width:none] sm:px-5 [&::-webkit-scrollbar]:hidden">
        {ordered.map((item) => (
          <motion.div
            key={item.key}
            layout
            transition={MOTION_SPRING.snappy}
            className="shrink-0 snap-start"
          >
            <Link
              href={item.href}
              className={`flex h-full w-31 flex-col justify-between gap-5 rounded-field p-3.5 transition-colors ${
                item.done
                  ? "bg-transparent shadow-[inset_0_0_0_1px_var(--line)]"
                  : "bg-surface-soft hover:bg-mint-100"
              }`}
            >
              <span
                className={`flex h-8.5 w-8.5 items-center justify-center rounded-control [&>svg]:h-4.5 [&>svg]:w-4.5 ${
                  item.done
                    ? "bg-primary text-white"
                    : "bg-mint-100 text-primary"
                }`}
              >
                {item.done ? <CheckIcon /> : TASK_ICONS[item.key]}
              </span>
              <span
                className={`text-xs font-bold leading-4 tracking-[-0.01em] ${
                  item.done ? "text-muted" : "text-foreground"
                }`}
              >
                {item.label}
              </span>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>
  );
}
