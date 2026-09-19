"use client";

import { Fragment, useEffect, type RefObject } from "react";

// Movimiento de la landing por debajo del hero: entradas al hacer scroll y
// cabecera flotante. La intro del hero vive aparte (LandingIntro.tsx).
//
// Todo va con la Web Animations API y no con transiciones CSS: varios de
// estos elementos ya declaran su `transition` para el hover, y una
// transición nueva la pisaría (una `transition` no se suma entre reglas).

const EASE_OUT = "cubic-bezier(.16, 1, .3, 1)";
const STAGGER_MS = 90;
const WORD_STAGGER_MS = 40;

const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Titular que entra palabra a palabra, igual que el del hero: así toda
 * la página habla el mismo idioma. Va con data-sr="words" en el titular. */
export function SplitWords({ text }: { text: string }) {
  return text.split(" ").map((word, index) => (
    <Fragment key={index}>
      {index > 0 && " "}
      <span className="sr-word">{word}</span>
    </Fragment>
  ));
}

function reveal(el: HTMLElement, delay: number) {
  if (el.dataset.sr === "words") {
    el.querySelectorAll<HTMLElement>(".sr-word").forEach((word, index) => {
      word.animate(
        [
          { opacity: 0, translate: "0 .35em", filter: "blur(8px)" },
          { opacity: 1, translate: "0 0", filter: "blur(0px)" },
        ],
        { duration: 820, delay: delay + index * WORD_STAGGER_MS, easing: EASE_OUT, fill: "backwards" },
      );
    });
  } else {
    el.animate(
      [
        { opacity: 0, translate: "0 28px" },
        { opacity: 1, translate: "0 0" },
      ],
      { duration: 820, delay, easing: EASE_OUT, fill: "backwards" },
    );
  }
  // La animación ya retiene el estado inicial durante su retardo (fill
  // backwards), así que el CSS que lo escondía puede soltarse ya.
  el.dataset.srIn = "";
}

/**
 * Entradas al hacer scroll para todo lo marcado con data-sr. Solo esconde
 * lo que aún está por debajo del pliegue y solo cuando JS ya está aquí:
 * sin JS, o con "reducir movimiento", la página se ve entera y quieta.
 * Lo que entra a la vez se escalona entre sí; lo que entra solo, no espera.
 */
export function useScrollReveal(rootRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root || reducedMotion() || !("IntersectionObserver" in window)) return;

    const items = Array.from(root.querySelectorAll<HTMLElement>("[data-sr]"));
    const revealLine = window.innerHeight * 0.9;
    const pending = items.filter((el) => el.getBoundingClientRect().top >= revealLine);
    for (const el of items) if (!pending.includes(el)) el.dataset.srIn = "";
    root.dataset.srReady = "";

    const observer = new IntersectionObserver(
      (entries) => {
        entries
          .filter((entry) => entry.isIntersecting)
          .map((entry) => entry.target as HTMLElement)
          .sort((a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1))
          .forEach((el, index) => {
            observer.unobserve(el);
            reveal(el, index * STAGGER_MS);
          });
      },
      { rootMargin: "0px 0px -10% 0px" },
    );
    for (const el of pending) observer.observe(el);

    return () => observer.disconnect();
  }, [rootRef]);
}

/**
 * Preguntas frecuentes: <details> abre y cierra de golpe; aquí se anima su
 * altura (y el texto entra un instante después). Se hace a mano con WAAPI
 * porque ::details-content todavía no existe en todos los navegadores.
 * Sin JS, o con "reducir movimiento", funciona el <details> nativo.
 */
