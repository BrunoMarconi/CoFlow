"use client";

import { motion } from "framer-motion";
import UserAvatar from "@/components/ui/UserAvatar";
import {
  MOTION_DURATION,
  MOTION_GROUP_MORPH,
  MOTION_GROUP_MORPH_DELAY,
} from "@/lib/motionTokens";

export interface ClusterPerson {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
}

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    out.push(items.slice(index, index + size));
  }

  return out;
}

/** El corazón visual de "personas se agrupan para formar comunidades":
 * toma los avatares REALES (nunca inventados) de las PersonaCards
 * visibles y los reparte en 2-3 clusters superpuestos, en una capa
 * que vive por encima del contenido que se repliega (ver UserGrid
 * `recede` / UserCard `flying`).
 *
 * Cada avatar comparte layoutId con el de su PersonaCard
 * (`person-avatar-${id}`, ya usado también por PersonPreviewPanel) —
 * mientras esta capa esté montada, la card cede ese layoutId (prop
 * `flying` en UserCard), así que Framer Motion anima un FLIP real
 * desde la posición de la card hasta el cluster, sin clones.
 *
 * Esto solo puede pasar dentro de Personas, que sigue montada — el
 * salto a Comunidades es una navegación dura entre rutas distintas, y
 * ningún layoutId sobrevive eso (ni siquiera la View Transitions API
 * nativa, que además no va en Safari). Por eso esta capa desaparece
 * con un crossfade corto justo antes de navegar, y en Comunidades
 * son los avatares REALES de `community.members` los que construyen
 * cada CommunityCard alrededor (ver CommunityCard `arriving`) — el
 * fallback abstracto que evita fingir una relación persona/comunidad
 * que no podemos comprobar en ese momento. */
export default function AvatarClusterLayer({
  people,
}: {
  people: ClusterPerson[];
}) {
  if (people.length === 0) return null;

  const clusters = chunk(people, people.length > 6 ? 3 : 4);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: MOTION_DURATION.fast }}
      className="pointer-events-none relative z-20 -mb-2 flex items-center justify-center gap-8 py-2"
      aria-hidden="true"
    >
      {clusters.map((group, clusterIndex) => (
        <div key={clusterIndex} className="flex -space-x-4">
          {group.map((person, personIndex) => (
            <motion.div
              key={person.id}
              layoutId={`person-avatar-${person.id}`}
              transition={{
                layout: { ...MOTION_GROUP_MORPH, delay: MOTION_GROUP_MORPH_DELAY },
              }}
              className="rounded-full ring-2 ring-surface"
              style={{ zIndex: group.length - personIndex }}
            >
              <UserAvatar
                firstName={person.firstName}
                lastName={person.lastName}
                userId={person.id}
                imageUrl={person.avatarUrl}
                size="lg"
              />
            </motion.div>
          ))}
        </div>
      ))}
    </motion.div>
  );
}
