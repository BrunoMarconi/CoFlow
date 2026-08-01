import Link from "next/link";

export default function PisosPage() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center rounded-3xl border border-dashed border-line bg-surface p-8 text-center sm:p-12">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand/10 text-brand-dark">
        <HomeIcon />
      </span>

      <h1 className="mt-6 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
        Pisos — Próximamente
      </h1>

      <p className="mt-3 text-base leading-7 text-muted">
        Estamos preparando una selección inicial de viviendas para las
        primeras comunidades de CoFlow.
      </p>

      <Link
        href="/comunidades"
        className="mt-7 inline-flex h-12 items-center justify-center rounded-2xl bg-brand px-6 text-sm font-bold text-white shadow-lg shadow-brand/20 transition hover:-translate-y-0.5 hover:bg-brand-dark"
      >
        Crear o encontrar una comunidad
      </Link>
    </div>
  );
}

function HomeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-7 w-7"
      aria-hidden="true"
    >
      <path d="m3 11 9-8 9 8" />
      <path d="M5 10v10a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V10" />
    </svg>
  );
}
