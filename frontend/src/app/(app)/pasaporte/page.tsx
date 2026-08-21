"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, Check, ChevronDown, RotateCw, ShieldCheck, Sparkles, UsersRound, X } from "lucide-react";
import { useRouter } from "next/navigation";
import PassportCard, {
  PassportStickerPreview,
  type PassportSticker,
} from "@/components/pasaporte/PassportCard";
import { useAuth } from "@/hooks/useAuth";
import { formatEuros } from "@/lib/money";
import type { SolvencyPassport } from "@/types/solvencyPassport";

const LOCAL_PASSPORT_PREVIEW: SolvencyPassport = {
  id: "local-preview",
  public_id: "CFP-LOCAL-PREVIEW",
  status: "ISSUED",
  algorithm_version: "1.0",
  issued_at: "2026-08-20T10:00:00.000Z",
  expires_at: "2027-02-20T10:00:00.000Z",
  revoked_at: null,
  is_sandbox: true,
  currency: "EUR",
  analysis_period_start: "2026-02-01T00:00:00.000Z",
  analysis_period_end: "2026-07-31T23:59:59.000Z",
  months_analyzed: 6,
  recurring_monthly_income: "1750.00",
  average_fixed_expenses: "520.00",
  average_variable_expenses: "280.00",
  average_monthly_margin: "950.00",
  recommended_rent_capacity: "700.00",
  income_stability: "HIGH",
  confidence_level: "HIGH",
  created_at: "2026-08-20T10:00:00.000Z",
  share_url: "#",
};

const STICKER_OPTIONS: Array<{ id: PassportSticker; label: string }> = [
  { id: "keys", label: "Llaves" },
  { id: "plant", label: "Planta" },
  { id: "home", label: "Hogar" },
  { id: "coffee", label: "Café" },
  { id: "spark", label: "Brillo" },
  { id: "chat", label: "Conexión" },
];

