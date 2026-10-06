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

// Landing pensada para estudiantes internacionales: todo el texto visible
// va en inglés (el resto de la web sigue en español).
const journeySteps = [
  { title: "Find compatible people", text: "See habits, budget, neighbourhoods and dates before deciding who to live with." },
  { title: "Form a community", text: "Talk, check you want a similar way of living together and create your group." },
  { title: "Find a home together", text: "Plan the search around what the whole group needs." },
];

const safetyPoints = [
  { title: "Verified email", text: "Every account confirms its email before it can message anyone." },
  { title: "Block and report", text: "If something doesn't feel right, you can cut contact and report it from CoFlow." },
  { title: "You decide what's visible", text: "You control who can see your profile and what information you share." },
];

const erasmusFaqs = [
  ["Do I need to have a flat already?", "No. On CoFlow, people come first: you can meet potential flatmates and form a group before you start looking for a place."],
  ["Can I start before I arrive in Málaga?", "Yes. You can create your profile and start meeting people while you prepare for your arrival."],
  ["Is creating a profile free?", "Yes. Creating your CoFlow profile is free."],
  ["Does CoFlow rent out homes directly?", "CoFlow helps you find compatible people and organise a shared search. It doesn't act as a landlord or guarantee you a home."],
  ["What happens to my quiz answers?", "They're saved only in your browser, as a draft to help you get started. They don't create an account and are never published on their own."],
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
      <circle cx="14" cy="14" r="12.5" fill="#f2d99a" stroke="#fff9f0" strokeWidth="1.2" />
      <circle cx="24" cy="14" r="12.5" fill="#96d5ee" stroke="#fff9f0" strokeWidth="1.2" />
      <path d="M19 2.54A12.5 12.5 0 0 1 19 25.46A12.5 12.5 0 0 1 19 2.54Z" fill="#a8ddcb" />
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
    <main ref={rootRef} lang="en" className={`${s.root} ${styles.root}`}>
      <header className="site-header">
        <a className="brand" href="#inicio" aria-label="CoFlow, back to top">
          <PastelBrandMark />
          <span>CoFlow</span>
        </a>
        <nav aria-label="Main navigation">
          <span className="nav-indicator" aria-hidden="true" />
          <a href="#como-funciona">How it works</a>
          <a href="#convivencia">Living together</a>
          <a href="#seguridad">Safety</a>
        </nav>
        <Link className="header-cta" href={REGISTER_URL}>
          Create profile <ArrowIcon />
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
              CoFlow for ESN Málaga students
            </span>
            <h1 id="erasmus-title">
              <span>Your Erasmus</span>
              <span>starts</span>
              <span className={styles.heroAccent}>here.</span>
            </h1>
            <p>Find people who share your habits, your budget and a similar way of enjoying Málaga.</p>
            <div className={styles.heroActions}>
              <Link className={styles.primaryCta} href={REGISTER_URL}>Create my free profile <ArrowIcon /></Link>
              <a className={styles.secondaryCta} href="#como-funciona">See how it works</a>
            </div>
            <p className={styles.heroNote}>People · Community · Home</p>
          </div>
        </div>
        <a className={styles.scrollCue} href="#llegar" aria-label="Keep reading">
          <span>Discover your journey</span><i aria-hidden="true" />
        </a>
      </section>

      <section className={styles.arrival} id="llegar" aria-labelledby="arrival-title">
        <div className={styles.arrivalLead}>
          <span className="kicker" data-sr>A new city</span>
          <h2 id="arrival-title" data-sr="words"><SplitWords text="Arriving alone doesn't mean starting alone." /></h2>
          <p data-sr>Housing matters. But first come the people you&apos;ll have breakfast with, study with, unwind with and discover the city with.</p>
        </div>
        <div className={styles.arrivalGrid}>
          <article data-sr><span>01</span><strong>Matching dates</strong><p>Connect with people planning a similar stay.</p></article>
          <article data-sr><span>02</span><strong>A realistic budget</strong><p>Talk about money and neighbourhoods before you start searching.</p></article>
          <article data-sr><span>03</span><strong>House rules, out in the open</strong><p>Schedules, cleaning, guests and vibe on the table from day one.</p></article>
        </div>
      </section>

      <section className={`path-section ${styles.journeyBand}`} id="como-funciona" aria-labelledby="journey-title">
        <div className="path-aside">
          <div className="path-intro">
            <span className="kicker" data-sr>How it works</span>
            <h2 id="journey-title" data-sr="words"><SplitWords text="People first. Then, the home." /></h2>
            <p data-sr>CoFlow flips the order: you work out how you want to live, form your group and then search with shared criteria.</p>
          </div>
          <PathScene palette="pastel" steps={["People", "Community", "Home"]} />
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
          <span data-sr>Málaga will be new.</span>
          <h2 id="malaga-title" data-sr="words"><SplitWords text="Your people don't have to be new for long." /></h2>
          <p data-sr>Get to know how each person lives before you share keys.</p>
          <div className={styles.placeNames} data-sr aria-label="Areas of Málaga">Teatinos <i /> Centro <i /> El Ejido</div>
        </div>
        <div className={styles.malagaPhoto} data-sr>
          <Image className={styles.malagaImage} src="/images/cities/malaga.webp" alt="View of Málaga at sunset" fill sizes="(max-width: 900px) 100vw, 52vw" />
          <span aria-hidden="true">Your new city</span>
        </div>
      </section>

      <section className={`safety-section ${styles.safetyBand}`} id="seguridad" aria-labelledby="safety-title">
        <div className="safety-copy">
          <span className="kicker kicker-on-dark" data-sr>Safety and trust</span>
          <h2 id="safety-title" data-sr="words"><SplitWords text="Get to know each other first, with a safety net." /></h2>
          <p data-sr>Sharing a home is a big decision. You control what you show, who you talk to and when to cut contact.</p>
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
          <span className="kicker" data-sr>Before you start</span>
          <h2 id="faq-title" data-sr="words"><SplitWords text="What you'll want to know before you arrive." /></h2>
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
        <span className="eyebrow eyebrow-dark" data-sr><i /> Your experience starts here</span>
        <h2 id="final-title" data-sr="words"><SplitWords text="Find your people in Málaga." /></h2>
        <p data-sr>Creating your profile is free. Start by telling us how you like to live.</p>
        <Link className="final-link" href={REGISTER_URL} data-sr>Create my free profile <ArrowIcon /></Link>
      </section>

      <footer className={styles.footer}>
        <a className="brand brand-footer" href="#inicio"><Image className="brand-logo" src="/logo-coflow.png" alt="" aria-hidden="true" width={34} height={34} /><span>CoFlow</span></a>
        <p>The most human way to find a shared home.</p>
        <div><a href="#como-funciona">How it works</a><a href="#convivencia">Living together</a><span>© 2026 CoFlow</span></div>
      </footer>
    </main>
  );
}
