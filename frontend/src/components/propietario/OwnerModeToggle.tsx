"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { Building2 } from "lucide-react";
import { useOwnerMode } from "@/hooks/useOwnerMode";
import { useAuth } from "@/hooks/useAuth";
import ViewportPortal from "@/components/ui/ViewportPortal";

export default function OwnerModeToggle() {
  const { ownerProfile, ownerProfileLoading } = useAuth();
  const { isOwnerMode, requestModeSwitch } = useOwnerMode();
  const visible = !ownerProfileLoading && Boolean(ownerProfile) && !isOwnerMode;

  /* Mientras la barra está en pantalla marca el <body>, y el shell le
   * reserva su altura por debajo del contenido (ver globals.css). Sin
   * esto, la barra —que es opaca, fija y de ancho completo en móvil—
   * tapaba de forma permanente la última fila del perfil: no había
   * ningún punto de scroll desde el que llegar a leerla.
   *
   * Mismo mecanismo que `data-sheet-open`, que ya se usa para apartar
   * la app cuando se abre un sheet. */
  useEffect(() => {
    if (!visible) return;

    document.body.dataset.ownerToggle = "true";
    return () => {
      delete document.body.dataset.ownerToggle;
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <ViewportPortal>
      <motion.button
        type="button"
        onClick={() => requestModeSwitch("owner")}
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.97 }}
        /* Negro puro (y su hover #282828) en una app cuyo tono más
         * oscuro es un verde: era el único elemento del sistema con un
         * color que no salía de la guía. Ahora usa --brand-dark, y en
         * vez de ser una placa opaca es material translúcido, como la
         * barra inferior — el contenido se ve pasar por debajo, que es
         * lo que hace que se lea como algo que flota sobre la pantalla
         * y no como un agujero recortado en ella. */
        className="material-chrome fixed bottom-[calc(var(--mobile-bottom-nav-height)+var(--safe-bottom)+0.75rem)] left-5 right-5 z-30 mx-auto flex h-14 max-w-lg items-center justify-center gap-2 rounded-full border border-white/10 bg-brand-dark/90 px-6 text-sm font-semibold text-white shadow-overlay backdrop-blur-xl backdrop-saturate-150 transition-colors hover:bg-brand-dark focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-brand-dark sm:bottom-7 sm:left-auto sm:right-8 md:right-10"
        aria-label="Gestionar mis pisos"
      >
        <Building2 className="h-5 w-5" />
        Gestionar mis pisos
      </motion.button>
    </ViewportPortal>
  );
}