export function useAccordion(rootRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const list = rootRef.current?.querySelector<HTMLElement>(".faq-list");
    if (!list) return;

    const running = new WeakMap<HTMLDetailsElement, Animation>();

    const onClick = (event: MouseEvent) => {
      const summary = (event.target as Element).closest("summary");
      const details = summary?.parentElement;
      if (!summary || !(details instanceof HTMLDetailsElement) || !list.contains(details) || reducedMotion()) return;
      event.preventDefault();

      // Si estaba a medio abrir o cerrar, se parte de la altura que se ve.
      const from = details.offsetHeight;
      running.get(details)?.cancel();
      const closing = details.open && details.dataset.closing === undefined;
      const borders = details.offsetHeight - details.clientHeight;
      details.style.overflow = "hidden";

      let to: number;
      if (closing) {
        details.dataset.closing = "";
        to = summary.offsetHeight + borders;
      } else {
        delete details.dataset.closing;
        details.open = true;
        to = details.offsetHeight;
        details.querySelector("p")?.animate(
          [
            { opacity: 0, translate: "0 -6px" },
            { opacity: 1, translate: "0 0" },
          ],
          { duration: 420, delay: 70, easing: EASE_OUT, fill: "backwards" },
        );
      }

      const animation = details.animate(
        { height: [`${from}px`, `${to}px`] },
        { duration: closing ? 320 : 460, easing: EASE_OUT },
      );
      running.set(details, animation);
      animation.finished.then(
        () => {
          if (closing) details.open = false;
          delete details.dataset.closing;
          details.style.removeProperty("overflow");
          running.delete(details);
        },
        () => {},
      );
    };

    list.addEventListener("click", onClick);
    return () => list.removeEventListener("click", onClick);
  }, [rootRef]);
}

/**
 * "Cómo funciona" contado con scroll: el paso que cruza la franja central
 * de la pantalla es el actual; la escena (PathScene) cambia a su estado y
 * los otros pasos se atenúan. Sin JS la escena se queda en el primer
 * estado y los tres pasos se leen enteros.
 */
export function usePathStory(rootRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const section = rootRef.current?.querySelector<HTMLElement>(".path-section");
    const scene = section?.querySelector<HTMLElement>(".path-scene");
    const cards = Array.from(section?.querySelectorAll<HTMLElement>(".path-card") ?? []);
    if (!section || !scene || cards.length === 0 || !("IntersectionObserver" in window)) return;

    const setStep = (step: number) => {
      scene.dataset.step = String(step);
      cards.forEach((card, index) => card.toggleAttribute("data-current", index === step));
    };
    setStep(0);
    section.dataset.story = "";

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setStep(cards.indexOf(entry.target as HTMLElement));
        }
      },
      // Franja entre el 48% y el 58% de la altura: en móvil la escena ocupa
      // la parte de arriba, así que el paso "actual" se lee algo más abajo.
      { rootMargin: "-48% 0px -42% 0px" },
    );
    for (const card of cards) observer.observe(card);

    return () => {
      observer.disconnect();
      delete section.dataset.story;
    };
  }, [rootRef]);
}

/**
 * Cabecera: sobre la foto del hero es transparente; en cuanto empiezas a
 * bajar se recoge en una píldora de cristal fija arriba, con "Crear perfil"
 * siempre a mano. En escritorio, un indicador se desliza bajo el enlace de
 * la sección que estás leyendo.
 */
export function useFloatingHeader(rootRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const root = rootRef.current;
    const header = root?.querySelector<HTMLElement>(".site-header");
    const nav = header?.querySelector<HTMLElement>("nav");
    if (!root || !header || !nav) return;

    header.toggleAttribute("data-fixed", true);
    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        header.toggleAttribute("data-floating", window.scrollY > 64);
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    // Scrollspy: la sección activa es la que cruza la franja central.
    const links = new Map<string, HTMLElement>();
    for (const link of nav.querySelectorAll<HTMLElement>('a[href^="#"]')) {
      links.set(link.getAttribute("href")!.slice(1), link);
    }
    let activeId: string | null = null;
    const place = () => {
      for (const [id, link] of links) link.toggleAttribute("data-current", id === activeId);
      const link = activeId ? links.get(activeId) : null;
      if (!link) {
        delete nav.dataset.active;
        return;
      }
      nav.style.setProperty("--ind-x", `${link.offsetLeft - 12}px`);
      nav.style.setProperty("--ind-w", `${link.offsetWidth + 24}px`);
      nav.dataset.active = activeId!;
    };

    const visible = new Set<string>();
    const spy = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.add(entry.target.id);
          else visible.delete(entry.target.id);
        }
        activeId = [...links.keys()].find((id) => visible.has(id)) ?? null;
        place();
      },
      { rootMargin: "-40% 0px -55% 0px" },
    );
    for (const id of links.keys()) {
      const section = document.getElementById(id);
      if (section) spy.observe(section);
    }
    window.addEventListener("resize", place);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", place);
      spy.disconnect();
      header.removeAttribute("data-fixed");
    };
  }, [rootRef]);
}
