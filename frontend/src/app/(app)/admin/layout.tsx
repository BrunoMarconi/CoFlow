import type { ReactNode } from "react";
import TeamGate from "@/components/equipo/TeamGate";
import AdminNav from "@/components/admin/AdminNav";

export const dynamic = "force-dynamic";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <TeamGate>
      <div className="-mx-6 -mt-4 min-h-[calc(100dvh-9rem)] bg-[#f6fdfc] px-4 pb-12 pt-5 sm:mx-0 sm:mt-0 sm:min-h-0 sm:rounded-[32px] sm:px-7 sm:py-7 lg:px-8">
        <AdminNav />
        {children}
      </div>
    </TeamGate>
  );
}
