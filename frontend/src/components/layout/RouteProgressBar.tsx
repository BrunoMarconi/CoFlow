"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

// Next.js (App Router) no expone eventos de "empezó/terminó la
// navegación" como el Pages Router. Pero toda navegación cliente —ya
// sea un <Link>, un router.push() o un router.replace()— pasa por la
// History API, así que interceptamos pushState/replaceState una sola
// vez para saber cuándo arranca, y usamos el cambio de pathname para
// saber cuándo la nueva ruta ya montó.
let historyPatched = false;

function patchHistoryOnce(onNavigationStart: () => void) {
  if (historyPatched || typeof window === "undefined") return;
  historyPatched = true;

  const originalPushState = window.history.pushState.bind(window.history);
  window.history.pushState = (...args: Parameters<typeof originalPushState>) => {
    const result = originalPushState(...args);
    window.requestAnimationFrame(onNavigationStart);
    return result;
  };

  const originalReplaceState = window.history.replaceState.bind(
    window.history
  );
  window.history.replaceState = (
    ...args: Parameters<typeof originalReplaceState>
  ) => {
    const result = originalReplaceState(...args);
    window.requestAnimationFrame(onNavigationStart);
    return result;
  };
}

export default function RouteProgressBar() {
  const pathname = usePathname();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const growIntervalRef = useRef<number | null>(null);
  const hideTimeoutRef = useRef<number | null>(null);
  const isFirstRender = useRef(true);

  useEffect(() => {
    function handleNavigationStart() {
      if (growIntervalRef.current) window.clearInterval(growIntervalRef.current);
      if (hideTimeoutRef.current) window.clearTimeout(hideTimeoutRef.current);

      setVisible(true);
      setProgress(15);

      growIntervalRef.current = window.setInterval(() => {
        setProgress((current) =>
          current >= 80 ? current : current + (80 - current) * 0.25
        );
      }, 150);
    }

    patchHistoryOnce(handleNavigationStart);
  }, []);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (growIntervalRef.current) {
      window.clearInterval(growIntervalRef.current);
      growIntervalRef.current = null;
    }

    setProgress(100);

    hideTimeoutRef.current = window.setTimeout(() => {
      setVisible(false);
      setProgress(0);
    }, 220);

    return () => {
      if (hideTimeoutRef.current) window.clearTimeout(hideTimeoutRef.current);
    };
  }, [pathname]);

  if (!visible) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-0 z-(--z-toast) h-0.5"
    >
      <div
        className="h-full bg-brand transition-[width,opacity] duration-200 ease-out"
        style={{
          width: `${progress}%`,
          opacity: progress >= 100 ? 0 : 1,
        }}
      />
    </div>
  );
}
