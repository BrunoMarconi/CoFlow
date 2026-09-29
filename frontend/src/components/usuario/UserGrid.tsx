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

export default function UserGrid({
  users,
  onOpen,
  heading = "Personas compatibles contigo",
}: {
  users: UserPublicProfile[];
  onOpen: (userId: string) => void;
  heading?: string;
}) {
  if (users.length === 0) {
    return (
      <EmptyState
        variant="search"
        title="Todavía no hay personas para mostrar"
        description="A medida que se registren usuarios compatibles, los verás aquí."
      />
    );
  }

  return (
    <section>
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <p className="text-2xs font-semibold uppercase tracking-[0.16em] text-[#66736c]">Descubre</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-[-0.035em] text-brand-dark">{heading}</h2>
        </div>
        <p className="shrink-0 text-xs font-semibold text-secondary sm:text-sm">
          {users.length} {users.length === 1 ? "perfil" : "perfiles"}
        </p>
      </div>

      <motion.div
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.04 } } }}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 gap-4 min-[540px]:grid-cols-2 sm:gap-5 xl:grid-cols-3"
      >
        <AnimatePresence initial={false}>
          {users.map((user) => (
            <motion.div
              key={user.id}
              layout
              variants={itemVariants}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ layout: MOTION_SPRING.gentle }}
              className="min-w-0"
            >
              <UserCard user={user} onOpen={onOpen} />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </section>
  );
}
