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
    { href: "/conexiones", label: "Mensajes", icon: MessageIcon },
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
    <aside className="hidden w-60 shrink-0 flex-col bg-[#0d3b2a] px-3 py-6 md:flex">
      <Link
        href="/comunidades"
        className="mb-6 flex items-center gap-2.5 px-4"
        aria-label="CoFlow"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-10 bg-white/95">
          <Logo size="sm" />
        </span>

        <span className="text-xl font-black tracking-[-0.01em] text-white">
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
        <div className="mt-4 flex items-center gap-3 rounded-18 border border-white/10 bg-white/10 p-3">
          <Link href="/perfil" className="flex min-w-0 flex-1 items-center gap-3">
            <Avatar
              name={`${user.first_name} ${user.last_name}`}
              size={38}
            />

            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-white">
                {user.first_name} {user.last_name}
              </p>
              <p className="truncate text-xs text-white/60">
                {user.email}
              </p>
            </div>
          </Link>

          <button
            type="button"
            onClick={logout}
            aria-label="Cerrar sesión"
            title="Cerrar sesión"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-10 text-white/60 transition duration-180 hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint-200"
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
      <p className="px-4 text-xs font-bold uppercase tracking-[0.14em] text-white/40">
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
        "relative flex items-center gap-3 rounded-10 px-4 py-2.5 text-sm font-semibold transition-colors duration-180 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint-200",
        active
          ? "bg-white/10 text-white"
          : "text-white/60 hover:bg-white/5 hover:text-white"
      )}
    >
      {active && (
        <span
          aria-hidden="true"
          className="absolute left-0 top-1/2 h-5 w-0.75 -translate-y-1/2 rounded-full bg-mint-200"
        />
      )}

      <Icon
        className={cn(
          "h-5 w-5 shrink-0",
          active ? "text-mint-200" : "text-white/50"
        )}
      />
      <span className="truncate">{link.label}</span>
    </Link>
  );
}
