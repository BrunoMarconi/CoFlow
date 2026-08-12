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

  const withPhoto = users.filter((user) =>
    Boolean(user.avatar_url || user.photos.some((photo) => photo.image_url))
  );
  const featuredUsers = (withPhoto.length >= 2 ? withPhoto : users).slice(0, 2);
  const featuredIds = new Set(featuredUsers.map((user) => user.id));
  const remainingUsers = users.filter((user) => !featuredIds.has(user.id));

  return (
    <>
      <div className="sm:hidden">
        <motion.div
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.04 } } }}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 gap-3"
        >
          <AnimatePresence initial={false}>
            {users.map((user, index) => (
              <motion.div
                key={user.id}
                layout
                variants={itemVariants}
                exit={{ opacity: 0, scale: 0.96, y: 8 }}
                transition={{ layout: MOTION_SPRING.gentle }}
                className={index < 2 ? "col-span-1" : "col-span-2"}
              >
                {showRecommendedHeading && index === 2 && (
                  <div className="mb-3 flex items-center justify-between">
                    <h2 className="text-lg font-extrabold text-foreground">Recomendadas para ti</h2>
                    <span className="text-xs font-bold text-primary-dark">Ver todas</span>
                  </div>
                )}
                <UserCard user={user} onOpen={onOpen} mobileVariant={index < 2 ? "featured" : "compact"} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>

      <div className="hidden space-y-8 sm:block">
        <section>
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">Descubre</p>
              <h2 className="mt-1 text-xl font-extrabold text-brand-dark">Personas destacadas</h2>
            </div>
            <p className="text-sm text-secondary">Perfiles con afinidad para ti</p>
          </div>
          <motion.div
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.05 } } }}
            initial="hidden"
            animate="show"
            className="grid grid-cols-2 gap-5"
          >
            {featuredUsers.map((user) => (
              <motion.div key={user.id} variants={itemVariants} className="min-w-0">
                <UserCard user={user} onOpen={onOpen} mobileVariant="featured" />
              </motion.div>
            ))}
          </motion.div>
        </section>

        {remainingUsers.length > 0 && (
          <section>
            <div className="mb-4 flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">Más perfiles</p>
                <h2 className="mt-1 text-xl font-extrabold text-brand-dark">Personas para ti</h2>
              </div>
              <p className="text-sm text-secondary">Explora a tu ritmo</p>
            </div>
            <motion.div
              variants={{ hidden: {}, show: { transition: { staggerChildren: 0.04 } } }}
              initial="hidden"
              animate="show"
              className="grid auto-rows-fr grid-cols-2 gap-5 xl:grid-cols-3"
            >
              <AnimatePresence initial={false}>
                {remainingUsers.map((user) => (
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
        )}
      </div>
    </>
  );
}
