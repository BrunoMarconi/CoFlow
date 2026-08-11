// Mapa compartido para <ViewTransition enter={...} exit={...}> en las
// páginas de mensajes: une la etiqueta que lleva cada <Link
// transitionTypes={[...]}> con el nombre de la animación CSS
// direccional definida en globals.css (.nav-forward / .nav-back).
// Nota: Personas<->Comunidades NO usa este mecanismo — ese par tiene
// su propio crossfade rápido en Framer Motion (ver AppShell), así que
// aquí se excluye explícitamente para no apilar las dos animaciones
// una encima de la otra en el mismo click.
export const NAV_TRANSITION = {
  "nav-forward": "nav-forward",
  "nav-back": "nav-back",
  default: "none",
} as const;

// Mismo orden que SwipeNavigation.tsx: las pestañas principales entre
// las que se puede deslizar con el dedo. Se reutiliza aquí para que
// tocar un icono de navegación (BottomNavigation/Sidebar) anime en la
// misma dirección que un swipe real — adelante si la pestaña de
// destino está más a la derecha, atrás si está más a la izquierda.
const TAB_ROUTES = ["/comunidades", "/usuarios", "/pisos", "/perfil"];

// Este par ya tiene su propio crossfade (AppShell) — no debe
// coger también el nav-forward/nav-back genérico.
const EXPLORER_PAIR = new Set(["/comunidades", "/usuarios"]);

export function getTabTransitionTypes(
  pathname: string,
  targetHref: string
): string[] | undefined {
  if (EXPLORER_PAIR.has(targetHref) && EXPLORER_PAIR.has(pathname)) {
    return undefined;
  }

  const currentIndex = TAB_ROUTES.findIndex((route) =>
    pathname.startsWith(route)
  );
  const targetIndex = TAB_ROUTES.indexOf(targetHref);

  if (
    currentIndex === -1 ||
    targetIndex === -1 ||
    currentIndex === targetIndex
  ) {
    return undefined;
  }

  return targetIndex > currentIndex ? ["nav-forward"] : ["nav-back"];
}
