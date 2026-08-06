import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-surface-muted px-6 text-center">
      <p className="text-sm font-bold uppercase tracking-[0.2em] text-primary">
        404
      </p>
      <h1 className="text-4xl font-bold text-brand-dark">
        No encontramos esta página
      </h1>
      <p className="max-w-md text-secondary">
        Puede que el enlace esté roto o que la página se haya movido.
      </p>
      <Link
        href="/"
        className="mt-4 rounded-18 bg-primary px-6 py-3 font-semibold text-white transition hover:bg-primary-hover"
      >
        Volver al inicio
      </Link>
    </main>
  );
}
