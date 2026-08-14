import type { ReactNode } from "react";

// Todas las páginas de propietarios dependen de sesión/estado de usuario
// resuelto en cliente (useAuth, useOwnerMode). Sin esto, Next.js podía
// pre-renderizar estáticamente el hueco de carga (loading.tsx) como si
// fuera el contenido final, dejando la pantalla en blanco en producción
// hasta que el usuario recargaba en el momento justo.
export const dynamic = "force-dynamic";

export default function PropietariosLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
