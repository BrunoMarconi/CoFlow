"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, ViewTransition, type ReactNode } from "react";
import { Clock3, Home, Users2 } from "lucide-react";

import { useHeightSwap, useShake } from "./authMotion";
import s from "./Auth.module.css";

// Carcasa de panel dividido compartida por /login y /register: a la
// izquierda el panel editorial (solo en escritorio), a la derecha el
// formulario. En móvil el panel se oculta y queda la marca arriba, que
// es lo único de ese lado que aporta algo en pantalla pequeña.
//
// Las dos pantallas montan esta misma carcasa, así que van envueltas en
// <ViewTransition> con el mismo nombre: al ir de una a otra, el panel se
// queda quieto y solo la tarjeta se transforma, en vez de recargarse
// entera.

function Brand({ className }: { className?: string }) {
  return (
    <Link href="/" className={className ? `${s.brand} ${className}` : s.brand} aria-label="CoFlow, ir al inicio">
      <Image className={s.brandLogo} src="/logo-coflow.png" alt="" aria-hidden="true" width={32} height={32} priority />
      <span>CoFlow</span>
    </Link>
  );
}

export default function AuthSplit({
  kicker,
  headline,
  text,
  points,
  foot = "Disponible en Málaga · Crear tu perfil es gratis",
  /** Cambia cuando el formulario cambia de paso: la tarjeta anima su alto. */
  swapKey,
  /** Sube en cada error para que la tarjeta se sacuda una vez. */
  shake = 0,
  children,
}: {
  kicker: string;
  headline: string;
  text: string;
  points: string[];
  foot?: string;
  swapKey?: unknown;
  shake?: number;
  children: ReactNode;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  useHeightSwap(panelRef, swapKey);
  useShake(panelRef, shake);

  return (
    <main className={s.root}>
      <ViewTransition name="auth-aside">
        <aside className={s.aside}>
          <Brand />
          {/* La clave remonta el bloque al cambiar de tipo de cuenta, así
              el texto nuevo entra en vez de aparecer de golpe. */}
          <div className={s.asideBody} key={headline}>
            <span className={s.kicker}>{kicker}</span>
            <h2 className={s.headline}>{headline}</h2>
            <p className={s.asideText}>{text}</p>
            <ul className={s.points}>
              {points.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>

            <div className={s.compatibilityPreview} aria-hidden="true">
              <div className={s.previewHeader}>
                <span>Tu perfil de convivencia</span>
                <i />
              </div>
              <div className={s.previewFlow}>
                <span><Clock3 /> Ritmo</span>
                <b />
                <span><Home /> Hogar</span>
                <b />
                <span><Users2 /> Comunidad</span>
              </div>
            </div>
          </div>
          <p className={s.asideFoot}>{foot}</p>
        </aside>
      </ViewTransition>

      <section className={s.panel}>
        <ViewTransition name="auth-panel">
          <div className={s.panelInner} ref={panelRef}>
            <Brand className={s.mobileBrand} />
            {children}
          </div>
        </ViewTransition>
      </section>
    </main>
  );
}
