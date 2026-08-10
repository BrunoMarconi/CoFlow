// Mapa compartido para <ViewTransition enter={...} exit={...}> en las
// páginas de mensajes: une la etiqueta que lleva cada <Link
// transitionTypes={[...]}> con el nombre de la animación CSS
// direccional definida en globals.css (.nav-forward / .nav-back).
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

export function getTabTransitionTypes(
  pathname: string,
  targetHref: string
): string[] | undefined {
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
