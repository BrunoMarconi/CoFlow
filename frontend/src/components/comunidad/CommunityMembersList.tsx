import Link from "next/link";
import type { CommunityMember } from "@/types/community";

export default function CommunityMembersList({
  members,
}: {
  members: CommunityMember[];
}) {
  if (members.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-gray-200 bg-[#F8FAFC] p-6 text-center text-sm text-gray-500">
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
      className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-[#F8FAFC] p-4 transition active:scale-[0.98] hover:border-green-200"
    >
      <div
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-sm font-bold ${
          member.role === "OWNER"
            ? "bg-[#163B2E] text-white"
            : "bg-white text-green-700 shadow-sm"
        }`}
      >
        {initials || "CF"}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-sm font-bold text-[#163B2E]">
            {fullName || "Miembro de CoFlow"}
          </p>

          <span
            className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
              member.role === "OWNER"
                ? "bg-green-100 text-green-800"
                : "bg-white text-gray-500"
            }`}
          >
            {member.role === "OWNER" ? "Administrador" : "Miembro"}
          </span>
        </div>

        <p className="mt-1 text-xs text-gray-400">
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
      className="h-4 w-4 shrink-0 text-gray-300"
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
