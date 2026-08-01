import ProtectedRoute from "@/components/layout/ProtectedRoute";
import AppShell from "@/components/layout/AppShell";
import MobileChromeProvider from "@/providers/MobileChromeProvider";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ProtectedRoute>
      <MobileChromeProvider>
        <AppShell>{children}</AppShell>
      </MobileChromeProvider>
    </ProtectedRoute>
  );
}
