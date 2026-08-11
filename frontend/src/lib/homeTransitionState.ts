// Mismo patrón que explorerTransitionState.ts: un singleton de módulo
// (no React) para decirle a la página destino, justo al montar, que
// llegó a través del "portal" de la casita — sobrevive la navegación
// porque Next no destruye el runtime JS entre rutas, solo desmonta el
// árbol de React.
let arrivingHome = false;

export function setArrivingHome() {
  arrivingHome = true;
}

/** Se lee una sola vez, al montar la página destino, y se limpia acto
 * seguido — una visita normal (recarga, enlace directo, navegación
 * desde cualquier otro sitio) no debe heredar la animación. */
export function consumeArrivingHome(): boolean {
  const value = arrivingHome;
  arrivingHome = false;
  return value;
}
