"use client";

import { useState, type ReactNode } from "react";
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
 * de modo que nunca quede una foto atascada en opacidad cero.
 *
 * El fallo se gestiona aquí dentro y no en cada sitio que use el
 * componente: como la opacidad arranca en cero y solo sube con onLoad,
 * una imagen que no carga se quedaba invisible para siempre — un hueco
 * en blanco, sin foto y sin alternativa. Quien lo use puede pasar
 * `fallback`; si no, al menos deja de ocupar el sitio en silencio. */
export default function FadeImage({
  className,
  onLoad,
  onError,
  fallback = null,
  // Se desestructura para pasarlo explícito: el tipo ya lo exige, pero
  // dentro del spread la regla de accesibilidad no llega a verlo.
  alt,
  ...props
}: ImageProps & { fallback?: ReactNode }) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [renderedSrc, setRenderedSrc] = useState(props.src);

  // Cambiar de src es empezar de cero: sin esto, una foto que falló una
  // vez dejaría el componente marcado como roto aunque después se suba
  // otra distinta (justo lo que pasa al cambiar de avatar).
  if (renderedSrc !== props.src) {
    setRenderedSrc(props.src);
    setLoaded(false);
    setFailed(false);
  }

  if (failed) return <>{fallback}</>;

  return (
    <Image
      {...props}
      alt={alt}
      ref={(node) => {
        // `complete` también vale true para una imagen que ha fallado;
        // naturalWidth es lo que distingue los dos casos. Sin esa
        // comprobación, una rota que ya estuviera en caché se daría por
        // cargada y se quedaría ocupando el hueco, vacía.
        if (node?.complete && node.naturalWidth > 0) setLoaded(true);
      }}
      onLoad={(event) => {
        setLoaded(true);
        onLoad?.(event);
      }}
      onError={(event) => {
        setFailed(true);
        onError?.(event);
      }}
      className={cn(
        "transition-opacity duration-500 ease-out",
        loaded ? "opacity-100" : "opacity-0",
        className
      )}
    />
  );
}
