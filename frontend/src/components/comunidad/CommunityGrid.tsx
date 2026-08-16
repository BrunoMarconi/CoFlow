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

export default function CommunityGrid({
  communities,
  ownCommunityId,
}: {
  communities: Community[];
  ownCommunityId?: number;
}) {
  if (communities.length === 0) {
    return (
      <EmptyState
        variant="community"
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
      className="flex flex-col gap-3 sm:gap-4"
    >
      {communities.map((community) => (
        <motion.div key={community.id} variants={itemVariants}>
          <CommunityCard
            community={community}
            isOwn={community.id === ownCommunityId}
          />
        </motion.div>
      ))}
    </motion.div>
  );
}
