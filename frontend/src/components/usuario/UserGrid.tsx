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
  showRecommendedHeading = false,
}: {
  users: UserPublicProfile[];
  onOpen: (userId: string) => void;
  showRecommendedHeading?: boolean;
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
      {showRecommendedHeading && (
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">Descubre</p>
            <h2 className="mt-1 text-xl font-extrabold text-brand-dark">Personas para ti</h2>
          </div>
          <p className="hidden text-sm text-secondary sm:block">Perfiles con afinidad para ti</p>
        </div>
      )}

      <motion.div
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.04 } } }}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-5 xl:grid-cols-3"
      >
        <AnimatePresence initial={false}>
          {users.map((user, index) => (
            <motion.div
              key={user.id}
              layout
              variants={itemVariants}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ layout: MOTION_SPRING.gentle }}
              className={index < 2 ? "min-w-0" : "col-span-2 min-w-0 sm:col-span-1"}
            >
              <UserCard
                user={user}
                onOpen={onOpen}
                mobileVariant={index < 2 ? "featured" : "compact"}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </section>
  );
}
