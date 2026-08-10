"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useMobileChrome } from "@/providers/MobileChromeProvider";
import { useKeyboardVisible } from "@/hooks/useKeyboardVisible";
import { getNotifications } from "@/services/notifications";
import { getTabTransitionTypes } from "@/lib/navTransition";
import { MoreIcon } from "@/components/layout/NavIcons";
import Icon3D from "@/components/layout/Icon3D";

const SECONDARY_PREFIXES = [
  "/mas",
  "/personas/guardadas",
  "/crear/comunidad",
  "/propietarios",
  "/ajustes",
];

const LINKS: {
  href: string;
  label: string;
  icon3d?: string;
  isActive: (pathname: string) => boolean;
}[] = [
  {
    href: "/comunidades",
    label: "Explorar",
    icon3d: "/icons/3d/compass.png",
    isActive: (pathname) =>
      pathname.startsWith("/comunidades") || pathname.startsWith("/mi-comunidad"),
  },
  {
    href: "/usuarios",
    label: "Personas",
    icon3d: "/icons/3d/busts-in-silhouette.png",
    isActive: (pathname) =>
      pathname.startsWith("/usuarios") ||
      (pathname.startsWith("/personas") &&
        !pathname.startsWith("/personas/guardadas")),
  },
  {
    href: "/mensajes",
    label: "Mensajes",
    icon3d: "/icons/3d/speech-balloon.png",
    isActive: (pathname) => pathname.startsWith("/mensajes"),
  },
  {
    href: "/perfil",
    label: "Perfil",
    icon3d: "/icons/3d/bust-in-silhouette.png",
    isActive: (pathname) => pathname.startsWith("/perfil"),
  },
  {
    href: "/mas",
    label: "Más",
    isActive: (pathname) =>
      SECONDARY_PREFIXES.some((prefix) => pathname.startsWith(prefix)),
  },
];

export default function BottomNavigation() {
  const pathname = usePathname();
  const { isChatActive } = useMobileChrome();
  const isKeyboardVisible = useKeyboardVisible();

  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);

  useEffect(() => {
    let active = true;

    getNotifications({ limit: 20 })
      .then((data) => {
        if (!active) return;

        setHasUnreadMessages(
          data.some(
            (item) => item.type === "PRIVATE_MESSAGE_RECEIVED" && !item.is_read
          )
        );
      })
      .catch(() => {
        // Sin indicador si falla; no mostramos un dato inventado.
      });

    return () => {
      active = false;
    };
  }, []);

  // Nunca debe competir con el compositor de un chat activo ni con el
  // teclado virtual abierto en cualquier formulario.
  if (isChatActive || isKeyboardVisible) return null;

  return (
    <nav
      aria-label="Navegación principal"
      className="fixed inset-x-4 bottom-[18px] z-(--z-bottom-nav) md:hidden"
    >
      <div className="nav-glass mx-auto flex h-16 max-w-md items-stretch rounded-full">
        {LINKS.map((link) => {
          const active = link.isActive(pathname);

          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={active ? "page" : undefined}
              transitionTypes={getTabTransitionTypes(pathname, link.href)}
              className="relative flex flex-1 flex-col items-center justify-center gap-0.5 px-1 transition active:scale-95 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand"
            >
              <span className="relative flex h-7 w-7 items-center justify-center">
                {link.icon3d ? (
                  <Icon3D src={link.icon3d} active={active} size={26} />
                ) : (
                  <MoreIcon
                    className={cn(
                      "h-5 w-5 shrink-0",
                      active ? "text-brand-dark" : "text-muted"
                    )}
                  />
                )}

                {link.href === "/mensajes" && hasUnreadMessages && (
                  <span
                    aria-hidden="true"
                    className="absolute right-0 top-0 h-2 w-2 rounded-full bg-primary ring-2 ring-white/80"
                  />
                )}
              </span>

              <span
                className={cn(
                  "text-[10px] leading-none",
                  active ? "font-bold text-brand-dark" : "font-semibold text-muted"
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
