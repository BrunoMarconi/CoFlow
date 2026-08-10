"use client";

import { useEffect, useState } from "react";

/** true/false tras hidratar en cliente; false durante el render en
 * servidor (no hay forma honesta de saberlo antes del primer paint). */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(
    () => typeof window !== "undefined" && window.matchMedia(query).matches
  );

  useEffect(() => {
    const mediaQueryList = window.matchMedia(query);
    // Resincroniza si `query` cambia entre renders (el valor inicial de
    // useState solo se evalúa una vez); el listener de abajo cubre los
    // cambios de tamaño de ventana con la query ya fijada.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMatches(mediaQueryList.matches);

    function handleChange(event: MediaQueryListEvent) {
      setMatches(event.matches);
    }

    mediaQueryList.addEventListener("change", handleChange);
    return () => mediaQueryList.removeEventListener("change", handleChange);
  }, [query]);

  return matches;
}
