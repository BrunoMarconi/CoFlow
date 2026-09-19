"use client";

import Image from "next/image";
import Link from "next/link";
import { Fragment, useRef, useState } from "react";

import { springEasing } from "@/lib/motionTokens";

import { faqs } from "./faqs";
import s from "./Landing.module.css";
import { LandingIntro, useLandingIntro } from "./LandingIntro";
import { SplitWords, useAccordion, useFloatingHeader, usePathStory, useScrollReveal } from "./landingMotion";
import PathScene from "./PathScene";

// Portado desde el proyecto coflow-landing (app/page.tsx +
// components/CompatibilityDeck.tsx). El markup se mantiene igual que en
// el original: los nombres de clase siguen siendo globales, pero el CSS
// los confina bajo .root (ver Landing.module.css), así que no se escapan
// al resto de la app. Los enlaces de llamada a la acción sí cambian:
// en el original eran anclas de maqueta y aquí van a /register y /login.

function ArrowIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="M4 10h11M11 6l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Cada punto corresponde a algo que YA existe en el backend: verificación
// de email, bloqueos/reportes y visibilidad de perfil. No prometemos nada
// que no esté construido.
const safetyPoints = [
  { title: "Perfiles verificados", text: "Cada cuenta confirma su correo antes de poder escribir a nadie." },
  { title: "Bloqueo y reporte", text: "Si algo no encaja, cortas la conversación y lo reportas en un toque." },
  { title: "Tú decides qué se ve", text: "Controlas la visibilidad de tu perfil y qué parte de tus hábitos compartes." },
];

const journeySteps = [
  { title: "Encuentra personas compatibles", text: "Por hábitos, presupuesto, zona y forma de convivir." },
  { title: "Formad una comunidad", text: "Formad el grupo con el que queréis compartir hogar." },
  { title: "Buscad un hogar", text: "Según las necesidades del grupo completo." },
];

type Card = {
  eyebrow: string;
  title: string;
  text: string;
  tone: string;
  kind: "score" | "habits" | "budget" | "social" | "priorities" | "result";
};

const cards: Card[] = [
  {
    eyebrow: "01 · Ritmo de vida",
    title: "Vuestros horarios no chocan.",
    text: "Coflow compara cuándo empieza y termina vuestro día, si teletrabajáis y cuánto tiempo pasáis en casa.",
    tone: "night",
    kind: "score",
  },
  {
    eyebrow: "02 · Orden y limpieza",
    title: "La convivencia se habla antes de compartir llaves.",
    text: "Las expectativas sobre limpieza, tareas y espacios comunes quedan claras desde el principio.",
    tone: "yellow",
    kind: "habits",
  },
  {
    eyebrow: "03 · Presupuesto y zona",
    title: "El mismo rango. Las mismas zonas.",
    text: "Formad un grupo que pueda buscar de verdad: con un presupuesto compatible y barrios en común.",
    tone: "blue",
    kind: "budget",
  },
  {
    eyebrow: "04 · Vida social",
    title: "Ni una fiesta sorpresa ni una casa en silencio.",
    text: "Buscamos un punto de encuentro entre visitas, planes compartidos, descanso y tiempo a solas.",
    tone: "coral",
    kind: "social",
  },
  {
    eyebrow: "05 · Lo imprescindible",
    title: "Lo importante queda claro desde el principio.",
    text: "Mascotas, tabaco, teletrabajo y otros límites personales también forman parte del encaje.",
    tone: "cream",
    kind: "priorities",
  },
  {
    eyebrow: "06 · Vuestra comunidad",
    title: "Esto podría funcionar.",
    text: "Personas compatibles, una búsqueda compartida y las decisiones importantes sobre la mesa.",
    tone: "green",
    kind: "result",
  },
];

