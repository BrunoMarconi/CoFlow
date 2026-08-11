"use client";

import { AnimatePresence, motion } from "framer-motion";
import UserCard from "./UserCard";
import EmptyState from "@/components/ui/EmptyState";
import { MOTION_DURATION, MOTION_EASE, MOTION_SPRING } from "@/lib/motionTokens";
import type { UserPublicProfile } from "@/types/userPublic";

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: MOTION_DURATION.slow, ease: MOTION_EASE.out },
  },
};

// Recede/vuelta al foco: cuando el panel de filtros de Search Mode
// está desplegado (query vacía), el grid ya montado se queda visible
// pero se "va hacia atrás" en vez de desaparecer — da la profundidad
// de item 2/4 sin desmontar nada.
const recedeVariants = {
  focused: { opacity: 1, scale: 1, y: 0, filter: "blur(0px)" },
  receded: { opacity: 0.28, scale: 0.965, y: 12, filter: "blur(2px)" },
};

export default function UserGrid({
  users,
  onOpen,
  staggerChildren = 0.04,
  recede = false,
  highlightFirst = false,
}: {
  users: UserPublicProfile[];
  onOpen: (userId: string) => void;
  /** ms/1000 entre cards al entrar — por defecto el de siempre; se
   * puede pasar uno más corto (p. ej. desde resultados de búsqueda en
   * vivo) sin duplicar este componente. */
  staggerChildren?: number;
  /** Search Mode con query vacía: el grid sigue montado pero se
   * empuja ligeramente hacia atrás (escala/blur/opacidad) mientras el
   * panel de filtros ocupa el primer plano — nunca se desmonta. */
  recede?: boolean;
  /** El primer resultado entra con un acento sutil (borde/sombra) sin
   * cambiar de tamaño ni romper la jerarquía visual. */
  highlightFirst?: boolean;
}) {
  if (users.length === 0) {
    return (
      <EmptyState
        title="Todavía no hay personas para mostrar"
        description="A medida que se registren usuarios compatibles, los verás aquí."
      />
    );
  }

  const containerVariants = {
    hidden: {},
    show: {
      transition: { staggerChildren },
    },
  };

  return (
    <motion.div
      animate={recede ? "receded" : "focused"}
      variants={recedeVariants}
      transition={{ duration: MOTION_DURATION.normal, ease: MOTION_EASE.out }}
      style={{ pointerEvents: recede ? "none" : "auto" }}
    >
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3"
      >
        <AnimatePresence initial={false}>
          {users.map((user, index) => (
            <motion.div
              key={user.id}
              layout
              variants={itemVariants}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{
                layout: MOTION_SPRING.gentle,
                opacity: { duration: MOTION_DURATION.slow, ease: MOTION_EASE.out },
                y: { duration: MOTION_DURATION.slow, ease: MOTION_EASE.out },
              }}
              className={
                highlightFirst && index === 0
                  ? "rounded-18 ring-1 ring-primary/20"
                  : undefined
              }
            >
              <UserCard user={user} onOpen={onOpen} />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
