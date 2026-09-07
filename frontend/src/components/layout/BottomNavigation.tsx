"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion";
import { MOTION_DURATION, MOTION_EASE, MOTION_SPRING } from "@/lib/motionTokens";
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
  KeyIcon,
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
    href: "/explorar",
    label: "Explorar",
    icon: CompassIcon,
    isActive: (pathname) =>
      pathname.startsWith("/explorar") ||
      pathname.startsWith("/usuarios") ||
      pathname.startsWith("/personas") ||
      pathname.startsWith("/comunidades"),
  },
  {
    href: "/mi-comunidad",
    label: "Comunidad",
    icon: UsersIcon,
    isActive: (pathname) =>
      pathname.startsWith("/mi-comunidad") || pathname.startsWith("/crear/comunidad"),
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
    href: "/propietarios/pisos",
    label: "Mis pisos",
    icon: KeyIcon,
    isActive: (pathname) =>
      pathname.startsWith("/propietarios/pisos"),
  },
  {
    href: "/propietarios/solicitudes",
    label: "Solicitudes",
    icon: UsersIcon,
    isActive: (pathname) => pathname.startsWith("/propietarios/solicitudes"),
  },
  {
    href: "/propietarios/mensajes",
    label: "Mensajes",
    icon: MessageIcon,
    isActive: (pathname) => pathname.startsWith("/propietarios/mensajes"),
  },
  {
    href: "/propietarios/perfil",
    label: "Perfil",
    icon: ProfileIcon,
    isActive: (pathname) => pathname.startsWith("/propietarios/perfil"),
  },
];

/* Margen horizontal (px) entre la píldora y los bordes de su pestaña.
 * Se comparte entre la píldora y el recorte de la capa de color para que
 * ambos describan exactamente la misma forma. */
const PILL_INSET_X = 3;
/** Margen vertical (px) de la píldora dentro de la cápsula. */
const PILL_INSET_Y = 5;
/** Radio de la píldora, también compartido con el recorte. */
const PILL_RADIUS = 19;

