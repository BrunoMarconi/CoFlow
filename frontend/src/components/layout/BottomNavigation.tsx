"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { MOTION_SPRING } from "@/lib/motionTokens";
import { useMobileChrome } from "@/providers/MobileChromeProvider";
import { useKeyboardVisible } from "@/hooks/useKeyboardVisible";
import { getNotifications } from "@/services/notifications";
import { getTabTransitionTypes } from "@/lib/navTransition";
import { useExplorerLinkClick } from "@/components/explorer/useExplorerLinkClick";
import { useHomeAwareLinkClick } from "@/hooks/useHomeAwareLinkClick";
import {
  CompassIcon,
  UsersIcon,
  MessageIcon,
  ProfileIcon,
  MoreIcon,
  type IconProps,
} from "@/components/layout/NavIcons";

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
  icon: (props: IconProps) => React.ReactElement;
  isActive: (pathname: string) => boolean;
}[] = [
  {
    href: "/comunidades",
    label: "Explorar",
    icon: CompassIcon,
    isActive: (pathname) =>
      pathname.startsWith("/comunidades") || pathname.startsWith("/mi-comunidad"),
  },
  {
    href: "/usuarios",
    label: "Personas",
    icon: UsersIcon,
    isActive: (pathname) =>
      pathname.startsWith("/usuarios") ||
      (pathname.startsWith("/personas") &&
        !pathname.startsWith("/personas/guardadas")),
  },
  {
    href: "/mensajes",
    label: "Mensajes",
    icon: MessageIcon,
    isActive: (pathname) => pathname.startsWith("/mensajes"),
  },
  {
    href: "/perfil",
    label: "Perfil",
    icon: ProfileIcon,
    isActive: (pathname) => pathname.startsWith("/perfil"),
  },
  {
    href: "/mas",
    label: "Más",
    icon: MoreIcon,
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
      className="fixed inset-x-0 bottom-0 z-(--z-bottom-nav) border-t border-border bg-surface pb-(--safe-bottom) md:hidden"
    >
      <div className="mx-auto flex h-20 max-w-md items-stretch">
        {LINKS.map((link) => (
          <BottomNavLink
            key={link.href}
            link={link}
            active={link.isActive(pathname)}
            transitionTypes={getTabTransitionTypes(pathname, link.href)}
            showUnreadDot={link.href === "/mensajes" && hasUnreadMessages}
            isSectionLink={link.href === "/comunidades" || link.href === "/usuarios"}
          />
        ))}
      </div>
    </nav>
  );
}

function BottomNavLink({
  link,
  active,
  transitionTypes,
  showUnreadDot,
  isSectionLink = false,
}: {
  link: (typeof LINKS)[number];
  active: boolean;
  transitionTypes?: string[];
  showUnreadDot: boolean;
  /** Solo Personas/Comunidades comparten el indicador con layoutId —
   * señal de arranque de la transición "agrupar/abrir". */
  isSectionLink?: boolean;
}) {
  const Icon = link.icon;
  const explorerClick = useExplorerLinkClick(link.href);
  const homeClick = useHomeAwareLinkClick(link.href);

  function handleClick(event: React.MouseEvent<HTMLAnchorElement>) {
    explorerClick(event);
    homeClick(event);
  }

  return (
    <Link
      href={link.href}
      aria-current={active ? "page" : undefined}
      transitionTypes={transitionTypes}
      onClick={handleClick}
      className="relative flex flex-1 flex-col items-center justify-center gap-1 px-1 transition active:scale-95 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand"
    >
      <motion.span
        whileTap={isSectionLink ? { scale: 0.96 } : undefined}
        className="relative"
      >
        <Icon
          className={cn(
            "h-7 w-7 shrink-0",
            active ? "text-brand-dark" : "text-muted"
          )}
        />

        {showUnreadDot && (
          <span
            aria-hidden="true"
            className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-primary ring-2 ring-white/80"
          />
        )}
      </motion.span>

      <span
        className={cn(
          "text-[11px] leading-none",
          active ? "font-bold text-brand-dark" : "font-semibold text-muted"
        )}
      >
        {link.label}
      </span>

      {isSectionLink && active && (
        <motion.span
          layoutId="section-indicator-mobile"
          transition={MOTION_SPRING.gentle}
          className="absolute bottom-1.5 h-1 w-5 rounded-full bg-brand-dark"
        />
      )}
    </Link>
  );
}
