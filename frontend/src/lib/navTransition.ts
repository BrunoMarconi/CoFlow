// Mapa compartido para <ViewTransition enter={...} exit={...}> en las
// páginas de mensajes: une la etiqueta que lleva cada <Link
// transitionTypes={[...]}> con el nombre de la animación CSS
// direccional definida en globals.css (.nav-forward / .nav-back).
export const NAV_TRANSITION = {
  "nav-forward": "nav-forward",
  "nav-back": "nav-back",
  default: "none",
} as const;

// Mapa para el <ViewTransition> anidado solo alrededor del grid de
// resultados de Personas/Comunidades (ver ExplorerResultsTransition):
// el resto de la página (header, SearchBar) queda fuera de este
// boundary y usa el crossfade por defecto del navegador, "aproximadamente
// estable" como pide la interacción conceptual personas<->comunidades.
export const EXPLORER_TRANSITION = {
  "explorer-forward": "explorer-forward",
  "explorer-back": "explorer-back",
  default: "none",
} as const;

// Mismo orden que SwipeNavigation.tsx: las pestañas principales entre
// las que se puede deslizar con el dedo. Se reutiliza aquí para que
// tocar un icono de navegación (BottomNavigation/Sidebar) anime en la
// misma dirección que un swipe real — adelante si la pestaña de
// destino está más a la derecha, atrás si está más a la izquierda.
const TAB_ROUTES = ["/comunidades", "/usuarios", "/pisos", "/perfil"];

// El único par de pestañas con una transición conceptual propia
// (agrupamiento/dispersión) en vez del slide genérico.
const EXPLORER_ROUTES = new Set(["/comunidades", "/usuarios"]);

function getExplorerTransitionTypes(
  pathname: string,
  targetHref: string
): string[] | undefined {
  if (!EXPLORER_ROUTES.has(targetHref)) return undefined;

  const currentRoute = TAB_ROUTES.find((route) => pathname.startsWith(route));

  if (
    !currentRoute ||
    !EXPLORER_ROUTES.has(currentRoute) ||
    currentRoute === targetHref
  ) {
    return undefined;
  }

  // Comunidades = "agrupamiento" (personas -> comunidades), Personas =
  // "dispersión" (comunidades -> personas), independientemente del
  // orden en TAB_ROUTES.
  return targetHref === "/comunidades"
    ? ["explorer-forward"]
    : ["explorer-back"];
}

export function getTabTransitionTypes(
  pathname: string,
  targetHref: string
): string[] | undefined {
  const explorerTypes = getExplorerTransitionTypes(pathname, targetHref);
  if (explorerTypes) return explorerTypes;

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
