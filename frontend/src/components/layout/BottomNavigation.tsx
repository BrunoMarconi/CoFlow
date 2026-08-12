"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useMobileChrome } from "@/providers/MobileChromeProvider";
import { useKeyboardVisible } from "@/hooks/useKeyboardVisible";
import { useAuth } from "@/hooks/useAuth";
import { useOwnerMode } from "@/hooks/useOwnerMode";
import { getTabTransitionTypes } from "@/lib/navTransition";
import {
  CompassIcon,
  UsersIcon,
  MessageIcon,
  ProfileIcon,
  HomeIcon,
  KeyIcon,
  PlusIcon,
  type IconProps,
} from "@/components/layout/NavIcons";

type NavigationLink = {
  href: string;
  label: string;
  icon: (props: IconProps) => React.ReactElement;
  isActive: (pathname: string) => boolean;
};

const MEMBER_LINKS: NavigationLink[] = [
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
    isActive: (pathname) =>
      pathname.startsWith("/perfil") || pathname.startsWith("/notificaciones") || pathname.startsWith("/invitaciones") || pathname.startsWith("/ayuda"),
  },
];

const OWNER_LINKS: NavigationLink[] = [
  {
    href: "/propietarios",
    label: "Resumen",
    icon: HomeIcon,
    isActive: (pathname) => pathname === "/propietarios",
  },
  {
    href: "/propietarios/pisos",
    label: "Mis pisos",
    icon: KeyIcon,
    isActive: (pathname) =>
      pathname.startsWith("/propietarios/pisos") &&
      !pathname.startsWith("/propietarios/pisos/nuevo"),
  },
  {
    href: "/propietarios/pisos/nuevo",
    label: "Añadir",
    icon: PlusIcon,
    isActive: (pathname) => pathname.startsWith("/propietarios/pisos/nuevo"),
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
];

export default function BottomNavigation() {
  const pathname = usePathname();
  const { isChatActive } = useMobileChrome();
  const { hasUnreadMessages } = useAuth();
  const { isOwnerMode } = useOwnerMode();
  const isKeyboardVisible = useKeyboardVisible();
  const links = isOwnerMode ? OWNER_LINKS : MEMBER_LINKS;

  // Nunca debe competir con el compositor de un chat activo ni con el
  // teclado virtual abierto en cualquier formulario.
  if (isChatActive || isKeyboardVisible) return null;

  return (
    <nav
      aria-label="Navegación principal"
      className="fixed inset-x-0 bottom-0 z-(--z-bottom-nav) border-t border-border bg-surface pb-(--safe-bottom) md:hidden"
    >
      <div className="mx-auto flex h-20 max-w-lg items-stretch px-2">
        {links.map((link) => (
          <BottomNavLink
            key={link.href}
            link={link}
            active={link.isActive(pathname)}
            transitionTypes={getTabTransitionTypes(pathname, link.href)}
            showUnreadDot={link.href === "/mensajes" && hasUnreadMessages}
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
}: {
  link: NavigationLink;
  active: boolean;
  transitionTypes?: string[];
  showUnreadDot: boolean;
}) {
  const Icon = link.icon;

  return (
    <Link
      href={link.href}
      aria-current={active ? "page" : undefined}
      transitionTypes={transitionTypes}
      className="relative flex flex-1 flex-col items-center justify-center gap-1 px-2 transition active:scale-95 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand"
    >
      <span className="relative">
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
      </span>

      <span
        className={cn(
          "text-[11px] leading-none",
          active ? "font-bold text-brand-dark" : "font-semibold text-muted"
        )}
      >
        {link.label}
      </span>
    </Link>
  );
}
