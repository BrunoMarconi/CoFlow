import type { Metadata } from "next";
import ProtectedRoute from "@/components/layout/ProtectedRoute";
import AppShell from "@/components/layout/AppShell";
import MobileChromeProvider from "@/providers/MobileChromeProvider";
import OwnerModeProvider from "@/providers/OwnerModeProvider";

// Todo lo que cuelga de aquí requiere sesión iniciada (perfiles,
// comunidades, mensajes...) — nunca debe indexarse: un rastreador sin
// sesión solo vería la pantalla de carga o el redirect a /login, y
// eso es justo lo que estaba compitiendo con "/" en los resultados de
// búsqueda de Google.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ProtectedRoute>
      <MobileChromeProvider>
        <OwnerModeProvider>
          <AppShell>{children}</AppShell>
        </OwnerModeProvider>
      </MobileChromeProvider>
    </ProtectedRoute>
  );
}
