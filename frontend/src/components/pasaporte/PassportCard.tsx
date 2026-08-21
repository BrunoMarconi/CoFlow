"use client";

import { useId, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
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
          <stop stopColor="#285f4e" />
          <stop offset="1" stopColor="#123f33" />
        </linearGradient>
      </defs>
      <circle cx="40" cy="32" r="30" fill={`url(#${gradientId}-a)`} />
      <circle cx="72" cy="32" r="30" fill={`url(#${gradientId}-b)`} opacity="0.94" />
    </svg>
  );
}

export type PassportSticker =
  | "keys"
  | "plant"
  | "home"
  | "coffee"
  | "spark"
  | "chat";

function KeySticker() {
  return (
    <svg viewBox="0 0 64 74" className="h-full w-full" aria-hidden="true">
      <g fill="none" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="29" cy="20" r="12" fill="#f7f4ed" stroke="#8d8e88" strokeWidth="3" />
        <path d="M25 29 11 58l6 3 4-8 5 2 4-8-4-2 6-12" fill="#d8aa55" stroke="#96702f" strokeWidth="2" />
        <path d="M36 30 28 59l7 2 2-8 6 1 2-8-5-1 4-12" fill="#e4e5e2" stroke="#8d8e88" strokeWidth="2" />
        <circle cx="49" cy="39" r="9" fill="#f8f7f2" stroke="#d8ded8" strokeWidth="2" />
        <circle cx="46" cy="39" r="5" fill="#0ba064" />
        <circle cx="51" cy="39" r="5" fill="#164b3a" fillOpacity=".94" />
      </g>
    </svg>
  );
}

function PlantSticker() {
  return (
    <svg viewBox="0 0 70 82" className="h-full w-full" aria-hidden="true">
      <path d="M19 48h34l-5 27c-1 4-4 6-8 6H31c-4 0-7-2-8-6Z" fill="#eee7d8" stroke="#c8bfaf" strokeWidth="2" />
      <path d="M36 50c-2-17-1-29 0-41M36 36c-7-10-13-15-20-17M36 29c6-10 12-15 19-18M36 43c8-7 14-9 22-9" fill="none" stroke="#416b52" strokeWidth="3" strokeLinecap="round" />
      <path d="M34 28C20 28 17 17 17 17c12-1 18 3 17 11ZM38 24C39 11 50 8 55 9c-2 9-7 15-17 15ZM37 42c9-10 17-9 22-7-4 8-11 11-22 7ZM34 38c-10-9-18-6-21-3 5 7 12 9 21 3Z" fill="#668a6d" stroke="#3f684f" strokeWidth="1.5" />
    </svg>
  );
}

function IllustratedSticker({ sticker }: { sticker: Exclude<PassportSticker, "keys" | "plant"> }) {
  return (
    <svg viewBox="0 0 72 72" className="h-full w-full" aria-hidden="true">
      <circle cx="36" cy="36" r="31" fill="#fbfaf6" stroke="#d8dfda" strokeWidth="2" />
      {sticker === "home" && (
        <g fill="none" stroke="#174e3d" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3">
          <path d="m18 34 18-15 18 15" />
          <path d="M23 31v22h26V31M32 53V40h9v13" />
          <circle cx="50" cy="22" r="5" fill="#0ca469" stroke="none" />
        </g>
      )}
      {sticker === "coffee" && (
        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 30h29v13c0 8-6 14-14 14h-1c-8 0-14-6-14-14Z" fill="#e8d7bc" stroke="#8c7558" strokeWidth="2.5" />
          <path d="M50 34h3c6 0 7 10 0 12h-4" stroke="#8c7558" strokeWidth="2.5" />
          <path d="M29 24c-3-4 3-6 0-10M39 24c-3-4 3-6 0-10" stroke="#174e3d" strokeWidth="2.5" />
        </g>
      )}
      {sticker === "spark" && (
        <g fill="#0ca469" stroke="#174e3d" strokeLinejoin="round" strokeWidth="1.5">
          <path d="m36 14 5 15 15 5-15 5-5 16-5-16-15-5 15-5Z" />
          <path d="m54 15 2 6 6 2-6 2-2 6-2-6-6-2 6-2Z" fill="#d8aa55" />
        </g>
      )}
      {sticker === "chat" && (
        <g fill="none" stroke="#174e3d" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5">
          <path d="M16 22h33a8 8 0 0 1 8 8v12a8 8 0 0 1-8 8H32L21 58l2-8a8 8 0 0 1-7-8Z" fill="#eaf3ee" />
          <circle cx="29" cy="36" r="2" fill="#0ca469" stroke="none" />
          <circle cx="37" cy="36" r="2" fill="#0ca469" stroke="none" />
          <circle cx="45" cy="36" r="2" fill="#0ca469" stroke="none" />
        </g>
      )}
    </svg>
  );
}

