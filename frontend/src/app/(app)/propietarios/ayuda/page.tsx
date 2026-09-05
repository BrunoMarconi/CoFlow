import Link from "next/link";
import { Building2, ChevronDown, CircleHelp, FileCheck2, MessageCircle, ShieldCheck } from "lucide-react";

const FAQ = [
  { question: "¿Cuándo serán visibles mis viviendas?", answer: "Todavía no se muestran públicamente. CoFlow está preparando el lanzamiento de viviendas y, mientras tanto, todo queda guardado de forma privada en tu cuenta." },
  { question: "¿Qué significa marcar una vivienda como preparada?", answer: "Significa que contiene la información necesaria para avanzar. No implica una revisión ni una publicación automática." },
  { question: "¿Puedo gestionar varias viviendas?", answer: "Sí. Puedes registrar y organizar tantas viviendas como necesites desde tu cartera." },
  { question: "¿Puedo seguir usando CoFlow para buscar hogar?", answer: "Sí. Ambos modos conviven en la misma cuenta, aunque sus experiencias y datos permanecen separados." },
];

export default function AyudaPropietariosPage() {
  return (
    <div className="explore-shell -mx-6 -mt-4 w-[calc(100%+3rem)] px-6 pb-12 pt-5 sm:mx-auto sm:mt-0 sm:w-full sm:max-w-5xl sm:rounded-[32px] sm:p-7 lg:p-8">
      <header className="relative overflow-hidden rounded-[28px] bg-brand-dark p-6 text-white shadow-[0_18px_45px_rgba(20,55,41,.17)] sm:p-8">
        <span className="absolute -right-14 -top-20 h-52 w-52 rounded-full border-[34px] border-white/[0.04]" aria-hidden="true" />
        <div className="relative max-w-2xl">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10"><CircleHelp className="h-5 w-5" /></span>
          <p className="mt-5 text-[11px] font-bold uppercase tracking-[0.15em] text-white/55">Centro de ayuda</p>
          <h1 className="mt-1 font-rounded text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">Resuelve tus dudas como propietario</h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-white/65">Información clara sobre publicación, gestión y próximos pasos en CoFlow.</p>
        </div>
      </header>

      <section className="mt-4 grid gap-3 sm:grid-cols-3" aria-label="Temas de ayuda">
        <Topic icon={<Building2 />} title="Viviendas" text="Alta, edición y estados" />
        <Topic icon={<FileCheck2 />} title="Publicación" text="Preparación y visibilidad" />
        <Topic icon={<ShieldCheck />} title="Cuenta" text="Privacidad y seguridad" />
      </section>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_17rem]">
        <section className="rounded-[26px] bg-surface p-5 shadow-soft sm:p-6">
          <p className="text-xs font-bold uppercase tracking-[0.13em] text-muted">Preguntas frecuentes</p>
          <div className="mt-3 divide-y divide-border/70">
            {FAQ.map((item) => (
              <details key={item.question} className="group py-1">
                <summary className="flex min-h-14 cursor-pointer list-none items-center gap-3 py-3 text-left text-sm font-bold text-brand-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand [&::-webkit-details-marker]:hidden">
                  <span className="min-w-0 flex-1">{item.question}</span>
                  <ChevronDown className="h-4 w-4 shrink-0 text-muted transition-transform duration-200 group-open:rotate-180" aria-hidden="true" />
                </summary>
                <p className="max-w-2xl pb-4 pr-7 text-sm leading-6 text-secondary">{item.answer}</p>
              </details>
            ))}
          </div>
        </section>

        <aside className="rounded-[26px] bg-mint-50 p-5 sm:p-6">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-surface text-primary shadow-soft"><MessageCircle className="h-5 w-5" /></span>
          <h2 className="mt-5 font-rounded text-xl font-semibold text-brand-dark">¿Necesitas revisar algo?</h2>
          <p className="mt-2 text-sm leading-6 text-secondary">Consulta primero el estado de tu vivienda. Allí verás qué información falta y cuál es el siguiente paso.</p>
          <Link href="/propietarios/pisos" className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-full bg-brand-dark px-4 text-sm font-bold text-white shadow-button">Ver mis viviendas</Link>
        </aside>
      </div>
    </div>
  );
}

function Topic({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return <div className="flex items-center gap-3 rounded-[20px] bg-surface p-4 shadow-soft"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-mint-50 text-primary [&>svg]:h-5 [&>svg]:w-5">{icon}</span><span><span className="block text-sm font-bold text-brand-dark">{title}</span><span className="mt-0.5 block text-xs text-secondary">{text}</span></span></div>;
}
