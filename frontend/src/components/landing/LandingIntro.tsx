"use client";

import { useLayoutEffect, useSyncExternalStore, type CSSProperties, type RefObject } from "react";

// Intro de marca de la landing. Dos fases:
//
// 1. CSS puro (arranca en el primer pintado, sin esperar a hidratar):
//    los dos círculos del logo se acercan hasta solaparse, el solape se
//    ilumina y aparece "CoFlow" letra a letra.
// 2. JS (en cuanto hidrata y la fase 1 ha terminado): la hoja crema se
//    recoge en la pastilla del logo de la cabecera, como una app que se
//    cierra en su icono, y la marca vuela a su sitio. La palabra existe
//    dos veces, en tinta dentro de la hoja y en blanco debajo, así que
//    cambia de color justo cuando el borde de la hoja la cruza.
//
// Solo se ve una vez por sesión, se salta con cualquier gesto y no se
// muestra con "reducir movimiento". El estado vive en data-intro del
// <main>: "on" (intro tapando la página), "flight" (la marca vuela y el
// contenido entra) y "off".

const STORAGE_KEY = "coflow:intro";
const WORDMARK = "CoFlow";
const HOLD_MS = 120;
const FLIGHT_MS = 950;
const FLIGHT_EASE = "cubic-bezier(.66, 0, .18, 1)";
const REVEAL_EASE = "cubic-bezier(.16, 1, .3, 1)";
const PAPER = "rgb(245, 243, 236)";
const PILL = "rgba(255, 254, 249, .94)";

// Corre antes de hidratar para que quien ya la ha visto no vea ni un
// fotograma de la hoja. Solo se ejecuta en la carga inicial: en una
// navegación cliente React no ejecuta scripts inline y decide el efecto.
const guardScript = `try{var m=document.currentScript.parentElement;if(sessionStorage.getItem("${STORAGE_KEY}")||location.hash.length>1||matchMedia("(prefers-reduced-motion: reduce)").matches)m.dataset.intro="off"}catch(e){}`;

