import ProtectedRoute from "@/components/layout/ProtectedRoute";
import AppShell from "@/components/layout/AppShell";
import MobileChromeProvider from "@/providers/MobileChromeProvider";
import OwnerModeProvider from "@/providers/OwnerModeProvider";

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
