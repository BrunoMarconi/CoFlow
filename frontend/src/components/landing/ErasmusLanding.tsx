"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";

import ConvivenciaTest from "./ConvivenciaTest";
import s from "./Landing.module.css";
import styles from "./ErasmusLanding.module.css";
import { SplitWords, useAccordion, useFloatingHeader, usePathStory, useScrollReveal } from "./landingMotion";
import PathScene from "./PathScene";

const REGISTER_URL = "/register?utm_source=esn_malaga&utm_medium=partner&utm_campaign=erasmus_2026";

const journeySteps = [
  { title: "Encuentra personas compatibles", text: "Conoce hábitos, presupuesto, zonas y fechas antes de decidir con quién compartir." },
  { title: "Formad una comunidad", text: "Hablad, comprobad que queréis una convivencia parecida y cread vuestro grupo." },
  { title: "Buscad un hogar", text: "Organizad la búsqueda pensando en las necesidades del grupo completo." },
];

const safetyPoints = [
  { title: "Correo verificado", text: "Cada cuenta confirma su correo antes de poder escribir a otras personas." },
  { title: "Bloqueo y reporte", text: "Si algo no encaja, puedes cortar el contacto y reportarlo desde CoFlow." },
  { title: "Tú decides qué se ve", text: "Controlas la visibilidad de tu perfil y la información que compartes." },
];

const erasmusFaqs = [
  ["¿Necesito tener ya un piso?", "No. En CoFlow el punto de partida son las personas: puedes conocer posibles compañeros y formar un grupo antes de buscar vivienda."],
  ["¿Puedo empezar antes de llegar a Málaga?", "Sí. Puedes crear tu perfil y empezar a conocer personas mientras preparas tu llegada."],
  ["¿Crear mi perfil es gratis?", "Sí. Crear tu perfil en CoFlow es gratis."],
  ["¿CoFlow alquila directamente las viviendas?", "CoFlow te ayuda a encontrar personas compatibles y a organizar una búsqueda compartida. No actúa como propietario ni garantiza una vivienda."],
  ["¿Qué ocurre con mis respuestas del test?", "Se guardan únicamente en tu navegador como borrador para ayudarte a empezar. No crean una cuenta ni se publican por sí solas."],
] as const;

function ArrowIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="M4 10h11M11 6l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PastelBrandMark() {
  return (
    <svg className={`brand-logo ${styles.pastelBrandLogo}`} viewBox="0 0 38 28" aria-hidden="true">
      <circle cx="14" cy="14" r="12.5" fill="#96d5ee" stroke="#fff9f0" strokeWidth="1.2" />
      <circle cx="24" cy="14" r="12.5" fill="#ec8fc4" stroke="#fff9f0" strokeWidth="1.2" />
    </svg>
  );
}

