"use client";

import { motion } from "framer-motion";
import UserCard from "./UserCard";
import EmptyState from "@/components/ui/EmptyState";
import type { UserPublicProfile } from "@/types/userPublic";

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
    transition: { duration: 0.25, ease: "easeOut" as const },
  },
};

export default function UserGrid({
  users,
  onOpen,
}: {
  users: UserPublicProfile[];
  onOpen: (userId: string) => void;
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
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3"
    >
      {users.map((user) => (
        <motion.div key={user.id} variants={itemVariants}>
          <UserCard user={user} onOpen={onOpen} />
        </motion.div>
      ))}
    </motion.div>
  );
}
