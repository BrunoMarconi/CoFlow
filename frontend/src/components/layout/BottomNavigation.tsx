"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  CompassIcon,
  HomeIcon,
  UsersIcon,
  type IconProps,
} from "@/components/layout/NavIcons";

const LINKS: {
  href: string;
  label: string;
  icon: (props: IconProps) => React.ReactElement;
}[] = [
  { href: "/mi-comunidad", label: "Tu comunidad", icon: HomeIcon },
  { href: "/comunidades", label: "Explorar", icon: CompassIcon },
  { href: "/usuarios", label: "Personas", icon: UsersIcon },
];

export default function BottomNavigation() {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/comunidades") {
      return (
        pathname.startsWith("/comunidades") &&
        !pathname.startsWith("/mi-comunidad")
      );
    }

    return pathname.startsWith(href);
  }

  return (
    <nav
      aria-label="Navegación principal"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] shadow-[0_-2px_10px_rgba(18,56,44,0.06)] md:hidden"
    >
      <div className="mx-auto flex max-w-md items-stretch">
        {LINKS.map((link) => {
          const active = isActive(link.href);
          const Icon = link.icon;

          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 px-2 py-2 transition active:scale-95 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand",
                active ? "text-brand-dark" : "text-muted hover:text-foreground"
              )}
            >
              <Icon
                className={cn(
                  "h-5 w-5 shrink-0",
                  active ? "text-brand" : "text-muted"
                )}
              />

              <span
                className={cn(
                  "text-[11px] leading-none",
                  active ? "font-bold" : "font-semibold"
                )}
              >
                {link.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
