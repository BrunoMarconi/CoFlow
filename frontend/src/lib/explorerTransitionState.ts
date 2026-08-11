export type ExplorerDirection = "group" | "spread" | null;

// Módulo singleton (no React) para pasar la dirección de "llegada" de
// una página del explorador a la siguiente durante una navegación
// dura: Next no destruye el runtime JS entre rutas de la misma app
// (solo desmonta el árbol de React), así que una variable de módulo
// sobrevive perfectamente el tiempo que tarda en montarse la página
// destino, sin necesidad de sessionStorage ni parámetros de URL.
let arrivingDirection: ExplorerDirection = null;

export function setArrivingDirection(direction: ExplorerDirection) {
  arrivingDirection = direction;
}

/** Se lee una sola vez, al montar el grid destino, y se limpia acto
 * seguido — una visita normal (recarga, enlace directo) no debe
 * heredar la animación de una navegación anterior. */
export function consumeArrivingDirection(): ExplorerDirection {
  const value = arrivingDirection;
  arrivingDirection = null;
  return value;
}
