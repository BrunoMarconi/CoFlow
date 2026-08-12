"use client";

import { useContext } from "react";
import { OwnerModeContext } from "@/providers/OwnerModeProvider";

export function useOwnerMode() {
  const context = useContext(OwnerModeContext);

  if (!context) {
    throw new Error("useOwnerMode debe usarse dentro de <OwnerModeProvider>");
  }

  return context;
}
