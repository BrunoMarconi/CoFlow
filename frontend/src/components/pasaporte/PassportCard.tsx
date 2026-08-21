"use client";

import { useId, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check } from "lucide-react";
import Image from "next/image";
import { formatEuros } from "@/lib/money";
import type { SolvencyPassport } from "@/types/solvencyPassport";

const STATUS_LABELS: Record<SolvencyPassport["status"], string> = {
  ISSUED: "Vigente",
  EXPIRED: "Caducado",
  REVOKED: "Revocado",
};

const STABILITY_LABELS: Record<SolvencyPassport["income_stability"], string> = {
  HIGH: "Alta",
  MEDIUM: "Media",
  LOW: "Variable",
};

function shortDate(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
    .format(date)
    .replaceAll(".", "");
}

function CoFlowMark({ className = "" }: { className?: string }) {
  const gradientId = useId().replaceAll(":", "");

  return (
    <svg
      viewBox="0 0 112 64"
      className={className}
      aria-label="CoFlow"
      role="img"
    >
      <defs>
        <linearGradient id={`${gradientId}-a`} x1="0" x2="1" y1="0" y2="1">
          <stop stopColor="#0da86a" />
          <stop offset="1" stopColor="#087848" />
        </linearGradient>
        <linearGradient id={`${gradientId}-b`} x1="0" x2="1" y1="0" y2="1">
          <stop stopColor="#174e3d" />
          <stop offset="1" stopColor="#082f25" />
        </linearGradient>
      </defs>
      <circle cx="40" cy="32" r="30" fill={`url(#${gradientId}-a)`} />
      <circle cx="72" cy="32" r="30" fill={`url(#${gradientId}-b)`} opacity="0.94" />
    </svg>
  );
}

function PearlSurface({ children }: { children: React.ReactNode }) {
  return (
    <div className="absolute inset-0 overflow-hidden rounded-[clamp(18px,4vw,30px)] border border-[#dfe2de] bg-[#faf9f6] shadow-[0_18px_42px_rgba(24,53,43,0.1),inset_0_1px_0_rgba(255,255,255,0.95)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_18%,rgba(221,230,242,0.46),transparent_31%),radial-gradient(circle_at_26%_88%,rgba(248,225,220,0.4),transparent_35%),linear-gradient(125deg,#fff_0%,#f3f2ee_52%,#fff_100%)]" />
      <div className="absolute -bottom-[40%] right-[-10%] aspect-square w-[61%] rounded-full bg-[repeating-conic-gradient(from_8deg,rgba(255,255,255,0.9)_0deg,rgba(255,255,255,0.9)_1deg,transparent_1deg,transparent_8deg)] opacity-70" />
      <div className="relative h-full">{children}</div>
    </div>
  );
}

const SILVER_TEXT_STYLE: React.CSSProperties = {
  backgroundImage:
    "linear-gradient(180deg, #f7f7f4 0%, #858b88 38%, #dfe1de 62%, #606764 100%)",
  backgroundClip: "text",
  WebkitBackgroundClip: "text",
  color: "transparent",
  WebkitTextFillColor: "transparent",
};

function PassportFront() {
  return (
    <div className="absolute inset-0 overflow-hidden rounded-[clamp(18px,4vw,30px)] shadow-[0_18px_42px_rgba(24,53,43,0.1)]">
      <Image
        src="/images/coflow-passport-front-card-v2.png"
        alt="Portada de CoFlow Passport"
        fill
        priority
        unoptimized
        sizes="(max-width: 768px) calc(100vw - 32px), 768px"
        className="object-cover"
      />

    </div>
  );
}

