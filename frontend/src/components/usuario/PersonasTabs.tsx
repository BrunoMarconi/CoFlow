"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/usuarios", label: "Descubrir" },
  { href: "/personas/guardadas", label: "Guardados" },
  { href: "/conexiones", label: "Conexiones" },
];

export default function PersonasTabs() {
  const pathname = usePathname();

  return (
    <div
      role="tablist"
      aria-label="Secciones de personas"
      className="flex gap-5 overflow-x-auto border-b border-line [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {TABS.map((tab) => {
        const active =
          tab.href === "/usuarios"
            ? pathname === "/usuarios"
            : pathname.startsWith(tab.href);

        return (
          <Link
            key={tab.href}
            href={tab.href}
            role="tab"
            aria-selected={active}
            className={`flex h-11 shrink-0 items-center whitespace-nowrap border-b-2 px-1 text-sm font-bold transition ${
              active
                ? "border-brand text-brand-dark"
                : "border-transparent text-muted hover:text-foreground"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