function Arrow({ direction }: { direction: "left" | "right" }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d={direction === "left" ? "M19 12H5m6-6-6 6 6 6" : "M5 12h14m-6-6 6 6-6 6"} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CardVisual({ kind }: { kind: Card["kind"] }) {
  if (kind === "score") {
    return <div className="deck-score"><strong>Horarios</strong><span>comparados antes de conectar</span><div><i /><i /><i /><i /><i /></div></div>;
  }

  if (kind === "habits") {
    return <div className="deck-habits"><span><i>RU</i>Rutinas de limpieza<b>Preferencias</b></span><span><i>ES</i>Espacios comunes<b>Expectativas</b></span></div>;
  }

  if (kind === "budget") {
    return <div className="deck-budget"><span>Criterios compartidos</span><strong>Presupuesto</strong><div><i>Zona</i><i>Fecha</i><i>Vivienda</i></div></div>;
  }

  if (kind === "social") {
    return <div className="deck-social"><span>Casa tranquila</span><span className="is-selected">Equilibrio</span><span>Muy social</span><i><b /></i></div>;
  }

  if (kind === "priorities") {
    return <div className="deck-priorities"><span><i>·</i>Tabaco</span><span><i>·</i>Mascotas</span><span><i>·</i>Teletrabajo</span></div>;
  }

  return (
    <div className="deck-result">
      <div className="deck-avatars"><i>01</i><i>02</i><i>03</i><i>TÚ</i></div>
      <strong>Grupo</strong>
      <span>con criterios de convivencia en común</span>
      <a href="#vivienda">Buscar hogar juntos <Arrow direction="right" /></a>
    </div>
  );
}

// Física del mazo. Al soltar se mira hacia dónde IBA la carta (posición +
// velocidad proyectada), no solo dónde se soltó: un golpe corto y rápido
// también la lanza. Si no llega, vuelve con un rebote leve.
const DECK_SETTLE = springEasing({ damping: 0.55, response: 0.38 });
const DECK_THROW_MS = 420;
const DECK_PROJECTION_MS = 200;

type DeckDrag = {
  pointerId: number;
  x: number;
  y: number;
  card: HTMLElement;
  /** Transform de reposo que puso React, para volver a él. */
  rest: string;
  moved: boolean;
  trail: { x: number; t: number }[];
};

const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function CompatibilityDeck() {
  const [active, setActive] = useState(0);
  const deckRef = useRef<HTMLDivElement>(null);
  const drag = useRef<DeckDrag | null>(null);
  const suppressClick = useRef(false);

  function activeCard() {
    return deckRef.current?.querySelector<HTMLElement>(".compatibility-card.is-active") ?? null;
  }

  /** Saca la carta de arriba volando y la manda al fondo. El mazo avanza
   * ya (el contador y la siguiente carta no esperan al vuelo); la carta
   * lanzada se queda encima solo mientras vuela, gracias a la animación. */
  function throwCard(card: HTMLElement, from: string, direction: number, lift = 0) {
    setActive((current) => (current + 1) % cards.length);
    if (prefersReducedMotion()) return;

    card.style.transition = "none";
    const to = `translate3d(${direction * card.offsetWidth * 1.2}px, ${lift + 48}px, 0) rotate(${direction * 24}deg)`;
    const flight = card.animate(
      [
        { transform: from, opacity: 1, zIndex: 50 },
        { transform: to, opacity: 0, zIndex: 50 },
      ],
      { duration: DECK_THROW_MS, easing: "cubic-bezier(.25, .7, .35, 1)" },
    );
    flight.finished.then(
      () => requestAnimationFrame(() => card.style.removeProperty("transition")),
      () => card.style.removeProperty("transition"),
    );
  }

  function settle(card: HTMLElement, from: string, rest: string) {
    card.style.transform = rest;
    if (prefersReducedMotion()) {
      card.style.removeProperty("transition");
      return;
    }
    card
      .animate([{ transform: from }, { transform: rest }], DECK_SETTLE)
      .finished.then(
        () => card.style.removeProperty("transition"),
        () => card.style.removeProperty("transition"),
      );
  }

  function next() {
    const card = activeCard();
    if (card) throwCard(card, card.style.transform, -1);
  }

  function previous() {
    setActive((current) => (current - 1 + cards.length) % cards.length);
  }

  // En escritorio el mazo se inclina hacia el cursor, como un objeto que
  // tienes delante.
  function tilt(event: React.PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== "mouse" || prefersReducedMotion()) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    event.currentTarget.style.transform = `perspective(1400px) rotateX(${(-y * 7).toFixed(2)}deg) rotateY(${(x * 9).toFixed(2)}deg)`;
  }

  function resetTilt() {
    deckRef.current?.style.removeProperty("transform");
  }

  function release(event: React.PointerEvent<HTMLDivElement>) {
    const current = drag.current;
    if (!current || event.pointerId !== current.pointerId) return;
    drag.current = null;
    if (!current.moved) return;

    // El click que sigue a un arrastre no debe abrir el enlace de la carta.
    suppressClick.current = true;
    window.setTimeout(() => (suppressClick.current = false), 0);

    const dx = event.clientX - current.x;
    const dy = event.clientY - current.y;
    const first = current.trail[0];
    const velocity = (event.clientX - first.x) / Math.max(event.timeStamp - first.t, 1);
    const projected = dx + velocity * DECK_PROJECTION_MS;
    const from = current.card.style.transform;

    if (event.type !== "pointercancel" && Math.abs(projected) > current.card.offsetWidth * 0.32) {
      throwCard(current.card, from, Math.sign(projected), dy * 0.2);
    } else {
      settle(current.card, from, current.rest);
    }
  }

  return (
    <section className="compatibility-section" id="compatibilidad" aria-labelledby="compatibility-title">
      <div className="compatibility-intro">
        <div>
          <span className="kicker" data-sr>Compatibilidad real</span>
          <h2 id="compatibility-title" data-sr="words"><SplitWords text="La compatibilidad se nota en lo cotidiano." /></h2>
          <p data-sr>No buscamos una copia de ti. Buscamos personas con las que la convivencia pueda funcionar.</p>
        </div>

        <div className="deck-controls" aria-label="Controles de las tarjetas" data-sr>
          <button type="button" onClick={previous} aria-label="Ver tarjeta anterior"><Arrow direction="left" /></button>
          <button type="button" onClick={next} aria-label="Ver tarjeta siguiente"><Arrow direction="right" /></button>
          <span aria-live="polite">{String(active + 1).padStart(2, "0")} / {String(cards.length).padStart(2, "0")}</span>
        </div>
      </div>

      <div
        ref={deckRef}
        className="compatibility-deck"
        data-sr
        role="region"
        aria-roledescription="carrusel"
        aria-label="Criterios de compatibilidad"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === "ArrowRight") next();
          if (event.key === "ArrowLeft") previous();
        }}
        onPointerDown={(event) => {
          if (event.button !== 0) return;
          const card = activeCard();
          if (!card || !card.contains(event.target as Node)) return;
          drag.current = {
            pointerId: event.pointerId,
            x: event.clientX,
            y: event.clientY,
            card,
            rest: card.style.transform,
            moved: false,
            trail: [{ x: event.clientX, t: event.timeStamp }],
          };
        }}
        onPointerMove={(event) => {
          const current = drag.current;
          if (!current || event.pointerId !== current.pointerId) {
            tilt(event);
            return;
          }
          const dx = event.clientX - current.x;
          const dy = event.clientY - current.y;
          if (!current.moved) {
            if (Math.hypot(dx, dy) < 8) return;
            // Un gesto vertical es scroll: la carta no se entera.
            if (Math.abs(dy) > Math.abs(dx)) {
              drag.current = null;
              return;
            }
            current.moved = true;
            event.currentTarget.setPointerCapture(event.pointerId);
            current.card.style.transition = "none";
            resetTilt();
          }
          current.trail.push({ x: event.clientX, t: event.timeStamp });
          if (current.trail.length > 6) current.trail.shift();
          // La carta sigue al dedo 1:1 y gira un poco, como si la sujetaras
          // por abajo.
          current.card.style.transform = `translate3d(${dx}px, ${dy * 0.2}px, 0) rotate(${dx * 0.05}deg)`;
        }}
        onPointerUp={release}
        onPointerCancel={release}
        onPointerLeave={resetTilt}
        onClickCapture={(event) => {
          if (!suppressClick.current) return;
          event.preventDefault();
          event.stopPropagation();
        }}
      >
        {cards.map((card, index) => {
          const depth = (index - active + cards.length) % cards.length;
          const visibleDepth = Math.min(depth, 4);
          return (
            <article
              className={`compatibility-card card-${card.tone}${depth === 0 ? " is-active" : ""}`}
              key={card.eyebrow}
              aria-hidden={depth !== 0}
              style={{
                zIndex: cards.length - depth,
                opacity: depth > 4 ? 0 : 1,
                transform: `translate3d(${-visibleDepth * 28}px, ${visibleDepth * 7}px, 0) rotate(${visibleDepth % 2 ? -0.45 : 0.25}deg)`,
                pointerEvents: depth === 0 ? "auto" : "none",
              }}
            >
              <span className="card-count">{String(index + 1).padStart(2, "0")}</span>
              <div className="card-copy">
                <span>{card.eyebrow}</span>
                <h3>{card.title}</h3>
                <p>{card.text}</p>
              </div>
              <CardVisual kind={card.kind} />
            </article>
          );
        })}
      </div>
    </section>
  );
}

