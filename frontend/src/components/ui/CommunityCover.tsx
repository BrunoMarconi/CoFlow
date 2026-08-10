import Image from "next/image";
import UserAvatar from "@/components/ui/UserAvatar";
import { cn } from "@/lib/utils";
import type { CommunityCoverColor } from "@/types/community";

/* Paleta plana y elegante para la portada automática de comunidad.
 * Nada de degradados: un único fondo suave por comunidad, sobre el
 * que se apoyan los avatares de los miembros. */
export const COMMUNITY_COVER_COLOR_MAP: Record<
  CommunityCoverColor,
  { bg: string; dark: boolean }
> = {
  sage: { bg: "#B7C7AC", dark: false },
  cream: { bg: "#EFE6D6", dark: false },
  stone: { bg: "#D6D1C6", dark: false },
  sand: { bg: "#E3D3B6", dark: false },
  smoke: { bg: "#C7CCD1", dark: false },
  forest: { bg: "#3E4F3B", dark: true },
};

export interface CommunityCoverMember {
  id: string;
  firstName: string;
  lastName?: string | null;
  imageUrl?: string | null;
}

export default function CommunityCover({
  name,
  coverColor,
  coverImageUrl,
  members,
  memberCount,
  isOwn = false,
  className,
}: {
  name: string;
  coverColor: CommunityCoverColor;
  coverImageUrl?: string | null;
  members: CommunityCoverMember[];
  memberCount: number;
  isOwn?: boolean;
  className?: string;
}) {
  if (coverImageUrl) {
    return (
      <div className={cn("relative overflow-hidden", className)}>
        <Image
          src={coverImageUrl}
          alt={name}
          fill
          unoptimized
          className="object-cover"
        />
        {isOwn && (
          <span className="absolute left-3 top-3 inline-flex h-6.5 items-center rounded-full bg-white/95 px-3 text-xs font-bold text-primary-dark shadow-soft backdrop-blur">
            Tu comunidad
          </span>
        )}
      </div>
    );
  }

  const { bg, dark } = COMMUNITY_COVER_COLOR_MAP[coverColor] ?? COMMUNITY_COVER_COLOR_MAP.sage;
  const visible = members.slice(0, 4);
  const extra = memberCount - visible.length;
  const centerIndex = Math.min(1, visible.length - 1);

  return (
    <div
      className={cn("relative overflow-hidden", className)}
      style={{ backgroundColor: bg }}
    >
      {isOwn && (
        <span className="absolute left-3 top-3 inline-flex h-6.5 items-center rounded-full bg-white/95 px-3 text-xs font-bold text-primary-dark shadow-soft backdrop-blur">
          Tu comunidad
        </span>
      )}

      {visible.length > 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex items-center">
            {visible.map((member, index) => (
              <UserAvatar
                key={member.id}
                firstName={member.firstName}
                lastName={member.lastName}
                userId={member.id}
                imageUrl={member.imageUrl}
                size={index === centerIndex ? "xl" : "lg"}
                className={cn(
                  "border-[3px] border-white shadow-[0_4px_10px_-4px_rgb(0_0_0/0.25)]",
                  index !== 0 && "-ml-5",
                  index === centerIndex && "z-10"
                )}
              />
            ))}

            {extra > 0 && (
              <div
                className={cn(
                  "-ml-5 flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-[3px] border-white text-sm font-bold shadow-[0_4px_10px_-4px_rgb(0_0_0/0.25)]",
                  dark
                    ? "bg-white/20 text-white"
                    : "bg-white/70 text-foreground"
                )}
              >
                +{extra}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
