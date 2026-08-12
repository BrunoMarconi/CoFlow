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
        title="Todavía no hay personas para mostrar"
        description="A medida que se registren usuarios compatibles, los verás aquí."
      />
    );
  }

  return (
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
            transition={{
              layout: MOTION_SPRING.gentle,
              opacity: { duration: MOTION_DURATION.slow, ease: MOTION_EASE.out },
              y: { duration: MOTION_DURATION.slow, ease: MOTION_EASE.out },
            }}
            className={`${index < 2 ? "col-span-1" : "col-span-2"} sm:col-span-1`}
          >
            {showRecommendedHeading && index === 2 && (
              <div className="mb-3 flex items-center justify-between sm:hidden">
                <h2 className="text-lg font-extrabold text-foreground">
                  Recomendadas para ti
                </h2>
                <span className="text-xs font-bold text-primary-dark">Ver todas</span>
              </div>
            )}

            <UserCard
              user={user}
              onOpen={onOpen}
              mobileVariant={index < 2 ? "featured" : "compact"}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  );
}