function hasSeenIntro() {
  try {
    return sessionStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function markIntroSeen() {
  try {
    sessionStorage.setItem(STORAGE_KEY, "1");
  } catch {
    // Sin almacenamiento (modo privado estricto): se repetirá, sin más.
  }
}

function Lockup({ light = false }: { light?: boolean }) {
  return (
    <div className={light ? "intro-lockup is-light" : "intro-lockup"}>
      <span className="intro-mark">
        <i className="is-b" />
        <i className="is-a" />
        <i className="is-lens"><i /></i>
        <i className="intro-ring" />
      </span>
      <span className="intro-word">
        {WORDMARK.split("").map((letter, index) => (
          <span key={index} style={{ "--i": index } as CSSProperties}>{letter}</span>
        ))}
      </span>
    </div>
  );
}

const noSubscription = () => () => {};

export function LandingIntro() {
  // El script solo sirve en el HTML del servidor. En un montaje cliente no
  // se ejecutaría y React avisa por renderizarlo, así que tras hidratar
  // (o al llegar por navegación cliente) desaparece.
  const renderGuard = useSyncExternalStore(noSubscription, () => false, () => true);

  return (
    <>
      {renderGuard && <script dangerouslySetInnerHTML={{ __html: guardScript }} />}
      <div className="intro" aria-hidden="true">
        <Lockup light />
        <div className="intro-sheet">
          <Lockup />
        </div>
      </div>
    </>
  );
}

function center(rect: DOMRect) {
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}

// translate + scale que lleva `from` al centro y ancho de `to`.
function flightTransform(from: DOMRect, to: { x: number; y: number; width: number }) {
  const origin = center(from);
  return `translate(${to.x - origin.x}px, ${to.y - origin.y}px) scale(${to.width / from.width})`;
}

export function useLandingIntro(rootRef: RefObject<HTMLElement | null>) {
  useLayoutEffect(() => {
    const root = rootRef.current;
    const overlay = root?.querySelector<HTMLElement>(".intro");
    if (!root || !overlay || root.dataset.intro !== "on") return;

    const off = () => {
      root.dataset.intro = "off";
    };

    // Si el failsafe de CSS ya la ha escondido (hidratación muy lenta) o
    // la página no arranca arriba del todo, no tiene sentido reproducirla.
    const failsafeFired = Number(getComputedStyle(overlay).opacity) < 1;
    if (
      hasSeenIntro() ||
      failsafeFired ||
      window.scrollY > 40 ||
      location.hash.length > 1 ||
      matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      off();
      return;
    }

    const sheet = overlay.querySelector<HTMLElement>(".intro-sheet");
    const inkMark = overlay.querySelector<HTMLElement>(".intro-sheet .intro-mark");
    const inkWord = overlay.querySelector<HTMLElement>(".intro-sheet .intro-word");
    const lightWord = overlay.querySelector<HTMLElement>(".is-light .intro-word");
    const lastLetter = inkWord?.lastElementChild;
    const brand = root.querySelector<HTMLElement>(".site-header .brand");
    const logo = brand?.querySelector<HTMLElement>(".brand-logo");
    const brandWord = brand?.querySelector<HTMLElement>(".brand-word");
    const heroImage = root.querySelector<HTMLElement>(".hero-cover-image");
    if (!sheet || !inkMark || !inkWord || !lightWord || !lastLetter || !brand || !logo || !brandWord) {
      off();
      return;
    }

    // Lo que vuela dentro de la capa, lo que entra en la página y la
    // espera del logo real: al saltar la intro, cada grupo se trata distinto.
    const overlayAnimations: Animation[] = [];
    const pageAnimations: Animation[] = [];
    let brandHold: Animation | null = null;
    let timer = 0;
    let settled = false;
    let cancelled = false;

    const fadeOut = (duration: number) => {
      const fade = overlay.animate({ opacity: [1, 0] }, { duration, easing: "ease-out", fill: "forwards" });
      overlayAnimations.push(fade);
      fade.finished.then(() => {
        off();
        for (const animation of overlayAnimations) animation.cancel();
      }, () => {});
    };

    const settle = () => {
      settled = true;
      window.clearTimeout(timer);
      removeListeners();
    };

    // Cualquier gesto la corta: congela la marca donde esté, deja el
    // contenido en su sitio y funde la capa.
    const skip = () => {
      if (settled) return;
      settle();
      markIntroSeen();
      for (const animation of overlayAnimations) animation.pause();
      for (const animation of pageAnimations) animation.finish();
      brandHold?.cancel();
      root.dataset.intro = "flight";
      fadeOut(260);
    };

    const onScroll = () => {
      if (window.scrollY > 40) skip();
    };

    // En móvil la barra de direcciones dispara resize sin cambiar el ancho.
    const startWidth = window.innerWidth;
    const onResize = () => {
      if (window.innerWidth !== startWidth) skip();
    };

    const skipEvents = ["pointerdown", "keydown", "wheel", "touchmove"] as const;
    for (const type of skipEvents) window.addEventListener(type, skip, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);

    function removeListeners() {
      for (const type of skipEvents) window.removeEventListener(type, skip);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    }

    const fly = () => {
      if (settled || cancelled) return;
      markIntroSeen();

      const sheetBox = sheet.getBoundingClientRect();
      const pill = logo.getBoundingClientRect();
      const logoStyle = getComputedStyle(logo);
      const padX = parseFloat(logoStyle.paddingLeft) + parseFloat(logoStyle.paddingRight);
      const padY = parseFloat(logoStyle.paddingTop) + parseFloat(logoStyle.paddingBottom);
      const logoContent = {
        x: pill.left + parseFloat(logoStyle.paddingLeft) + (pill.width - padX) / 2,
        y: pill.top + parseFloat(logoStyle.paddingTop) + (pill.height - padY) / 2,
        width: pill.width - padX,
      };
      const wordTarget = brandWord.getBoundingClientRect();
      const wordFlight = flightTransform(inkWord.getBoundingClientRect(), { ...center(wordTarget), width: wordTarget.width });
      const flight: KeyframeAnimationOptions = { duration: FLIGHT_MS, easing: FLIGHT_EASE, fill: "forwards" };
      const pillClip = `inset(${pill.top - sheetBox.top}px ${sheetBox.right - pill.right}px ${sheetBox.bottom - pill.bottom}px ${pill.left - sheetBox.left}px round ${logoStyle.borderTopLeftRadius})`;

      overlayAnimations.push(
        sheet.animate([
          { clipPath: "inset(0px 0px 0px 0px round 0px)", backgroundColor: PAPER },
          // Solo el color: el recorte tiene que avanzar al mismo ritmo que
          // la marca o la deja fuera de la hoja antes de tiempo.
          { backgroundColor: PAPER, offset: 0.8 },
          { clipPath: pillClip, backgroundColor: PILL },
        ], flight),
        inkMark.animate([{ transform: "none" }, { transform: flightTransform(inkMark.getBoundingClientRect(), logoContent) }], flight),
        inkWord.animate([{ transform: "none" }, { transform: wordFlight }], flight),
        lightWord.animate([{ transform: "none" }, { transform: wordFlight }], flight),
      );
      // El logo real espera escondido bajo la pastilla hasta el relevo.
      brandHold = brand.animate({ opacity: [0, 0] }, { duration: FLIGHT_MS });

      if (heroImage) {
        pageAnimations.push(heroImage.animate({ scale: ["1.12", "1"] }, { duration: FLIGHT_MS + 700, easing: REVEAL_EASE }));
      }

      const revealItems = Array.from(root.querySelectorAll<HTMLElement>("[data-reveal]"));
      revealItems.forEach((item, index) => {
        const isWord = item.dataset.reveal === "word";
        pageAnimations.push(item.animate(
          [
            { opacity: 0, translate: isWord ? "0 .32em" : "0 18px", filter: isWord ? "blur(8px)" : "none" },
            { opacity: 1, translate: "0 0", filter: "none" },
          ],
          { duration: 780, delay: 260 + index * 36, easing: REVEAL_EASE, fill: "backwards" },
        ));
      });

      // Las animaciones ya retienen el estado inicial (fill backwards),
      // así que el CSS de "on" puede soltarse en el mismo fotograma.
      root.dataset.intro = "flight";

      timer = window.setTimeout(() => {
        if (settled) return;
        settle();
        fadeOut(200);
      }, FLIGHT_MS);
    };

    // La fase 1 es CSS: esperamos a que acabe la última letra (si ya
    // acabó mientras hidratábamos, la promesa resuelve al momento).
    Promise.all(lastLetter.getAnimations().map((animation) => animation.finished)).then(
      () => {
        if (!cancelled && !settled) timer = window.setTimeout(fly, HOLD_MS);
      },
      () => {
        if (!cancelled) skip();
      },
    );

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      removeListeners();
      brandHold?.cancel();
      for (const animation of [...overlayAnimations, ...pageAnimations]) animation.cancel();
    };
  }, [rootRef]);
}
