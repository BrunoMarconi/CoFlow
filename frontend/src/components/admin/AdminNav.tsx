"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, UsersRound } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/admin/users", label: "Personas", icon: Users },
  { href: "/admin/communities", label: "Comunidades", icon: UsersRound },
];

export default function AdminNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Administración" className="mb-5 flex gap-1 rounded-2xl border border-[#627D70]/10 bg-white/80 p-1.5 shadow-[0_8px_26px_rgba(61,84,74,0.08)] backdrop-blur sm:w-fit">
      {links.map(({ href, label, icon: Icon }) => {
        const active = pathname.startsWith(href);
        return (
          <Link key={href} href={href} aria-current={active ? "page" : undefined} className={cn("inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition sm:flex-none", active ? "bg-[#627D70] text-white" : "text-[#52655c] hover:bg-[#ecf1f1]") }>
            <Icon className="h-4 w-4" /> {label}
          </Link>
        );
      })}
    </nav>
  );
}