function PassportBack({
  passport,
  holderName,
  comparisonRent,
}: {
  passport: SolvencyPassport;
  holderName: string;
  comparisonRent?: number;
}) {
  const active = passport.status === "ISSUED";

  return (
    <PearlSurface>
      <CoFlowMark className="absolute -left-[9%] top-[35%] w-[22%] scale-[1.35] opacity-95" />

      <div className="absolute inset-x-[7%] top-[7%] flex items-center justify-between gap-3">
        <p className="truncate font-rounded text-[clamp(0.88rem,3.2cqw,1.45rem)] font-bold text-[#916f7c]">
          {holderName}
        </p>
        <span
          className={`shrink-0 rounded-full border px-[clamp(0.55rem,2cqw,1rem)] py-[clamp(0.18rem,0.7cqw,0.35rem)] text-[clamp(0.48rem,1.5cqw,0.7rem)] font-bold uppercase tracking-[0.12em] ${
            active
              ? "border-[#9b7c88]/70 text-[#8d6c78]"
              : "border-red-300 text-red-600"
          }`}
        >
          {STATUS_LABELS[passport.status]}
        </span>
      </div>

      <div className="absolute left-[22%] right-[7%] top-[24%]">
        <p className="text-center text-[clamp(0.48rem,1.45cqw,0.7rem)] font-bold uppercase tracking-[0.13em] text-[#987481]">
          {comparisonRent ? "Capacidad compatible con este piso" : "Tu capacidad orientativa"}
        </p>
        <p className="mt-[2%] text-center font-rounded text-[clamp(1.25rem,5.7cqw,2.65rem)] font-extrabold leading-none tracking-[-0.035em]">
          {passport.recommended_rent_capacity !== null ? (
            <>
              <span style={SILVER_TEXT_STYLE}>
                Hasta {formatEuros(passport.recommended_rent_capacity)}
              </span>
              <span className="ml-[0.18em] text-primary-dark">/mes</span>
            </>
          ) : (
            <span className="text-primary-dark">Sin estimación</span>
          )}
        </p>

        {comparisonRent ? (
          <>
            <dl className="mt-[7%] grid grid-cols-2 gap-[3%] text-[clamp(0.52rem,1.58cqw,0.75rem)] text-foreground">
              <div className="rounded-[0.65em] border border-black/[0.07] bg-white/45 px-[7%] py-[5%]">
                <dt className="text-[0.88em] text-[#69706c]">Alquiler del piso</dt>
                <dd className="mt-[2%] whitespace-nowrap font-bold">
                  {formatEuros(String(comparisonRent))}/mes
                </dd>
              </div>
              <div className="rounded-[0.65em] border border-black/[0.07] bg-white/45 px-[7%] py-[5%]">
                <dt className="text-[0.88em] text-[#69706c]">Estabilidad</dt>
                <dd className="mt-[2%] font-bold text-primary-dark">
                  {STABILITY_LABELS[passport.income_stability]}
                </dd>
              </div>
            </dl>
            <p className="mt-[3%] text-center text-[clamp(0.48rem,1.42cqw,0.66rem)] font-medium text-[#69706c]">
              {passport.months_analyzed} meses de información bancaria verificada
            </p>
          </>
        ) : (
          <dl className="mt-[6%] space-y-[2.8%] text-[clamp(0.54rem,1.72cqw,0.8rem)] text-foreground">
            <div className="flex items-center justify-between gap-3 border-b border-black/10 pb-[2%]">
              <dt>Estabilidad de ingresos</dt>
              <dd className="font-bold text-primary-dark">
                {STABILITY_LABELS[passport.income_stability]}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt>Periodo analizado</dt>
              <dd className="font-bold">{passport.months_analyzed} meses</dd>
            </div>
          </dl>
        )}
      </div>

      <div className="absolute bottom-[7%] left-[22%] right-[7%] text-[clamp(0.45rem,1.3cqw,0.62rem)] font-semibold text-[#987481]">
        <div className="flex items-end justify-between gap-2">
          <span className="inline-flex items-center gap-1">
            <Check className="h-[1em] w-[1em]" aria-hidden="true" />
            Verificado · {shortDate(passport.issued_at)}
          </span>
          <span>Válido hasta · {shortDate(passport.expires_at)}</span>
        </div>
      </div>
    </PearlSurface>
  );
}

export default function PassportCard({
  passport,
  holderName,
  comparisonRent,
}: {
  passport: SolvencyPassport;
  holderName: string;
  comparisonRent?: number;
}) {
  const [flipped, setFlipped] = useState(false);
  const reducedMotion = useReducedMotion();

  function toggleSide() {
    setFlipped((current) => !current);
  }

  return (
    <div className="mx-auto w-full max-w-3xl">
      <button
        type="button"
        onClick={toggleSide}
        aria-label={flipped ? "Mostrar portada del pasaporte" : "Mostrar datos del pasaporte"}
        aria-pressed={flipped}
        className="group block w-full rounded-[clamp(18px,4vw,30px)] text-left shadow-[0_14px_30px_rgba(31,58,49,0.16),0_3px_10px_rgba(31,58,49,0.1)] outline-none transition-[transform,box-shadow] duration-200 ease-out active:scale-[0.995] motion-reduce:transition-none sm:hover:shadow-[0_20px_42px_rgba(31,58,49,0.2),0_5px_14px_rgba(31,58,49,0.12)] focus-visible:ring-4 focus-visible:ring-primary/25"
      >
        <div className="relative aspect-[1.916/1] w-full overflow-hidden rounded-[clamp(18px,4vw,30px)] [container-type:inline-size]">
          {reducedMotion ? (
            flipped ? (
              <PassportBack passport={passport} holderName={holderName} comparisonRent={comparisonRent} />
            ) : (
              <PassportFront />
            )
          ) : (
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={flipped ? "back" : "front"}
                className="absolute inset-0"
                initial={{ opacity: 0, rotateY: flipped ? -72 : 72, scale: 0.985 }}
                animate={{ opacity: 1, rotateY: 0, scale: 1 }}
                exit={{ opacity: 0, rotateY: flipped ? 72 : -72, scale: 0.985 }}
                transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                style={{ transformPerspective: 1400, transformOrigin: "center" }}
              >
                {flipped ? (
                  <PassportBack passport={passport} holderName={holderName} comparisonRent={comparisonRent} />
                ) : (
                  <PassportFront />
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </button>

    </div>
  );
}