export default function PasaportePage() {
  const { user } = useAuth();
  const router = useRouter();
  const reducedMotion = useReducedMotion();
  const [stickers, setStickers] = useState<PassportSticker[]>([]);
  const [draftStickers, setDraftStickers] = useState<PassportSticker[]>([]);
  const [customizerOpen, setCustomizerOpen] = useState(false);
  const [openInfoPanel, setOpenInfoPanel] = useState<"verified" | "community" | null>(null);

  const validUntil = new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
    .format(new Date(LOCAL_PASSPORT_PREVIEW.expires_at))
    .replaceAll(".", "");

  function openCustomizer() {
    setDraftStickers(stickers);
    setCustomizerOpen(true);
  }

  function toggleDraftSticker(sticker: PassportSticker) {
    setDraftStickers((current) =>
      current.includes(sticker)
        ? current.filter((item) => item !== sticker)
        : [...current, sticker].slice(-2)
    );
  }

  function saveCustomization() {
    setStickers(draftStickers);
    setCustomizerOpen(false);
  }

  return (
    <motion.main
      className="relative flex min-h-dvh w-full flex-col items-center overflow-hidden bg-[#cbd5d1] px-1.5 pb-8 pt-[calc(env(safe-area-inset-top)+1rem)] sm:px-8 sm:pt-8"
      initial={reducedMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: reducedMotion ? 0.08 : 0.28, ease: "easeOut" }}
    >
      <motion.div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_4%,rgba(255,255,255,0.62),transparent_42%),radial-gradient(circle_at_84%_78%,rgba(109,153,137,0.18),transparent_32%),linear-gradient(135deg,rgba(255,255,255,0.12),transparent_58%)]"
        aria-hidden="true"
        animate={
          reducedMotion
            ? undefined
            : { opacity: [0.72, 1, 0.72], scale: [1, 1.035, 1] }
        }
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.16] [background-image:radial-gradient(rgba(8,47,37,0.2)_0.55px,transparent_0.7px)] [background-size:7px_7px]"
        aria-hidden="true"
      />

      <motion.header
        className="relative flex w-full max-w-4xl items-center gap-3 px-2.5 sm:px-0"
        initial={reducedMotion ? false : { opacity: 0, y: -14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reducedMotion ? 0.08 : 0.38, delay: reducedMotion ? 0 : 0.08, ease: [0.22, 1, 0.36, 1] }}
      >
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="Volver"
          className="flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full border border-primary-dark/10 bg-white/55 text-primary-dark shadow-sm outline-none transition-colors hover:bg-white/80 focus-visible:ring-4 focus-visible:ring-primary/20"
        >
          <ArrowLeft className="size-5" aria-hidden="true" />
        </button>
        <div>
          <h1 className="font-rounded text-lg font-bold leading-tight text-primary-dark sm:text-xl">
            Pasaporte de solvencia
          </h1>
          <p className="mt-0.5 text-sm text-primary-dark/65">
            Tu capacidad económica, resumida y verificada.
          </p>
          <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-primary-dark/60">
            <ShieldCheck className="size-3.5" aria-hidden="true" />
            Vigente hasta el {validUntil}
          </p>
        </div>
      </motion.header>

      <section className="relative mt-7 w-full max-w-4xl sm:mt-10" aria-label="Vista de tu pasaporte">
        <motion.div
          initial={
            reducedMotion
              ? false
              : { opacity: 0, y: 34, scale: 0.95, rotateX: 7 }
          }
          animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
          transition={
            reducedMotion
              ? { duration: 0.08 }
              : { type: "spring", stiffness: 105, damping: 18, mass: 0.85, delay: 0.12 }
          }
          style={{ transformPerspective: 1200 }}
        >
          <PassportCard
            passport={LOCAL_PASSPORT_PREVIEW}
            stickers={stickers}
            holderName={
              user
                ? `${user.first_name} ${user.last_name.slice(0, 1)}.`
                : "Mi pasaporte"
            }
          />
        </motion.div>
        <motion.p
          className="mt-5 flex items-center justify-center gap-2 text-sm font-medium text-primary-dark/70"
          initial={reducedMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reducedMotion ? 0.08 : 0.32, delay: reducedMotion ? 0 : 0.46, ease: "easeOut" }}
        >
          <RotateCw className="size-4" aria-hidden="true" />
          Toca la tarjeta para girarla
        </motion.p>

        <motion.div
          className="mx-auto mt-8 w-full max-w-3xl px-2.5 pb-[calc(env(safe-area-inset-bottom)+1rem)] sm:px-0"
          initial={reducedMotion ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reducedMotion ? 0.08 : 0.42, delay: reducedMotion ? 0 : 0.56, ease: [0.22, 1, 0.36, 1] }}
        >
          <h2 className="px-1 text-xs font-bold uppercase tracking-[0.16em] text-primary-dark/55">
            Opciones
          </h2>

          <div className="mt-3 grid gap-3">
            <div className="overflow-hidden rounded-2xl border border-primary-dark/10 bg-white/60 shadow-sm backdrop-blur-sm">
              <button
                type="button"
                onClick={() => setOpenInfoPanel((current) => current === "verified" ? null : "verified")}
                aria-expanded={openInfoPanel === "verified"}
                aria-controls="verified-passport-data"
                className="flex min-h-16 w-full cursor-pointer items-center gap-3 px-4 text-left outline-none transition-colors hover:bg-white/75 focus-visible:bg-white/80 focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-primary/15"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-dark/[0.07] text-primary-dark">
                  <ShieldCheck className="size-5" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold text-primary-dark">
                    Ver datos verificados
                  </span>
                  <span className="mt-0.5 block text-xs text-primary-dark/60">
                    Información utilizada para emitirlo
                  </span>
                </span>
                <motion.span
                  animate={{ rotate: openInfoPanel === "verified" ? 180 : 0 }}
                  transition={{ duration: reducedMotion ? 0.08 : 0.22, ease: "easeOut" }}
                  className="flex text-primary-dark/55"
                >
                  <ChevronDown className="size-4" aria-hidden="true" />
                </motion.span>
              </button>

              <AnimatePresence initial={false}>
                {openInfoPanel === "verified" && (
                  <motion.div
                    id="verified-passport-data"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: reducedMotion ? 0.08 : 0.3, ease: [0.22, 1, 0.36, 1] }}
                    className="overflow-hidden"
                  >
              <dl className="grid grid-cols-2 gap-x-5 gap-y-4 border-t border-primary-dark/10 bg-white/35 px-5 py-5 text-sm">
                <div>
                  <dt className="text-xs text-primary-dark/55">Ingresos recurrentes</dt>
                  <dd className="mt-1 font-bold text-primary-dark">
                    {formatEuros(LOCAL_PASSPORT_PREVIEW.recurring_monthly_income)}/mes
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-primary-dark/55">Margen mensual</dt>
                  <dd className="mt-1 font-bold text-primary-dark">
                    {formatEuros(LOCAL_PASSPORT_PREVIEW.average_monthly_margin)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-primary-dark/55">Gastos fijos medios</dt>
                  <dd className="mt-1 font-bold text-primary-dark">
                    {formatEuros(LOCAL_PASSPORT_PREVIEW.average_fixed_expenses)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-primary-dark/55">Periodo analizado</dt>
                  <dd className="mt-1 font-bold text-primary-dark">
                    {LOCAL_PASSPORT_PREVIEW.months_analyzed} meses
                  </dd>
                </div>
              </dl>
              <p className="border-t border-primary-dark/10 bg-white/35 px-5 py-3 text-xs leading-5 text-primary-dark/60">
                CoFlow resume estos indicadores; nunca muestra tus movimientos bancarios.
              </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="overflow-hidden rounded-2xl border border-primary-dark/10 bg-white/60 shadow-sm backdrop-blur-sm">
              <button
                type="button"
                onClick={() => setOpenInfoPanel((current) => current === "community" ? null : "community")}
                aria-expanded={openInfoPanel === "community"}
                aria-controls="community-passport-use"
                className="flex min-h-16 w-full cursor-pointer items-center gap-3 px-4 text-left outline-none transition-colors hover:bg-white/75 focus-visible:bg-white/80 focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-primary/15"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-dark/[0.07] text-primary-dark">
                  <UsersRound className="size-5" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold text-primary-dark">
                    Cómo se usa en tu comunidad
                  </span>
                  <span className="mt-0.5 block text-xs text-primary-dark/60">
                    Tu solvencia se suma al pasaporte común
                  </span>
                </span>
                <motion.span
                  animate={{ rotate: openInfoPanel === "community" ? 180 : 0 }}
                  transition={{ duration: reducedMotion ? 0.08 : 0.22, ease: "easeOut" }}
                  className="flex text-primary-dark/55"
                >
                  <ChevronDown className="size-4" aria-hidden="true" />
                </motion.span>
              </button>

              <AnimatePresence initial={false}>
                {openInfoPanel === "community" && (
                  <motion.div
                    id="community-passport-use"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: reducedMotion ? 0.08 : 0.3, ease: [0.22, 1, 0.36, 1] }}
                    className="overflow-hidden"
                  >
              <div className="border-t border-primary-dark/10 bg-white/35 px-5 py-5">
                <ul className="space-y-3 text-sm text-primary-dark">
                  {[
                    "Tu capacidad se combina con la del resto de miembros",
                    "CoFlow genera un único pasaporte para toda la comunidad",
                    "La capacidad conjunta se compara con el alquiler del piso",
                    "El envío se realiza desde la candidatura a un piso concreto",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2.5">
                      <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-5 rounded-xl bg-primary-dark/[0.06] px-4 py-3">
                  <p className="text-xs font-bold text-primary-dark">
                    Tus datos individuales permanecen privados
                  </p>
                  <p className="mt-1 text-xs leading-5 text-primary-dark/65">
                    El propietario recibe el resultado conjunto, nunca tus saldos, movimientos, cuentas o credenciales.
                  </p>
                </div>
              </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button
              type="button"
              onClick={openCustomizer}
              className="flex min-h-16 w-full cursor-pointer items-center gap-3 rounded-2xl border border-primary-dark/10 bg-white/60 px-4 text-left shadow-sm outline-none backdrop-blur-sm transition-colors hover:bg-white/75 focus-visible:bg-white/80 focus-visible:ring-4 focus-visible:ring-primary/15"
            >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-dark/[0.07] text-primary-dark">
                  <Sparkles className="size-5" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold text-primary-dark">
                    Personalizar pasaporte
                  </span>
                  <span className="mt-0.5 block text-xs text-primary-dark/60">
                    {stickers.length === 0
                      ? "Sin personalización"
                      : `${stickers.length} de 2 detalles añadidos`}
                  </span>
                </span>
                {stickers.length > 0 && (
                  <span className="flex shrink-0 -space-x-2" aria-label={`${stickers.length} detalles seleccionados`}>
                    {stickers.map((sticker) => (
                      <span
                        key={sticker}
                        className="flex size-8 items-center justify-center rounded-full border-2 border-[#edf1ee] bg-white shadow-sm"
                      >
                        <PassportStickerPreview sticker={sticker} className="block size-6" />
                      </span>
                    ))}
                  </span>
                )}
                <ChevronDown className="size-4 -rotate-90 text-primary-dark/55" aria-hidden="true" />
            </button>
          </div>
        </motion.div>
      </section>

      <AnimatePresence>
      {customizerOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center bg-[#082f25]/35 p-0 backdrop-blur-[2px]"
          role="presentation"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reducedMotion ? 0.08 : 0.22, ease: "easeOut" }}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setCustomizerOpen(false);
          }}
        >
          <motion.section
            role="dialog"
            aria-modal="true"
            aria-labelledby="passport-customizer-title"
            className="max-h-[92dvh] w-full overflow-y-auto rounded-t-[28px] bg-[#f7f8f6] px-5 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] pt-5 shadow-[0_-16px_50px_rgba(8,47,37,0.2)] sm:px-8 sm:pt-6"
            initial={{ y: reducedMotion ? 0 : 80, opacity: reducedMotion ? 1 : 0.7 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: reducedMotion ? 0 : 80, opacity: reducedMotion ? 1 : 0.65 }}
            transition={{ duration: reducedMotion ? 0.08 : 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="passport-customizer-title" className="font-rounded text-xl font-bold text-primary-dark">
                  Personaliza tu pasaporte
                </h2>
                <p className="mt-1 text-sm leading-5 text-primary-dark/60">
                  Elige hasta dos detalles. Siempre aparecerán de forma discreta.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCustomizerOpen(false)}
                aria-label="Cerrar personalización"
                className="flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full bg-primary-dark/[0.06] text-primary-dark outline-none transition-colors hover:bg-primary-dark/10 focus-visible:ring-4 focus-visible:ring-primary/15"
              >
                <X className="size-5" aria-hidden="true" />
              </button>
            </div>

            <div className="mt-6 grid grid-cols-3 gap-3">
              {STICKER_OPTIONS.map((option) => {
                const selected = draftStickers.includes(option.id);
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => toggleDraftSticker(option.id)}
                    aria-pressed={selected}
                    className="relative flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-2xl border border-primary-dark/10 bg-white px-2 outline-none transition-[border-color,box-shadow,transform] duration-200 hover:border-primary-dark/25 active:scale-[0.99] focus-visible:ring-4 focus-visible:ring-primary/15 aria-pressed:border-primary-dark aria-pressed:shadow-[0_8px_22px_rgba(18,63,51,0.12)] motion-reduce:transition-none"
                  >
                    {selected && (
                      <span className="absolute right-3 top-3 flex size-6 items-center justify-center rounded-full bg-primary-dark text-white">
                        <Check className="size-3.5" aria-hidden="true" />
                      </span>
                    )}
                    <PassportStickerPreview sticker={option.id} className="block h-13 w-13" />
                    <span className="mt-2 text-sm font-bold text-primary-dark">{option.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="mt-4 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setDraftStickers([])}
                className="min-h-11 cursor-pointer px-2 text-sm font-bold text-primary-dark/65 outline-none hover:text-primary-dark focus-visible:underline"
              >
                Quitar todas
              </button>
              <span className="text-xs font-semibold text-primary-dark/55">
                {draftStickers.length} de 2
              </span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setCustomizerOpen(false)}
                className="min-h-12 cursor-pointer rounded-2xl border border-primary-dark/15 bg-white text-sm font-bold text-primary-dark outline-none transition-colors hover:bg-primary-dark/[0.04] focus-visible:ring-4 focus-visible:ring-primary/15"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={saveCustomization}
                className="min-h-12 cursor-pointer rounded-2xl bg-primary-dark text-sm font-bold text-white shadow-[0_8px_20px_rgba(18,63,51,0.18)] outline-none transition-colors hover:bg-[#0b352a] focus-visible:ring-4 focus-visible:ring-primary/20"
              >
                Guardar
              </button>
            </div>
          </motion.section>
        </motion.div>
      )}
      </AnimatePresence>
    </motion.main>
  );
}
