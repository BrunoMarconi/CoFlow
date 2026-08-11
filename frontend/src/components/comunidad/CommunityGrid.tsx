"use client";

import { motion } from "framer-motion";
import CommunityCard from "./CommunityCard";
import EmptyState from "@/components/ui/EmptyState";
import { MOTION_DURATION, MOTION_EASE } from "@/lib/motionTokens";
import type { Community } from "@/types/community";

const containerVariants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.04 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: MOTION_DURATION.slow, ease: MOTION_EASE.out },
  },
};

// "La card nace alrededor de las personas": solo las primeras cards
// visibles reciben la construcción escalonada — el resto del grid
// usa la entrada simple de siempre (rendimiento, ver item 10 del
// pedido: máximo de elementos protagonistas de la coreografía).
const MAX_STAGED_CARDS = 6;

export default function CommunityGrid({
  communities,
  ownCommunityId,
  arriving = false,
  leaving = false,
}: {
  communities: Community[];
  ownCommunityId?: number;
  /** Se acaba de llegar desde Personas: las primeras cards se
   * construyen alrededor de su grupo de avatares en vez de aparecer
   * de golpe — ver CommunityCard. */
  arriving?: boolean;
  /** Saliendo hacia Personas: las primeras cards se abren (la
   * metadata se retira, el grupo de avatares queda protagonista). */
  leaving?: boolean;
}) {
  if (communities.length === 0) {
    return (
      <EmptyState
        title="Todavía no hay comunidades"
        description="Sé la primera persona en crear una comunidad en esta zona."
      />
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 gap-5 sm:grid-cols-[repeat(auto-fill,minmax(300px,1fr))]"
    >
      {communities.map((community, index) => (
        <motion.div key={community.id} variants={itemVariants} className="h-full">
          <CommunityCard
            community={community}
            isOwn={community.id === ownCommunityId}
            arriving={arriving && index < MAX_STAGED_CARDS}
            leaving={leaving && index < MAX_STAGED_CARDS}
          />
        </motion.div>
      ))}
    </motion.div>
  );
}
