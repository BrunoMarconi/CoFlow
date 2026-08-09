"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

/* Fondos planos dentro de la paleta de marca — sin gradientes. */
const TONES = [
  "bg-primary text-white",
  "bg-brand-dark text-white",
  "bg-mint-200 text-brand-dark",
];

const SIZES = {
  sm: "h-8 w-8 text-xs",
  md: "h-11 w-11 text-sm",
  lg: "h-16 w-16 text-xl",
  xl: "h-20 w-20 text-2xl sm:h-24 sm:w-24 sm:text-3xl",
} as const;

export type UserAvatarSize = keyof typeof SIZES;

const SIZE_PX: Record<UserAvatarSize, number> = {
  sm: 32,
  md: 44,
  lg: 64,
  xl: 96,
};

function hashId(id: string) {
  let hash = 0;

  for (let index = 0; index < id.length; index += 1) {
    hash = (hash * 31 + id.charCodeAt(index)) >>> 0;
  }

  return hash;
}

export default function UserAvatar({
  firstName,
  lastName,
  userId,
  imageUrl,
  size = "md",
  className,
}: {
  firstName: string;
  lastName?: string | null;
  userId: string;
  imageUrl?: string | null;
  size?: UserAvatarSize;
  className?: string;
}) {
  const [imageError, setImageError] = useState(false);

  const initials = [firstName, lastName]
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part?.[0])
    .join("")
    .toUpperCase();

  if (imageUrl && !imageError) {
    return (
      <Image
        src={imageUrl}
        alt={[firstName, lastName].filter(Boolean).join(" ")}
        width={SIZE_PX[size]}
        height={SIZE_PX[size]}
        unoptimized
        onError={() => setImageError(true)}
        className={cn(
          "shrink-0 rounded-full border border-white/40 object-cover shadow-sm",
          SIZES[size],
          className
        )}
      />
    );
  }

  const tone = TONES[hashId(userId) % TONES.length];

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full border border-white/40 font-bold shadow-sm",
        tone,
        SIZES[size],
        className
      )}
    >
      {initials || "CF"}
    </div>
  );
}
