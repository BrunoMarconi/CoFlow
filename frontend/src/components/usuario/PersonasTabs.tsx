"use client";

import { usePathname } from "next/navigation";
import Tabs from "@/components/ui/Tabs";

const TAB_DEFS = [
  { href: "/usuarios", label: "Descubrir" },
  { href: "/personas/guardadas", label: "Guardados" },
  { href: "/conexiones", label: "Conexiones" },
];

export default function PersonasTabs() {
  const pathname = usePathname();

  const items = TAB_DEFS.map((tab) => ({
    key: tab.href,
    label: tab.label,
    href: tab.href,
    active:
      tab.href === "/usuarios"
        ? pathname === "/usuarios"
        : pathname.startsWith(tab.href),
  }));

  return <Tabs items={items} aria-label="Secciones de personas" />;
}
