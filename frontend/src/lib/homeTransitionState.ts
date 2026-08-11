export type HomeDirection = "enter" | "exit" | null;

// Mismo patrón que explorerTransitionState.ts: un singleton de módulo
// (no React) para decirle a AppShell, justo cuando cambia la ruta,
// con qué dirección llegó — sobrevive la navegación porque Next no
// destruye el runtime JS entre rutas, solo desmonta el árbol de React.
//
// "enter": se entró a Tu Comunidad (la nueva pantalla llega desde
// arriba). "exit": se salió de Tu Comunidad de vuelta a otra pantalla
// (la nueva pantalla llega desde abajo).
let arrivingDirection: HomeDirection = null;

export function setArrivingHomeDirection(direction: HomeDirection) {
  arrivingDirection = direction;
}

/** Se lee una sola vez, justo cuando AppShell detecta el cambio de
 * ruta, y se limpia acto seguido — una navegación normal (no
 * relacionada con la casita) no debe heredar ninguna animación. */
export function consumeArrivingHomeDirection(): HomeDirection {
  const value = arrivingDirection;
  arrivingDirection = null;
  return value;
}
