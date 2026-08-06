"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import PageHeader from "@/components/ui/PageHeader";
import {
  BookmarkIcon,
  PlusIcon,
  KeyIcon,
  SettingsIcon,
  ChevronRightIcon,
  type IconProps,
} from "@/components/layout/NavIcons";

export default function MasPage() {
  const { community, ownerProfile } = useAuth();

  const items: {
    href: string;
    label: string;
    icon: (props: IconProps) => React.ReactElement;
  }[] = [
    { href: "/personas/guardadas", label: "Guardados", icon: BookmarkIcon },
    ...(!community
      ? [
          {
            href: "/crear/comunidad",
            label: "Crear comunidad",
            icon: PlusIcon,
          },
        ]
      : []),
    {
      href: ownerProfile ? "/propietarios" : "/propietarios/perfil",
      label: "Publicar un piso",
      icon: KeyIcon,
    },
    { href: "/ajustes", label: "Ajustes", icon: SettingsIcon },
  ];

  return (
    <div>
      <PageHeader title="Más" />

      <div className="mt-6 overflow-hidden rounded-18 border border-border bg-surface shadow-soft">
        {items.map((item, index) => {
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-4 transition-colors duration-180 hover:bg-surface-soft ${
                index > 0 ? "border-t border-border" : ""
              }`}
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-mint-50 text-primary-dark">
                <Icon className="h-5 w-5" />
              </span>

              <span className="min-w-0 flex-1 truncate text-sm font-bold text-foreground">
                {item.label}
              </span>

              <ChevronRightIcon className="h-5 w-5 shrink-0 text-muted" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
