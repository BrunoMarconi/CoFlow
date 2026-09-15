import type { ReactNode } from "react";
import TeamGate from "@/components/equipo/TeamGate";

// Igual que /propietarios: todo depende de la sesión resuelta en cliente,
// así que no debe pre-renderizarse como contenido estático.
export const dynamic = "force-dynamic";

export default function EquipoLayout({ children }: { children: ReactNode }) {
  return <TeamGate>{children}</TeamGate>;
}
