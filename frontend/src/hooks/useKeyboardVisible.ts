"use client";

import { useEffect, useState } from "react";

// Umbral en píxeles: si el viewport visual se reduce más que esto
// respecto a la altura del layout, asumimos que el teclado virtual
// está abierto. No se usa userAgent en ningún momento.
const KEYBOARD_HEIGHT_THRESHOLD_PX = 150;

function isTextInputFocused() {
  const element = document.activeElement;
  if (!element) return false;

  const tag = element.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    (element as HTMLElement).isContentEditable
  );
}

export function useKeyboardVisible(): boolean {
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    const visualViewport = window.visualViewport;

    if (!visualViewport) return;

    function handleChange() {
      const viewport = window.visualViewport;
      if (!viewport) return;

      // La barra de direcciones/toolbar del navegador móvil también
      // reduce visualViewport.height al aparecer durante el scroll,
      // sin que haya teclado — por eso no basta con el umbral de
      // altura: solo se considera "teclado visible" si además hay un
      // campo de texto realmente enfocado en ese momento. Sin esta
      // comprobación, la barra inferior podía desaparecer al hacer
      // scroll aunque no hubiera ningún input activo.
      const heightDiff = window.innerHeight - viewport.height;
      setIsKeyboardVisible(
        heightDiff > KEYBOARD_HEIGHT_THRESHOLD_PX && isTextInputFocused()
      );
    }

    function handleFocusOut() {
      // Al perder el foco, el viewport puede tardar en redimensionarse
      // de vuelta; reevaluamos en el siguiente tick para no dejar la
      // barra oculta con un input que ya no está enfocado.
      requestAnimationFrame(handleChange);
    }

    handleChange();

    visualViewport.addEventListener("resize", handleChange);
    visualViewport.addEventListener("scroll", handleChange);
    document.addEventListener("focusout", handleFocusOut);

    return () => {
      visualViewport.removeEventListener("resize", handleChange);
      visualViewport.removeEventListener("scroll", handleChange);
      document.removeEventListener("focusout", handleFocusOut);
    };
  }, []);

  return isKeyboardVisible;
}
