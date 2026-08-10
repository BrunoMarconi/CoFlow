"use client";

import { AnimatePresence, motion } from "framer-motion";
import UserCard from "./UserCard";
import EmptyState from "@/components/ui/EmptyState";
import { MOTION_DURATION, MOTION_EASE } from "@/lib/motionTokens";
import type { UserPublicProfile } from "@/types/userPublic";

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: MOTION_DURATION.slow, ease: MOTION_EASE.out },
  },
};

export default function UserGrid({
  users,
  onOpen,
  staggerChildren = 0.04,
}: {
  users: UserPublicProfile[];
  onOpen: (userId: string) => void;
  /** ms/1000 entre cards al entrar — por defecto el de siempre; se
   * puede pasar uno más corto (p. ej. desde resultados de búsqueda en
   * vivo) sin duplicar este componente. */
  staggerChildren?: number;
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
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3"
    >
      <AnimatePresence initial={false}>
        {users.map((user) => (
          <motion.div
            key={user.id}
            layout
            variants={itemVariants}
            exit={{ opacity: 0 }}
          >
            <UserCard user={user} onOpen={onOpen} />
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  );
}