export default function BottomNavigation() {
  const pathname = usePathname();
  const { isChatActive } = useMobileChrome();
  const { hasUnreadMessages } = useAuth();
  const { isOwnerMode } = useOwnerMode();
  const isKeyboardVisible = useKeyboardVisible();
  const prefersReducedMotion = useReducedMotion();
  const [pressedIndex, setPressedIndex] = useState<number | null>(null);
  const links = isOwnerMode ? OWNER_LINKS : MEMBER_LINKS;

  const activeIndex = links.findIndex((link) => link.isActive(pathname));
  const widthPct = 100 / links.length;

  /* La píldora de cristal y la capa de color se mueven con UN solo motion
   * value: si cada una animase por su cuenta se desincronizarían durante
   * el recorrido y el icono se vería medio teñido fuera de la píldora. */
  const targetLeft = useMotionValue(Math.max(activeIndex, 0) * widthPct);
  const left = useSpring(targetLeft, MOTION_SPRING.snappy);

  useEffect(() => {
    if (activeIndex < 0) return;

    const next = activeIndex * widthPct;

    if (prefersReducedMotion) {
      left.jump(next);
      return;
    }

    targetLeft.set(next);
  }, [activeIndex, widthPct, prefersReducedMotion, targetLeft, left]);

  const leftCss = useTransform(left, (value) => `${value}%`);

  /* El recorte describe la misma píldora: lo que quede dentro muestra los
   * iconos en verde de marca, lo de fuera se descarta. Al desplazarse, va
   * "revelando" el color del icono por el que pasa. */
  const clipPath = useTransform(
    left,
    (value) =>
      `inset(${PILL_INSET_Y}px calc(${100 - value - widthPct}% + ${PILL_INSET_X}px) ${PILL_INSET_Y}px calc(${value}% + ${PILL_INSET_X}px) round ${PILL_RADIUS}px)`
  );

  // Nunca debe competir con el compositor de un chat activo ni con el
  // teclado virtual abierto en cualquier formulario.
  if (isChatActive || isKeyboardVisible) return null;

  return (
    /* La barra flota: la franja fija no captura toques, solo lo hace la
       cápsula. Así el contenido sigue pasando (y difuminándose) por
       debajo, que es lo que hace que el cristal se lea como cristal. */
    <nav
      aria-label="Navegación principal"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-(--z-bottom-nav) px-4 pb-[calc(var(--safe-bottom)+0.625rem)] md:hidden"
    >
      <div className="pointer-events-auto mx-auto max-w-sm">
        <div className="relative overflow-hidden rounded-[24px] border border-white/50 bg-white/62 px-1.5 shadow-[0_10px_34px_-8px_rgba(16,42,31,0.28),0_2px_8px_-2px_rgba(16,42,31,0.12)] backdrop-blur-2xl backdrop-saturate-[1.8]">
          {/* Reflejo especular: la luz entra por arriba, como en el
              material de iOS. Es lo que evita que el cristal parezca un
              simple gris translúcido. */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-white/90 to-transparent"
          />
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-linear-to-b from-white/45 to-transparent"
          />

          {/* El padding vive fuera para que este contenedor sea
              exactamente el área de las pestañas: así el 0% de la
              píldora coincide con el borde del primer icono. */}
          <div className="relative flex h-16 items-stretch">
            {activeIndex >= 0 && (
              <motion.div
                aria-hidden
                style={{ left: leftCss, width: `${widthPct}%` }}
                className="pointer-events-none absolute top-0 h-full"
              >
                <div
                  style={{
                    inset: `${PILL_INSET_Y}px ${PILL_INSET_X}px`,
                    borderRadius: PILL_RADIUS,
                  }}
                  // La opacidad no es libre: por debajo queda el mismo
                  // icono en gris, y con la píldora demasiado
                  // transparente se transparenta como un halo sucio
                  // alrededor del teñido.
                  className="absolute border border-white/80 bg-white/80 shadow-[0_1px_3px_rgba(16,42,31,0.14)]"
                />
              </motion.div>
            )}

            {links.map((link, index) => (
              <BottomNavLink
                key={link.href}
                link={link}
                active={index === activeIndex}
                transitionTypes={getTabTransitionTypes(pathname, link.href)}
                showUnreadDot={
                  link.label === "Mensajes" && !isOwnerMode && hasUnreadMessages
                }
                pressed={pressedIndex === index}
                onPressChange={(isPressed) =>
                  setPressedIndex(isPressed ? index : null)
                }
              />
            ))}

            {/* Copia exacta de la fila, teñida y recortada a la píldora.
                Es decorativa: los enlaces reales son los de arriba. */}
            {activeIndex >= 0 && (
              <motion.div
                aria-hidden
                style={{ clipPath }}
                className="pointer-events-none absolute inset-0 flex items-stretch"
              >
                {links.map((link, index) => (
                  <BottomNavLink
                    key={link.href}
                    link={link}
                    active={index === activeIndex}
                    showUnreadDot={
                      link.label === "Mensajes" &&
                      !isOwnerMode &&
                      hasUnreadMessages
                    }
                    pressed={pressedIndex === index}
                    tinted
                  />
                ))}
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

/* El icono de la pestaña recién activada da un saltito. Va como
 * variants (y no como `animate` con keyframes sueltos) para que solo se
 * dispare cuando cambia el nombre de la variante — con un array literal
 * volvería a saltar en cada render del layout. */
const ICON_VARIANTS = {
  idle: { scale: 1 },
  active: { scale: [1, 1.14, 1] },
};

/* Geometría compartida por las dos capas. Cualquier diferencia de
 * tamaño, peso de fuente o espaciado entre ellas se vería como un
 * fantasma desalineado al pasar la píldora, así que solo puede cambiar
 * el color. */
const NAV_ITEM_CLASS =
  "relative flex flex-1 items-center justify-center px-1 focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-brand focus-visible:rounded-[19px]";

function BottomNavLink({
  link,
  active,
  transitionTypes,
  showUnreadDot,
  tinted = false,
  pressed = false,
  onPressChange,
}: {
  link: NavigationLink;
  active: boolean;
  transitionTypes?: string[];
  showUnreadDot: boolean;
  /** Capa de color recortada a la píldora (decorativa, sin enlace). */
  tinted?: boolean;
  /** Pulsación en curso. La gestiona el padre porque la capa teñida no
   * recibe eventos: si cada capa lo dedujera por su cuenta, solo se
   * hundiría la de abajo y el icono se partiría en dos. */
  pressed?: boolean;
  onPressChange?: (pressed: boolean) => void;
}) {
  const Icon = link.icon;
  const prefersReducedMotion = useReducedMotion();

  const content = (
    <motion.span
      className="flex flex-col items-center gap-[3px]"
      animate={{ scale: pressed && !prefersReducedMotion ? 0.88 : 1 }}
      transition={MOTION_SPRING.snappy}
    >
      <motion.span
        className="relative"
        variants={ICON_VARIANTS}
        animate={active && !prefersReducedMotion ? "active" : "idle"}
        transition={{ duration: MOTION_DURATION.slow, ease: MOTION_EASE.out }}
      >
        {/* La capa teñida va rellena y la base en trazo: la píldora, al
            pasar, no solo colorea el icono — también lo "rellena", que
            es el cambio que usa iOS para marcar la pestaña actual. */}
        <Icon
          filled={tinted}
          className={cn(
            "h-6 w-6 shrink-0",
            tinted ? "text-brand-dark" : "text-muted"
          )}
        />

        <AnimatePresence>
          {showUnreadDot && (
            <motion.span
              aria-label="Hay mensajes sin leer"
              role="status"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={MOTION_SPRING.snappy}
              className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-primary ring-2 ring-white/80"
            />
          )}
        </AnimatePresence>
      </motion.span>

      <span
        className={cn(
          "relative text-[10px] leading-none tracking-[-0.01em]",
          // El peso lo decide `active`, nunca `tinted`: si las dos capas
          // usaran pesos distintos el texto no encajaría al superponerse.
          active ? "font-bold" : "font-semibold",
          tinted ? "text-brand-dark" : "text-muted"
        )}
      >
        {link.label}
      </span>
    </motion.span>
  );

  if (tinted) {
    return <span className={NAV_ITEM_CLASS}>{content}</span>;
  }

  return (
    <Link
      href={link.href}
      aria-current={active ? "page" : undefined}
      transitionTypes={transitionTypes}
      className={NAV_ITEM_CLASS}
      onPointerDown={() => onPressChange?.(true)}
      onPointerUp={() => onPressChange?.(false)}
      onPointerLeave={() => onPressChange?.(false)}
      onPointerCancel={() => onPressChange?.(false)}
    >
      {content}
    </Link>
  );
}