export default function ErasmusLanding() {
  const rootRef = useRef<HTMLElement>(null);
  useScrollReveal(rootRef);
  useFloatingHeader(rootRef);
  usePathStory(rootRef);
  useAccordion(rootRef);

  return (
    <main ref={rootRef} className={`${s.root} ${styles.root}`}>
      <header className="site-header">
        <a className="brand" href="#inicio" aria-label="CoFlow, volver al inicio">
          <PastelBrandMark />
          <span>CoFlow</span>
        </a>
        <nav aria-label="Navegación principal">
          <span className="nav-indicator" aria-hidden="true" />
          <a href="#como-funciona">Cómo funciona</a>
          <a href="#convivencia">Tu convivencia</a>
          <a href="#seguridad">Seguridad</a>
        </nav>
        <Link className="header-cta" href={REGISTER_URL}>
          Crear perfil <ArrowIcon />
        </Link>
      </header>

      <section className={styles.hero} id="inicio" aria-labelledby="erasmus-title">
        <div className={styles.heroPaper} aria-hidden="true" />
        <div className={styles.pastelBackdrop} aria-hidden="true">
          <svg className={styles.pastelFan} viewBox="0 0 1440 860" preserveAspectRatio="none">
            <path className={`${styles.fanArc} ${styles.arcCoral}`} pathLength="1" d="M560 880 C450 660 470 150 650 -90" />
            <path className={`${styles.fanArc} ${styles.arcMint}`} pathLength="1" d="M625 880 C500 640 610 120 850 -100" />
            <path className={`${styles.fanArc} ${styles.arcSky}`} pathLength="1" d="M690 880 C555 620 760 110 1050 -80" />
            <path className={`${styles.fanArc} ${styles.arcLilac}`} pathLength="1" d="M755 880 C600 610 900 120 1280 -45" />
            <path className={`${styles.fanArc} ${styles.arcPeach}`} pathLength="1" d="M820 880 C650 620 1070 190 1530 120" />
            <path className={`${styles.fanArc} ${styles.arcButter}`} pathLength="1" d="M885 880 C720 650 1170 330 1540 355" />
            <path className={`${styles.fanArc} ${styles.arcPink}`} pathLength="1" d="M950 880 C800 700 1270 540 1530 590" />
            <path className={`${styles.fanArc} ${styles.arcAqua}`} pathLength="1" d="M1015 880 C900 790 1260 740 1500 820" />
          </svg>
        </div>
        <div className={styles.heroInner}>
          <div className={styles.heroCopy}>
            <span className={styles.partnerLabel}>
              <i className={styles.colorDots} aria-hidden="true"><b /><b /><b /><b /><b /></i>
              CoFlow para estudiantes ESN Málaga
            </span>
            <h1 id="erasmus-title">
              <span>Tu Erasmus</span>
              <span>empieza</span>
              <span className={styles.heroAccent}>aquí.</span>
            </h1>
            <p>Encuentra personas con las que compartir hábitos, presupuesto y una forma parecida de vivir Málaga.</p>
            <div className={styles.heroActions}>
              <Link className={styles.primaryCta} href={REGISTER_URL}>Crear mi perfil gratis <ArrowIcon /></Link>
              <a className={styles.secondaryCta} href="#como-funciona">Descubrir cómo funciona</a>
            </div>
            <p className={styles.heroNote}>Personas · Comunidad · Hogar</p>
          </div>
        </div>
        <a className={styles.scrollCue} href="#llegar" aria-label="Continuar leyendo">
          <span>Descubre tu recorrido</span><i aria-hidden="true" />
        </a>
      </section>

      <section className={styles.arrival} id="llegar" aria-labelledby="arrival-title">
        <div className={styles.arrivalLead}>
          <span className="kicker" data-sr>Una ciudad nueva</span>
          <h2 id="arrival-title" data-sr="words"><SplitWords text="Llegar solo no significa empezar solo." /></h2>
          <p data-sr>La vivienda importa. Pero antes están las personas con las que vas a desayunar, estudiar, descansar y descubrir la ciudad.</p>
        </div>
        <div className={styles.arrivalGrid}>
          <article data-sr><span>01</span><strong>Fechas compatibles</strong><p>Conecta con personas que estén preparando una estancia parecida.</p></article>
          <article data-sr><span>02</span><strong>Presupuesto realista</strong><p>Hablad de dinero y zonas antes de organizar la búsqueda.</p></article>
          <article data-sr><span>03</span><strong>Convivencia hablada</strong><p>Horarios, limpieza, visitas y ambiente sobre la mesa desde el principio.</p></article>
        </div>
      </section>

      <section className={`path-section ${styles.journeyBand}`} id="como-funciona" aria-labelledby="journey-title">
        <div className="path-aside">
          <div className="path-intro">
            <span className="kicker" data-sr>Cómo funciona</span>
            <h2 id="journey-title" data-sr="words"><SplitWords text="Primero las personas. Después, la casa." /></h2>
            <p data-sr>CoFlow cambia el orden: conocéis cómo queréis vivir, formáis vuestro grupo y después buscáis con un criterio común.</p>
          </div>
          <PathScene palette="pastel" />
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

      <div className={styles.testBand}>
        <ConvivenciaTest />
      </div>

      <section className={styles.malaga} id="malaga" aria-labelledby="malaga-title">
        <span className={styles.malagaBackdropWord} aria-hidden="true">MÁLAGA</span>
        <div className={styles.malagaCopy}>
          <span data-sr>Málaga será nueva.</span>
          <h2 id="malaga-title" data-sr="words"><SplitWords text="Tu gente no tiene por qué serlo durante mucho tiempo." /></h2>
          <p data-sr>Empieza a conocer cómo vive cada persona antes de compartir llaves.</p>
          <div className={styles.placeNames} data-sr aria-label="Zonas de Málaga">Teatinos <i /> Centro <i /> El Ejido</div>
        </div>
        <div className={styles.malagaPhoto} data-sr>
          <Image className={styles.malagaImage} src="/images/cities/malaga.webp" alt="Vista de Málaga al atardecer" fill sizes="(max-width: 900px) 100vw, 52vw" />
          <span aria-hidden="true">Tu nueva ciudad</span>
        </div>
      </section>

      <section className={`safety-section ${styles.safetyBand}`} id="seguridad" aria-labelledby="safety-title">
        <div className="safety-copy">
          <span className="kicker kicker-on-dark" data-sr>Seguridad y confianza</span>
          <h2 id="safety-title" data-sr="words"><SplitWords text="Conocerse antes, con red de seguridad." /></h2>
          <p data-sr>Compartir casa es una decisión importante. Tú controlas qué enseñas, con quién hablas y cuándo cortar el contacto.</p>
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

      <section className={`faq-section ${styles.faqBand}`} id="preguntas" aria-labelledby="faq-title">
        <div className="faq-intro">
          <span className="kicker" data-sr>Antes de empezar</span>
          <h2 id="faq-title" data-sr="words"><SplitWords text="Lo que querrás saber antes de llegar." /></h2>
        </div>
        <div className="faq-list">
          {erasmusFaqs.map(([question, answer]) => (
            <details key={question} data-sr>
              <summary>{question}<i aria-hidden="true" /></summary>
              <p>{answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className={`final-section ${styles.finalBand}`} id="empezar" aria-labelledby="final-title">
        <div className="final-mark" aria-hidden="true"><i className="is-b" /><i className="is-a" /><i className="is-lens"><i /></i></div>
        <span className="eyebrow eyebrow-dark" data-sr><i /> Tu experiencia empieza aquí</span>
        <h2 id="final-title" data-sr="words"><SplitWords text="Encuentra tu gente en Málaga." /></h2>
        <p data-sr>Crear tu perfil es gratis. Empieza por contar cómo te gusta convivir.</p>
        <Link className="final-link" href={REGISTER_URL} data-sr>Crear mi perfil gratis <ArrowIcon /></Link>
      </section>

      <footer className={styles.footer}>
        <a className="brand brand-footer" href="#inicio"><Image className="brand-logo" src="/logo-coflow.png" alt="" aria-hidden="true" width={34} height={34} /><span>CoFlow</span></a>
        <p>La forma más humana de encontrar un hogar compartido.</p>
        <div><a href="#como-funciona">Cómo funciona</a><a href="#convivencia">Tu convivencia</a><span>© 2026 CoFlow</span></div>
      </footer>
    </main>
  );
}
