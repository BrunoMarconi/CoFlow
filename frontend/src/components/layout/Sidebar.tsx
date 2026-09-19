"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { MOTION_HOME_TAP_SCALE, MOTION_SPRING } from "@/lib/motionTokens";
import { useAuth } from "@/hooks/useAuth";
import { useOwnerMode } from "@/hooks/useOwnerMode";
import Avatar from "@/components/ui/Avatar";
import Logo from "@/components/ui/Logo";
import ProfileCompletionRing from "@/components/ui/ProfileCompletionRing";
import { computeProfileCompletion } from "@/lib/profileCompletion";
import {
  CompassIcon,
  KeyIcon,
  LogoutIcon,
  MessageIcon,
  ProfileIcon,
  SettingsIcon,
  UsersIcon,
  HomeIcon,
  type IconProps,
} from "@/components/layout/NavIcons";
import { navIconMotion } from "@/components/layout/navIconMotion";
import { getTabTransitionTypes } from "@/lib/navTransition";

type NavLink = {
  href: string;
  label: string;
  icon: (props: IconProps) => React.ReactElement;
};

export default function Sidebar() {
  const pathname = usePathname();
  const { user, community, ownerProfile, logout } = useAuth();
  const { isOwnerMode } = useOwnerMode();

  const memberLinks: NavLink[] = [
    {
      href: "/explorar",
      label: "Explorar",
      icon: CompassIcon,
    },
    { href: "/mensajes", label: "Mensajes", icon: MessageIcon },
    {
      href: "/mi-comunidad",
      label: community ? "Mi comunidad" : "Crear comunidad",
      icon: HomeIcon,
    },
    { href: "/perfil", label: "Perfil", icon: ProfileIcon },
  ];

  const ownerLinks: NavLink[] = [
    { href: "/propietarios/pisos", label: "Mis pisos", icon: KeyIcon },
    { href: "/propietarios/solicitudes", label: "Solicitudes", icon: UsersIcon },
    { href: "/propietarios/mensajes", label: "Mensajes", icon: MessageIcon },
    { href: "/propietarios/perfil", label: "Perfil", icon: ProfileIcon },
  ];

  const principalLinks = isOwnerMode ? ownerLinks : memberLinks;
  const profileCompletion = user ? computeProfileCompletion(user) : 100;
  const showProfileProgress = !isOwnerMode && profileCompletion < 100;

  const accountLinks: NavLink[] = [
    ...(isOwnerMode
      ? []
      : [
          ...(!ownerProfile
            ? [
                {
                  href: "/propietarios/perfil",
                  label: "Publicar un piso",
                  icon: KeyIcon,
                },
              ]
            : []),
        ]),
    { href: "/ajustes", label: "Ajustes", icon: SettingsIcon },
  ];

  function isActive(href: string) {
    if (href === "/mi-comunidad") {
      return pathname.startsWith("/mi-comunidad") || pathname.startsWith("/crear/comunidad");
    }

    if (href === "/explorar") {
      return (
        pathname.startsWith("/explorar") ||
        pathname.startsWith("/usuarios") ||
        pathname.startsWith("/personas") ||
        pathname.startsWith("/comunidades")
      );
    }

    if (href === "/propietarios") return pathname === "/propietarios";

    if (href === "/propietarios/pisos") {
      return (
        pathname.startsWith("/propietarios/pisos") &&
        !pathname.startsWith("/propietarios/pisos/nuevo")
      );
    }

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
        href="/"
        aria-label="Volver a la web de CoFlow"
        title="Volver a la web"
        className="mb-2 flex h-11 w-11 items-center justify-center self-start rounded-12 text-muted/70 transition-colors duration-180 hover:bg-surface-soft hover:text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
          <path d="M19 12H5M11 18l-6-6 6-6" />
        </svg>
      </Link>

      <Link
        href={isOwnerMode ? "/propietarios/pisos" : "/explorar"}
        className="mb-6 flex items-center gap-2.5 px-4"
        aria-label="CoFlow"
      >
        <Logo size="sm" />

        <span className="font-rounded text-xl font-semibold tracking-[-0.01em] text-brand-dark">
          CoFlow
        </span>
      </Link>

      <nav className="flex flex-1 flex-col gap-6">
        <NavGroup label={isOwnerMode ? "Propietario" : "Principal"}>
          {principalLinks.map((link) => (
            <SidebarLink
              key={link.href}
              link={link}
              active={isActive(link.href)}
              transitionTypes={getTabTransitionTypes(pathname, link.href)}
              isHomeLink={link.href === "/mi-comunidad" || link.href === "/propietarios/pisos"}
            />
          ))}
        </NavGroup>

        {user?.is_team_member ? (
          <NavGroup label="Equipo">
            {[
              { href: "/admin/users", label: "Personas y matches", icon: UsersIcon },
              { href: "/admin/communities", label: "Comunidades internas", icon: HomeIcon },
              { href: "/equipo/viviendas", label: "Todas las viviendas", icon: HomeIcon },
              { href: "/equipo/alta-asistida", label: "Alta asistida", icon: KeyIcon },
            ].map((link) => (
              <SidebarLink
                key={link.href}
                link={link}
                active={isActive(link.href)}
                transitionTypes={getTabTransitionTypes(pathname, link.href)}
              />
            ))}
          </NavGroup>
        ) : null}

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
        <div className="mt-4 flex items-center gap-2 rounded-14 bg-surface-soft/70 p-2">
          <Link
            href={isOwnerMode ? "/propietarios/perfil" : "/perfil"}
            aria-label={
              showProfileProgress
                ? `Abrir perfil, completado al ${profileCompletion}%`
                : "Abrir perfil"
            }
            className="flex min-h-11 min-w-0 flex-1 items-center gap-2.5 rounded-10 px-1 transition-colors duration-180 hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            <span className="relative flex h-10 w-10 shrink-0 items-center justify-center">
              {showProfileProgress && (
                <ProfileCompletionRing
                  completion={profileCompletion}
                  className="absolute inset-0 h-10 w-10"
                />
              )}
              <Avatar
                name={`${user.first_name} ${user.last_name}`}
                imageUrl={user.avatar_url}
                size={showProfileProgress ? 32 : 34}
              />
            </span>

            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-foreground">
                {user.first_name} {user.last_name}
              </p>
              <p className="truncate text-xs font-medium text-muted">
                {isOwnerMode
                  ? "Modo propietario"
                  : showProfileProgress
                    ? `${profileCompletion}% · Completar perfil`
                    : user.email}
              </p>
            </div>
          </Link>

          <button
            type="button"
            onClick={logout}
            aria-label="Cerrar sesión"
            title="Cerrar sesión"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-12 text-muted transition duration-180 hover:bg-white hover:text-red-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-400"
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
  isHomeLink = false,
}: {
  link: NavLink;
  active: boolean;
  transitionTypes?: string[];
  /** El icono de la casita ("Tu comunidad"): solo feedback de tap en
   * el propio icono — la navegación es un <Link> normal, AppShell
   * detecta el cruce de ruta hacia/desde Tu Comunidad por sí solo. */
  isHomeLink?: boolean;
}) {
  const Icon = link.icon;
  const prefersReducedMotion = useReducedMotion();
  const [hovered, setHovered] = useState(false);
  const iconMotion = navIconMotion(link.icon);

  // El activo hace su gesto entero una vez; el resto, un eco a media
  // intensidad cuando el ratón pasa por la fila (no solo por el icono).
  const iconState = prefersReducedMotion
    ? "idle"
    : active
      ? "active"
      : hovered
        ? "hover"
        : "idle";

  return (
    <Link
      href={link.href}
      aria-current={active ? "page" : undefined}
      transitionTypes={transitionTypes}
      onPointerEnter={(event) => {
        if (event.pointerType === "mouse") setHovered(true);
      }}
      onPointerLeave={() => setHovered(false)}
      className={cn(
        "relative flex items-center gap-3 rounded-10 px-4 py-2.5 text-sm font-semibold transition-colors duration-180 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
        active
          ? "text-primary-dark"
          : "text-muted hover:bg-black/[0.035] hover:text-foreground"
      )}
    >
      {/* Indicador compartido entre todas las filas: al cambiar de
          sección se desliza de una a otra en vez de apagarse aquí y
          encenderse allí. Antes el activo era bg-mint-50, que por
          decisión de marca es #fff: blanco sobre blanco, no se veía.
          Fondo neutro traslúcido (el verde no va de fondo) y el acento
          de marca en la barrita, que sí es un "borde activo". */}
      {active && (
        <motion.span
          layoutId="sidebar-active"
          aria-hidden
          transition={prefersReducedMotion ? { duration: 0 } : MOTION_SPRING.snappy}
          className="absolute inset-0 rounded-10 bg-black/[0.05]"
        >
          <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-primary" />
        </motion.span>
      )}
      <motion.span
        whileTap={isHomeLink ? { scale: MOTION_HOME_TAP_SCALE } : undefined}
        className="relative inline-flex shrink-0"
      >
        <motion.span
          className="inline-flex"
          style={{ transformOrigin: iconMotion.origin }}
          variants={iconMotion.variants}
          animate={iconState}
        >
          <Icon
            filled={active}
            className={cn(
              "h-5 w-5 shrink-0",
              active ? "text-primary" : "text-muted"
            )}
          />
        </motion.span>
      </motion.span>
      <span className="relative truncate">{link.label}</span>
    </Link>
  );
}
