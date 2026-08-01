"use client";

import { useEffect, useState } from "react";

// Umbral en píxeles: si el viewport visual se reduce más que esto
// respecto a la altura del layout, asumimos que el teclado virtual
// está abierto. No se usa userAgent en ningún momento.
const KEYBOARD_HEIGHT_THRESHOLD_PX = 150;

export function useKeyboardVisible(): boolean {
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    const visualViewport = window.visualViewport;

    if (!visualViewport) return;

    function handleResize() {
      const viewport = window.visualViewport;
      if (!viewport) return;

      const heightDiff = window.innerHeight - viewport.height;
      setIsKeyboardVisible(heightDiff > KEYBOARD_HEIGHT_THRESHOLD_PX);
    }

    handleResize();

    visualViewport.addEventListener("resize", handleResize);
    visualViewport.addEventListener("scroll", handleResize);

    return () => {
      visualViewport.removeEventListener("resize", handleResize);
      visualViewport.removeEventListener("scroll", handleResize);
    };
  }, []);

  return isKeyboardVisible;
}
