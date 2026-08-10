"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import Avatar from "@/components/ui/Avatar";
import Logo from "@/components/ui/Logo";
import {
  LogoutIcon,
  PlusIcon,
} from "@/components/layout/NavIcons";
import Icon3D from "@/components/layout/Icon3D";
import { getTabTransitionTypes } from "@/lib/navTransition";

type NavLink = {
  href: string;
  label: string;
  icon3d?: string;
};

export default function Sidebar() {
  const pathname = usePathname();
  const { user, community, ownerProfile, logout } = useAuth();

  const principalLinks: NavLink[] = [
    ...(community
      ? [
          {
            href: "/mi-comunidad",
            label: "Tu comunidad",
            icon3d: "/icons/3d/house.png",
          },
        ]
      : []),
    {
      href: "/comunidades",
      label: community ? "Explorar" : "Explorar comunidades",
      icon3d: "/icons/3d/compass.png",
    },
    {
      href: "/usuarios",
      label: "Personas",
      icon3d: "/icons/3d/busts-in-silhouette.png",
    },
    {
      href: "/mensajes",
      label: "Mensajes",
      icon3d: "/icons/3d/speech-balloon.png",
    },
    {
      href: "/personas/guardadas",
      label: "Guardados",
      icon3d: "/icons/3d/bookmark.png",
    },
    ...(!community
      ? [
          {
            href: "/crear/comunidad",
            label: "Crear comunidad",
          },
        ]
      : []),
  ];

  const accountLinks: NavLink[] = [
    {
      href: "/perfil",
      label: "Mi perfil",
      icon3d: "/icons/3d/bust-in-silhouette.png",
    },
    {
      href: ownerProfile ? "/propietarios" : "/propietarios/perfil",
      label: "Publicar un piso",
      icon3d: "/icons/3d/key.png",
    },
    {
      href: "/ajustes",
      label: "Ajustes",
      icon3d: "/icons/3d/gear.png",
    },
  ];

  function isActive(href: string) {
    if (href === "/mi-comunidad") return pathname.startsWith("/mi-comunidad");

    if (href === "/usuarios") {
      return (
        pathname.startsWith("/usuarios") ||
        (pathname.startsWith("/personas") &&
          !pathname.startsWith("/personas/guardadas"))
      );
    }

    if (href === "/comunidades") {
      return (
        pathname.startsWith("/comunidades") &&
        !pathname.startsWith("/mi-comunidad")
      );
    }

    return pathname.startsWith(href);
  }

  return (
    <aside
      className="fixed left-0 top-(--mobile-header-height) z-(--z-sticky-header) hidden h-[calc(100dvh-var(--mobile-header-height))] w-66 shrink-0 flex-col overflow-y-auto border-r border-border bg-surface/90 px-3 py-6 backdrop-blur-xl md:flex"
    >
      <Link
        href="/comunidades"
        className="mb-6 flex items-center gap-2.5 px-4"
        aria-label="CoFlow"
      >
        <Logo size="sm" />

        <span className="font-rounded text-xl font-semibold tracking-[-0.01em] text-brand-dark">
          CoFlow
        </span>
      </Link>

      <nav className="flex flex-1 flex-col gap-6">
        <NavGroup label="Principal">
          {principalLinks.map((link) => (
            <SidebarLink
              key={link.href}
              link={link}
              active={isActive(link.href)}
              transitionTypes={getTabTransitionTypes(pathname, link.href)}
            />
          ))}
        </NavGroup>

        <NavGroup label="Cuenta">
          {accountLinks.map((link) => (
            <SidebarLink
              key={link.href}
              link={link}
              active={isActive(link.href)}
              transitionTypes={getTabTransitionTypes(pathname, link.href)}
            />
          ))}
        </NavGroup>
      </nav>

      {user && (
        <div className="mt-4 flex items-center gap-2.5 rounded-14 bg-mint-50 p-2.5">
          <Link href="/perfil" className="flex min-w-0 flex-1 items-center gap-2.5">
            <Avatar
              name={`${user.first_name} ${user.last_name}`}
              imageUrl={user.avatar_url}
              size={34}
            />

            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-foreground">
                {user.first_name} {user.last_name}
              </p>
              <p className="truncate text-xs text-muted">
                {user.email}
              </p>
            </div>
          </Link>

          <button
            type="button"
            onClick={logout}
            aria-label="Cerrar sesión"
            title="Cerrar sesión"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-10 text-muted transition duration-180 hover:bg-white hover:text-red-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-400"
          >
            <LogoutIcon />
          </button>
        </div>
      )}
    </aside>
  );
}

function NavGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="px-4 text-xs font-bold uppercase tracking-[0.14em] text-muted">
        {label}
      </p>

      <div className="mt-2 flex flex-col gap-1">{children}</div>
    </div>
  );
}

function SidebarLink({
  link,
  active,
  transitionTypes,
}: {
  link: NavLink;
  active: boolean;
  transitionTypes?: string[];
}) {
  return (
    <Link
      href={link.href}
      aria-current={active ? "page" : undefined}
      transitionTypes={transitionTypes}
      className={cn(
        "flex items-center gap-3 rounded-10 px-3 py-2 text-sm font-semibold transition-colors duration-180 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
        active
          ? "bg-mint-50 text-primary-dark"
          : "text-muted hover:bg-surface-soft hover:text-foreground"
      )}
    >
      <span className="flex h-7 w-7 shrink-0 items-center justify-center">
        {link.icon3d ? (
          <Icon3D src={link.icon3d} active={active} size={26} />
        ) : (
          <PlusIcon
            className={cn(
              "h-5 w-5 shrink-0",
              active ? "text-primary" : "text-muted"
            )}
          />
        )}
      </span>
      <span className="truncate">{link.label}</span>
    </Link>
  );
}
