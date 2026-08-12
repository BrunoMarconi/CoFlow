import Link from "next/link";
import ErrorState from "@/components/ui/ErrorState";

export default function NotFound() {
  return <main className="flex min-h-dvh items-center justify-center bg-surface px-5 py-10"><ErrorState title="Página no encontrada" description="Parece que esta habitación no existe." icon={<NotFoundIllustration />} action={<Link href="/comunidades" className="inline-flex h-11 items-center justify-center rounded-14 border border-red-300 bg-surface px-5 text-sm font-bold text-red-600 shadow-soft">Volver a explorar</Link>} /></main>;
}

function NotFoundIllustration() {
  return <svg viewBox="0 0 88 64" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M13 51c6-5 11-6 18-2M60 50c8-6 14-6 21-1" opacity=".4" /><path d="M24 44V22l20-13 20 13v22" /><path d="M34 44V30h20v14" /><text x="44" y="59" textAnchor="middle" fill="currentColor" stroke="none" fontSize="13" fontWeight="700">404</text></svg>;
}
