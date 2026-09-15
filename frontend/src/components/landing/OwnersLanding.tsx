import Image from "next/image";
import Link from "next/link";

import { ownersFaqs } from "./owners-faqs";
import s from "./Landing.module.css";

// Misma piel que la landing principal: reutiliza Landing.module.css en vez
// de duplicar el sistema de bandas. Al compartir modulo, .root es la misma
// clase hasheada y todas las clases internas (.site-header, .hero-cover,
// .path-section, .safety-section, .faq-section, .final-section) aplican
// igual. Solo la banda comparativa trae CSS propio.
//
// No lleva "use client": aqui no hay estado, y las FAQ usan <details>
// nativo. Se renderiza entero en el servidor.

function ArrowIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="M4 10h11M11 6l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const steps = [
  { title: "Publica tu vivienda", text: "Describe la ubicación, capacidad, condiciones y plazas disponibles." },
  { title: "Recibe solicitudes", text: "Consulta la información que cada persona ha decidido compartir en su perfil." },
  { title: "Habla antes de decidir", text: "Resuelve dudas por mensaje y responde cuando la solicitud tenga sentido para ti." },
];

const benefits = [
  { title: "Información antes de responder", text: "Consulta presupuesto y preferencias de convivencia antes de iniciar una conversación." },
  { title: "Solicitudes desde Málaga", text: "CoFlow se encuentra actualmente disponible para viviendas y personas en Málaga." },
  { title: "Conversación directa", text: "Habla directamente con cada persona y mantén el control de la conversación." },
];

const coflowAdvantages = [
  "Presupuesto y preferencias antes de responder",
  "Conversación privada y directa",
  "Control sobre cada solicitud",
];

export default function OwnersLanding() {
  return (
    <main className={s.root}>
      <header className="site-header">
        <Link className="brand" href="/" aria-label="Coflow, volver al inicio">
          <Image className="brand-logo" src="/logo-coflow.png" alt="" aria-hidden="true" width={34} height={34} priority />
          <span>CoFlow</span>
        </Link>
        <nav aria-label="Navegación principal">
          <a href="#como-funciona">Cómo funciona</a>
          <a href="#ventajas">Ventajas</a>
          <a href="#preguntas">Preguntas</a>
          <Link href="/">Busco piso</Link>
        </nav>
        <Link className="header-cta" href="/register?role=owner">Publicar vivienda <ArrowIcon /></Link>
      </header>

      <section className="hero-cover is-bright" id="inicio" aria-labelledby="owners-hero-title">
        <Image className="hero-cover-image" src="/images/owners-malaga-apartment-v2.png" alt="Salón luminoso de una vivienda en Málaga" fill priority sizes="100vw" />
        <div className="hero-cover-shade is-strong" />
        <div className="hero-center">
          <span><i /> Para propietarios en Málaga</span>
          <h1 id="owners-hero-title">Tu vivienda merece una buena convivencia.</h1>
          <p>Publica gratis y conoce el presupuesto y las preferencias de cada persona antes de responder.</p>
          <div>
            <Link className="cover-primary" href="/register?role=owner">Publicar vivienda gratis</Link>
            <a className="cover-secondary" href="#como-funciona">Ver cómo funciona</a>
          </div>
        </div>
        <div className="hero-route" aria-label="El proceso para propietarios">
          <span><b>01</b>Publica tu vivienda</span>
          <span><b>02</b>Recibe solicitudes</span>
          <span><b>03</b>Habla antes de decidir</span>
          <a href="#como-funciona" aria-label="Ver cómo funciona"><ArrowIcon /></a>
        </div>
      </section>

      <section className="path-section" id="como-funciona" aria-labelledby="owners-steps-title">
        <div className="path-intro">
          <span className="kicker">Proceso transparente</span>
          <h2 id="owners-steps-title">Del primer contacto a la respuesta.</h2>
          <p>Publicar es gratis y no hay permanencia. Tú decides a quién respondes y cuándo.</p>
        </div>
        <div className="path-grid">
          {steps.map((step, index) => (
            <article className="path-card" key={step.title}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="safety-section" id="ventajas" aria-labelledby="owners-benefits-title">
        <div className="safety-copy">
          <span className="kicker kicker-on-dark">Más claridad, menos incertidumbre</span>
          <h2 id="owners-benefits-title">Conoce la información antes de responder.</h2>
          <p>Cada solicitud llega con contexto, para que valores si encaja con tu vivienda antes de escribir.</p>
        </div>
        <div className="safety-grid">
          {benefits.map((benefit, index) => (
            <article key={benefit.title}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{benefit.title}</strong>
              <p>{benefit.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="compare-band" aria-labelledby="owners-compare-title">
        <div className="compare-copy">
          <span className="kicker kicker-cool">Transparencia total</span>
          <h2 id="owners-compare-title">¿Por qué CoFlow es diferente?</h2>
          <p>La diferencia no está en el anuncio, sino en lo que sabes antes de empezar la conversación.</p>
        </div>
        <div className="compare-grid">
          <article className="compare-card">
            <header><strong>Anuncio convencional</strong><span>Menos contexto</span></header>
            <p>Datos básicos de la vivienda y conversaciones que empiezan sin conocer previamente las preferencias de convivencia.</p>
          </article>
          <article className="compare-card is-coflow">
            <header><strong>CoFlow</strong><span>Más información</span></header>
            <ul>
              {coflowAdvantages.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        </div>
      </section>

      <section className="faq-section" id="preguntas" aria-labelledby="owners-faq-title">
        <div className="faq-intro">
          <span className="kicker">Dudas frecuentes</span>
          <h2 id="owners-faq-title">Preguntas de propietarios.</h2>
        </div>
        <div className="faq-list">
          {ownersFaqs.map(([question, answer]) => (
            <details key={question}>
              <summary>{question}<i aria-hidden="true" /></summary>
              <p>{answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="final-section" aria-labelledby="owners-final-title">
        <span className="eyebrow eyebrow-dark"><i /> Gratis y sin permanencia</span>
        <h2 id="owners-final-title">Pon tu vivienda en manos afines.</h2>
        <p>Recibe solicitudes de personas que ya han contado su presupuesto y sus preferencias de convivencia.</p>
        <Link className="final-link" href="/register?role=owner">Publicar mi vivienda gratis <ArrowIcon /></Link>
      </section>

      <footer>
        <Link className="brand brand-footer" href="/">
          <Image className="brand-logo" src="/logo-coflow.png" alt="" aria-hidden="true" width={34} height={34} />
          <span>CoFlow</span>
        </Link>
        <p>Convivir en armonía. Alquilar con serenidad.</p>
        <div>
          <Link href="/">Busco piso</Link>
          <a href="#como-funciona">Cómo funciona</a>
          <span>© 2026 Coflow</span>
        </div>
      </footer>
    </main>
  );
}
