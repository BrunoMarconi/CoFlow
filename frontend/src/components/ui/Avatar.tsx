"use client";

import { useState } from "react";
import Image from "next/image";

interface AvatarProps {
  name: string;
  imageUrl?: string | null;
  size?: number;
}

export default function Avatar({ name, imageUrl, size = 40 }: AvatarProps) {
  const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null);

  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  if (imageUrl && imageUrl !== failedImageUrl) {
    return (
      <Image
        src={imageUrl}
        alt={name}
        width={size}
        height={size}
        unoptimized
        onError={() => setFailedImageUrl(imageUrl)}
        className="rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <div
      style={{ width: size, height: size }}
      className="flex items-center justify-center rounded-full bg-primary font-semibold text-white"
    >
      {initials || "?"}
    </div>
  );
}
