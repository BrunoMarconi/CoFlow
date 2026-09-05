import { cn } from "@/lib/utils";

export default function PageSkeleton({
  variant = "cards",
  className,
}: {
  variant?: "cards" | "profile" | "community";
  className?: string;
}) {
  return (
    <div
      aria-label="Cargando contenido"
      aria-busy="true"
      className={cn("skeleton-shimmer mx-auto w-full max-w-6xl", className)}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-3">
          <div className="h-3 w-24 rounded-full bg-[#e6eae7]" />
          <div className="h-8 w-44 rounded-full bg-[#dfe5e1]" />
        </div>
        <div className="h-10 w-24 rounded-full bg-[#e6eae7]" />
      </div>

      {variant === "profile" ? (
        <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_20rem]">
          <div className="rounded-[28px] bg-surface p-5 shadow-soft">
            <div className="flex items-center gap-4">
              <div className="h-24 w-24 rounded-full bg-[#dfe5e1]" />
              <div className="flex-1 space-y-3"><div className="h-5 w-40 rounded-full bg-[#dfe5e1]" /><div className="h-3 w-56 max-w-full rounded-full bg-[#e6eae7]" /><div className="h-9 w-28 rounded-full bg-[#e6eae7]" /></div>
            </div>
          </div>
          <div className="h-44 rounded-[28px] bg-surface shadow-soft" />
          <div className="h-48 rounded-[28px] bg-surface shadow-soft lg:col-span-2" />
        </div>
      ) : variant === "community" ? (
        <div className="mt-6 space-y-4">
          <div className="h-48 rounded-[28px] bg-[#dfe5e1]" />
          <div className="grid gap-4 sm:grid-cols-2"><div className="h-40 rounded-[24px] bg-surface shadow-soft" /><div className="h-40 rounded-[24px] bg-surface shadow-soft" /></div>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => <div key={index} className="overflow-hidden rounded-[24px] bg-surface shadow-soft"><div className="h-36 bg-[#dfe5e1]" /><div className="space-y-3 p-5"><div className="h-4 w-2/3 rounded-full bg-[#dfe5e1]" /><div className="h-3 w-full rounded-full bg-[#e6eae7]" /><div className="h-3 w-4/5 rounded-full bg-[#e6eae7]" /></div></div>)}
        </div>
      )}
    </div>
  );
}
