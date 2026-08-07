import Image from "next/image";
import Link from "next/link";
import type { CommunityMember } from "@/types/community";

export default function CommunityMembersList({
  members,
}: {
  members: CommunityMember[];
}) {
  if (members.length === 0) {
    return (
      <p className="rounded-18 border border-dashed border-border bg-surface-muted p-6 text-center text-sm text-muted">
        Todavía no hay miembros registrados.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {members.map((member) => (
        <CommunityMemberRow key={member.id} member={member} />
      ))}
    </div>
  );
}

function CommunityMemberRow({ member }: { member: CommunityMember }) {
  const fullName = [member.user.first_name, member.user.last_name]
    .filter(Boolean)
    .join(" ");

  const initials = [member.user.first_name, member.user.last_name]
    .filter(Boolean)
    .slice(0, 2)
    .map((name) => name[0])
    .join("")
    .toUpperCase();

  const joinedDate = formatJoinedDate(member.joined_at);

  return (
    <Link
      href={`/personas/${member.user_id}`}
      className="flex items-center gap-4 rounded-18 border border-border bg-surface-muted p-4 transition active:scale-[0.98] hover:border-primary/30"
    >
      {member.user.avatar_url ? (
        <Image
          src={member.user.avatar_url}
          alt=""
          width={48}
          height={48}
          unoptimized
          className="h-12 w-12 shrink-0 rounded-18 object-cover"
        />
      ) : (
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-18 text-sm font-bold ${
            member.role === "OWNER"
              ? "bg-brand-dark text-white"
              : "bg-surface text-primary-dark shadow-soft"
          }`}
        >
          {initials || "CF"}
        </div>
      )}

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-sm font-bold text-brand-dark">
            {fullName || "Miembro de CoFlow"}
          </p>

          <span
            className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
              member.role === "OWNER"
                ? "bg-mint-100 text-primary-dark"
                : "bg-surface text-muted"
            }`}
          >
            {member.role === "OWNER" ? "Administrador" : "Miembro"}
          </span>
        </div>

        <p className="mt-1 text-xs text-muted">
          {member.role === "OWNER"
            ? "Creador de la comunidad"
            : `Se unió ${joinedDate}`}
        </p>
      </div>

      <ChevronIcon />
    </Link>
  );
}

function ChevronIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4 shrink-0 text-muted"
      aria-hidden="true"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

function formatJoinedDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "recientemente";

  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}
