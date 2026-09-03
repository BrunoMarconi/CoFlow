"use client";

import { useEffect, useRef } from "react";

export default function AppleInteractions() {
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;
    const updateProgress = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const available = document.documentElement.scrollHeight - window.innerHeight;
        progressRef.current?.style.setProperty("--apple-progress", String(available > 0 ? Math.min(window.scrollY / available, 1) : 0));
      });
    };
    const cleanups: Array<() => void> = [];

    if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
      document.querySelectorAll<HTMLElement>("[data-apple-tilt]").forEach((card) => {
        const move = (event: PointerEvent) => {
          const bounds = card.getBoundingClientRect();
          const x = (event.clientX - bounds.left) / bounds.width;
          const y = (event.clientY - bounds.top) / bounds.height;
          card.style.setProperty("--apple-rx", `${(0.5 - y) * 3.5}deg`);
          card.style.setProperty("--apple-ry", `${(x - 0.5) * 4.5}deg`);
          card.style.setProperty("--apple-x", `${x * 100}%`);
          card.style.setProperty("--apple-y", `${y * 100}%`);
        };
        const leave = () => { card.style.setProperty("--apple-rx", "0deg"); card.style.setProperty("--apple-ry", "0deg"); };
        card.addEventListener("pointermove", move);
        card.addEventListener("pointerleave", leave);
        cleanups.push(() => { card.removeEventListener("pointermove", move); card.removeEventListener("pointerleave", leave); });
      });

      document.querySelectorAll<HTMLElement>("[data-apple-magnetic]").forEach((button) => {
        const move = (event: PointerEvent) => {
          const bounds = button.getBoundingClientRect();
          button.style.setProperty("--apple-mx", `${(event.clientX - bounds.left - bounds.width / 2) * 0.09}px`);
          button.style.setProperty("--apple-my", `${(event.clientY - bounds.top - bounds.height / 2) * 0.12}px`);
        };
        const leave = () => { button.style.setProperty("--apple-mx", "0px"); button.style.setProperty("--apple-my", "0px"); };
        button.addEventListener("pointermove", move);
        button.addEventListener("pointerleave", leave);
        cleanups.push(() => { button.removeEventListener("pointermove", move); button.removeEventListener("pointerleave", leave); });
      });
    }

    updateProgress();
    window.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("resize", updateProgress);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", updateProgress);
      window.removeEventListener("resize", updateProgress);
      cleanups.forEach((cleanup) => cleanup());
    };
  }, []);

  return <div ref={progressRef} className="apple-scroll-progress" aria-hidden="true" />;
}
