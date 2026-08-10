// Mapa compartido para <ViewTransition enter={...} exit={...}> en las
// páginas de mensajes: une la etiqueta que lleva cada <Link
// transitionTypes={[...]}> con el nombre de la animación CSS
// direccional definida en globals.css (.nav-forward / .nav-back).
export const NAV_TRANSITION = {
  "nav-forward": "nav-forward",
  "nav-back": "nav-back",
  default: "none",
} as const;
