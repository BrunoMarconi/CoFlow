import ProtectedRoute from "@/components/layout/ProtectedRoute";
import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";
import BottomNavigation from "@/components/layout/BottomNavigation";
import SwipeNavigation from "@/components/layout/SwipeNavigation";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ProtectedRoute>
      <div className="min-h-dvh bg-[var(--background)]">
        <Navbar />

        <div className="mx-auto flex w-full max-w-[1600px]">
          <Sidebar />

          <main className="min-w-0 flex-1 overflow-x-hidden pb-28 md:pb-8">
            <div className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8">
              <SwipeNavigation>
                {children}
              </SwipeNavigation>
            </div>
          </main>
        </div>

        <BottomNavigation />
      </div>
    </ProtectedRoute>
  );
}