"use client";

import { type ReactNode, ViewTransition } from "react";
import { EXPLORER_TRANSITION } from "@/lib/navTransition";

/** Boundary de View Transition anidado solo alrededor del grid de
 * resultados de Personas/Comunidades. Al quedar fuera del boundary
 * raíz de AppShell, el header y la SearchBar no reciben la animación
 * de agrupamiento/dispersión — permanecen aproximadamente estables
 * mientras solo las cards se encogen y funden (o viceversa). */
export default function ExplorerResultsTransition({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <ViewTransition
      enter={EXPLORER_TRANSITION}
      exit={EXPLORER_TRANSITION}
      default="none"
    >
      {children}
    </ViewTransition>
  );
}
