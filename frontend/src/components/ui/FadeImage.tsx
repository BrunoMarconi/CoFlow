"use client";

import { useState } from "react";
import Image, { type ImageProps } from "next/image";
import { cn } from "@/lib/utils";

/* next/image con entrada suave: la foto se funde al terminar de cargar
 * en vez de aparecer de golpe sobre el hueco vacío.
 *
 * El fade se ata a onLoad y no a una animación CSS al montar, que es la
 * versión fácil y equivocada: con una conexión lenta la animación habría
 * terminado mucho antes de que hubiera píxeles que mostrar.
 *
 * Una imagen servida desde la caché puede cargar antes de que React
 * llegue a montar el nodo; para esas, `onLoad` sí se dispara igualmente
 * en React, pero además se comprueba `complete` al montar por si acaso,
 * de modo que nunca quede una foto atascada en opacidad cero. */
export default function FadeImage({
  className,
  onLoad,
  // Se desestructura para pasarlo explícito: el tipo ya lo exige, pero
  // dentro del spread la regla de accesibilidad no llega a verlo.
  alt,
  ...props
}: ImageProps) {
  const [loaded, setLoaded] = useState(false);

  return (
    <Image
      {...props}
      alt={alt}
      ref={(node) => {
        if (node?.complete) setLoaded(true);
      }}
      onLoad={(event) => {
        setLoaded(true);
        onLoad?.(event);
      }}
      className={cn(
        "transition-opacity duration-500 ease-out",
        loaded ? "opacity-100" : "opacity-0",
        className
      )}
    />
  );
}