const heroTitle = "Tu próxima casa empieza por tu gente.";

export default function Landing() {
  const rootRef = useRef<HTMLElement>(null);
  useLandingIntro(rootRef);
  useScrollReveal(rootRef);
  useFloatingHeader(rootRef);
  usePathStory(rootRef);
  useAccordion(rootRef);

  return (
    // data-intro lo puede cambiar el script de LandingIntro antes de hidratar.
    <main className={s.root} data-intro="on" ref={rootRef} suppressHydrationWarning>
      <LandingIntro />
      <header className="site-header">
        <a className="brand" href="#inicio" aria-label="Coflow, volver al inicio">
          <Image className="brand-logo" src="/logo-coflow.png" alt="" aria-hidden="true" width={34} height={34} priority />
          <span className="brand-word">CoFlow</span>
        </a>
        <nav aria-label="Navegación principal" data-reveal>
          <span className="nav-indicator" aria-hidden="true" />
          <a href="#como-funciona">Cómo funciona</a>
          <a href="#compatibilidad">Compatibilidad</a>
          <a href="#vivienda">Vivienda</a>
          <Link href="/login">Entrar</Link>
        </nav>
        <Link className="header-cta" href="/register" data-reveal>Crear perfil <ArrowIcon /></Link>
      </header>

      <section className="hero-cover" id="inicio" aria-labelledby="hero-title">
        <div className="hero-cover-media">
          <Image className="hero-cover-image" src="/coflow-hero-life-v2.png" alt="Personas compartiendo una cocina en su hogar" fill priority sizes="100vw" />
        </div>
        <div className="hero-cover-shade" />
        <div className="hero-center">
          <span data-reveal><i /> Coflow ya está disponible</span>
          <h1 id="hero-title">
            {heroTitle.split(" ").map((word, index) => (
              <Fragment key={index}>{index > 0 && " "}<span className="hero-word" data-reveal="word">{word}</span></Fragment>
            ))}
          </h1>
          <p data-reveal>Empezamos en Málaga: conoce cómo vive cada persona antes de decidir con quién compartir piso.</p>
          <div data-reveal>
            <Link className="cover-primary" href="/register">Crear mi perfil</Link>
            <a className="cover-secondary" href="#compatibilidad">Ver compatibilidad</a>
          </div>
        </div>
        <div className="hero-route" aria-label="El recorrido de Coflow" data-reveal>
          <span><b>01</b>Encuentra personas compatibles</span>
          <span><b>02</b>Formad una comunidad</span>
          <span><b>03</b>Buscad un hogar</span>
          <a href="#como-funciona" aria-label="Ver cómo funciona"><ArrowIcon /></a>
        </div>
      </section>

      <section className="path-section" id="como-funciona" aria-labelledby="journey-title">
        <div className="path-aside">
          <div className="path-intro">
            <span className="kicker" data-sr>Cómo funciona</span>
            <h2 id="journey-title" data-sr="words"><SplitWords text="Primero las personas. Después, la casa." /></h2>
            <p data-sr>La mayoría busca piso y luego rellena habitaciones. Aquí el grupo se forma antes, y buscáis con un criterio común.</p>
          </div>
          <PathScene />
        </div>
        <div className="path-grid">
          {journeySteps.map((step, index) => (
            <article className="path-card" key={step.title} data-sr>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </article>
          ))}
        </div>
      </section>

      <CompatibilityDeck />

      <section className="safety-section" id="seguridad" aria-labelledby="safety-title">
        <div className="safety-copy">
          <span className="kicker kicker-on-dark" data-sr>Seguridad y confianza</span>
          <h2 id="safety-title" data-sr="words"><SplitWords text="Conocerse antes, con red de seguridad." /></h2>
          <p data-sr>Compartir casa es una decisión grande. Tú decides qué enseñas, con quién hablas y cuándo cortar.</p>
        </div>
        <div className="safety-grid">
          {safetyPoints.map((point, index) => (
            <article key={point.title} data-sr>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{point.title}</strong>
              <p>{point.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="group-search-section" id="vivienda" aria-labelledby="home-title">
        <div className="group-search-copy">
          <span className="kicker kicker-light" data-sr>Una vivienda para el grupo</span>
          <h2 id="home-title" data-sr="words"><SplitWords text="No basta con que el piso te encaje a ti." /></h2>
          <p data-sr>Coflow tiene en cuenta el presupuesto conjunto, las habitaciones, la ubicación y las preferencias de todos.</p>
        </div>
        <div className="group-search-grid">
          <article data-sr><span>01</span><div><strong>Habitaciones necesarias</strong><p>Según las personas del grupo.</p></div></article>
          <article data-sr><span>02</span><div><strong>Presupuesto conjunto</strong><p>Comparado con el precio de la vivienda.</p></div></article>
          <article data-sr><span>03</span><div><strong>Ubicación y fecha</strong><p>Según las preferencias compartidas.</p></div></article>
        </div>
      </section>

      <section className="owners-band" id="propietarios" aria-labelledby="owners-title">
        <div className="owners-copy">
          <span className="kicker kicker-warm" data-sr>Para propietarios</span>
          <h2 id="owners-title" data-sr="words"><SplitWords text="¿Tienes un piso para compartir?" /></h2>
          <p data-sr>Publica tu vivienda y recibe grupos ya formados, con presupuesto y convivencia acordados, en vez de candidatos sueltos.</p>
        </div>
        <Link className="owners-cta" href="/para-propietarios" data-sr>Ver cómo funciona para propietarios <ArrowIcon /></Link>
      </section>

      <section className="faq-section" id="preguntas" aria-labelledby="faq-title">
        <div className="faq-intro">
          <span className="kicker" data-sr>Preguntas frecuentes</span>
          <h2 id="faq-title" data-sr="words"><SplitWords text="Lo que sueles preguntarte antes de empezar." /></h2>
        </div>
        <div className="faq-list">
          {faqs.map(([question, answer]) => (
            <details key={question} data-sr>
              <summary>{question}<i aria-hidden="true" /></summary>
              <p>{answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="final-section" id="disponible" aria-labelledby="final-title">
        {/* Cierre circular: los dos círculos del logo vuelven a juntarse a
            medida que llegas al final, como en la intro. */}
        <div className="final-mark" aria-hidden="true">
          <i className="is-b" />
          <i className="is-a" />
          <i className="is-lens"><i /></i>
        </div>
        <span className="eyebrow eyebrow-dark" data-sr><i /> Disponible en Málaga</span>
        <h2 id="final-title" data-sr="words"><SplitWords text="Empieza por tu gente." /></h2>
        <p data-sr>Crear tu perfil es gratis y te lleva cinco minutos.</p>
        <Link className="final-link" href="/register" data-sr>Crear mi perfil gratis <ArrowIcon /></Link>
      </section>

      <footer>
        <a className="brand brand-footer" href="#inicio"><Image className="brand-logo" src="/logo-coflow.png" alt="" aria-hidden="true" width={34} height={34} priority /><span>CoFlow</span></a>
        <p>La forma más humana de encontrar un hogar compartido.</p>
        <div><a href="#como-funciona">Cómo funciona</a><a href="#compatibilidad">Compatibilidad</a><span>© 2026 Coflow</span></div>
      </footer>
    </main>
  );
}