export function PassportStickerPreview({
  sticker,
  className = "",
}: {
  sticker: PassportSticker;
  className?: string;
}) {
  return (
    <span className={className} aria-hidden="true">
      {sticker === "keys" ? (
        <KeySticker />
      ) : sticker === "plant" ? (
        <PlantSticker />
      ) : (
        <IllustratedSticker sticker={sticker} />
      )}
    </span>
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

function PassportFront({ stickers }: { stickers: PassportSticker[] }) {
  return (
    <div className="absolute inset-0 overflow-hidden rounded-[clamp(18px,4vw,30px)] shadow-[0_18px_42px_rgba(24,53,43,0.1)]">
      <Image
        src="/images/coflow-passport-front-card-v3.png"
        alt="Portada de CoFlow Passport"
        fill
        priority
        unoptimized
        sizes="(max-width: 768px) calc(100vw - 32px), 768px"
        className="object-cover"
      />

      {stickers.slice(0, 2).map((sticker, index) => (
        <PassportStickerPreview
          key={sticker}
          sticker={sticker}
          className={
            index === 0
              ? "absolute left-[5.5%] top-[7%] block h-[10%] w-[6.5%] rotate-[-8deg] drop-shadow-[0_2px_2px_rgba(62,51,31,0.14)]"
              : "absolute bottom-[5%] right-[7%] block h-[11%] w-[7%] rotate-[6deg] drop-shadow-[0_2px_2px_rgba(35,70,53,0.14)]"
          }
        />
      ))}

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
      <CoFlowMark className="absolute -left-[12%] top-[24%] w-[36%] opacity-100 drop-shadow-[0_5px_12px_rgba(21,67,52,0.12)]" />

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
  stickers = [],
}: {
  passport: SolvencyPassport;
  holderName: string;
  comparisonRent?: number;
  stickers?: PassportSticker[];
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
        <div className="relative aspect-[1.936/1] w-full rounded-[clamp(18px,4vw,30px)] [container-type:inline-size] [perspective:1400px]">
          {reducedMotion ? (
            flipped ? (
              <PassportBack passport={passport} holderName={holderName} comparisonRent={comparisonRent} />
            ) : (
              <PassportFront stickers={stickers} />
            )
          ) : (
            <motion.div
              className="absolute inset-0"
              initial={false}
              animate={{ rotateY: flipped ? 180 : 0 }}
              transition={{ duration: 0.62, ease: [0.22, 0.72, 0.2, 1] }}
              style={{
                transformOrigin: "center",
                transformStyle: "preserve-3d",
                willChange: "transform",
              }}
            >
              <div
                className="absolute inset-0 overflow-hidden rounded-[clamp(18px,4vw,30px)]"
                style={{
                  backfaceVisibility: "hidden",
                  WebkitBackfaceVisibility: "hidden",
                  transform: "rotateY(0deg)",
                }}
              >
                <PassportFront stickers={stickers} />
              </div>
              <div
                className="absolute inset-0 overflow-hidden rounded-[clamp(18px,4vw,30px)]"
                style={{
                  backfaceVisibility: "hidden",
                  WebkitBackfaceVisibility: "hidden",
                  transform: "rotateY(180deg)",
                }}
              >
                <PassportBack
                  passport={passport}
                  holderName={holderName}
                  comparisonRent={comparisonRent}
                />
              </div>
            </motion.div>
          )}
        </div>
      </button>

    </div>
  );
}
