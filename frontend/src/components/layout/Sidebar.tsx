"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import Avatar from "@/components/ui/Avatar";
import Logo from "@/components/ui/Logo";
import {
  BookmarkIcon,
  CompassIcon,
  KeyIcon,
  LogoutIcon,
  MessageIcon,
  PlusIcon,
  ProfileIcon,
  SettingsIcon,
  UsersIcon,
  HomeIcon,
  type IconProps,
} from "@/components/layout/NavIcons";

type NavLink = {
  href: string;
  label: string;
  icon: (props: IconProps) => React.ReactElement;
};

export default function Sidebar() {
  const pathname = usePathname();
  const { user, community, ownerProfile, logout } = useAuth();

  const principalLinks: NavLink[] = [
    ...(community
      ? [{ href: "/mi-comunidad", label: "Tu comunidad", icon: HomeIcon }]
      : []),
    {
      href: "/comunidades",
      label: community ? "Explorar" : "Explorar comunidades",
      icon: CompassIcon,
    },
    { href: "/usuarios", label: "Personas", icon: UsersIcon },
    { href: "/mensajes", label: "Mensajes", icon: MessageIcon },
    {
      href: "/personas/guardadas",
      label: "Guardados",
      icon: BookmarkIcon,
    },
    ...(!community
      ? [
          {
            href: "/crear/comunidad",
            label: "Crear comunidad",
            icon: PlusIcon,
          },
        ]
      : []),
  ];

  const accountLinks: NavLink[] = [
    { href: "/perfil", label: "Mi perfil", icon: ProfileIcon },
    {
      href: ownerProfile ? "/propietarios" : "/propietarios/perfil",
      label: "Publicar un piso",
      icon: KeyIcon,
    },
    { href: "/ajustes", label: "Ajustes", icon: SettingsIcon },
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
      className="fixed top-(--mobile-header-height) z-(--z-sticky-header) hidden h-[calc(100dvh-var(--mobile-header-height))] w-66 shrink-0 flex-col overflow-y-auto border-r border-border bg-surface/90 px-3 py-6 backdrop-blur-xl md:flex"
      style={{ left: "max(0px, calc((100vw - 1600px) / 2))" }}
    >
      <Link
        href="/comunidades"
        className="mb-6 flex items-center gap-2.5 px-4"
        aria-label="CoFlow"
      >
        <Logo size="sm" />

        <span className="text-xl font-black tracking-[-0.01em] text-brand-dark">
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
            />
          ))}
        </NavGroup>

        <NavGroup label="Cuenta">
          {accountLinks.map((link) => (
            <SidebarLink
              key={link.href}
              link={link}
              active={isActive(link.href)}
            />
          ))}
        </NavGroup>
      </nav>

      {user && (
        <div className="mt-4 flex items-center gap-2.5 rounded-14 bg-mint-50 p-2.5">
          <Link href="/perfil" className="flex min-w-0 flex-1 items-center gap-2.5">
            <Avatar
              name={`${user.first_name} ${user.last_name}`}
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
}: {
  link: NavLink;
  active: boolean;
}) {
  const Icon = link.icon;

  return (
    <Link
      href={link.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-3 rounded-10 px-4 py-2.5 text-sm font-semibold transition-colors duration-180 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
        active
          ? "bg-mint-50 text-primary-dark"
          : "text-muted hover:bg-surface-soft hover:text-foreground"
      )}
    >
      <Icon
        className={cn(
          "h-5 w-5 shrink-0",
          active ? "text-primary" : "text-muted"
        )}
      />
      <span className="truncate">{link.label}</span>
    </Link>
  );
}
