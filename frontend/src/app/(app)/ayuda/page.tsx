"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Clock3,
  CreditCard,
  Headphones,
  Home,
  MessageSquare,
  Search,
  ShieldCheck,
  Users,
  Wrench,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { toast } from "@/components/ui/Toast";

const topics: Array<{ title: string; description: string; icon: LucideIcon }> = [
  { title: "Empezar en CoFlow", description: "Crea tu perfil, completa tus datos y da tus primeros pasos.", icon: Users },
  { title: "Comunidades y pisos", description: "Cómo funcionan las comunidades, solicitudes y viviendas.", icon: Home },
  { title: "Mensajes e invitaciones", description: "Resuelve dudas sobre mensajes, invitaciones y avisos.", icon: MessageSquare },
  { title: "Cuenta y seguridad", description: "Gestiona tu cuenta, privacidad, verificación y seguridad.", icon: ShieldCheck },
  { title: "Pagos y suscripciones", description: "Información sobre planes, pagos y métodos de cobro.", icon: CreditCard },
  { title: "Solución de problemas", description: "Encuentra soluciones a los problemas más comunes.", icon: Wrench },
];

const faqs = [
  { question: "¿Cómo creo mi primera comunidad?", answer: "Ve a Crear comunidad, completa los cuatro pasos y revisa el resumen antes de entrar en tu nueva comunidad." },
  { question: "¿Cómo funcionan las solicitudes de piso?", answer: "Cuando una vivienda admita solicitudes podrás enviar la tuya desde su ficha. El propietario podrá revisarla y responderte desde CoFlow." },
  { question: "¿Es seguro compartir mis datos en CoFlow?", answer: "Mostramos únicamente la información necesaria para ayudarte a encontrar personas compatibles. Puedes revisar las opciones disponibles en Privacidad." },
  { question: "¿Cómo puedo cambiar mis preferencias?", answer: "Entra en Perfil y abre Preferencias de vivienda. Desde ahí puedes actualizar ciudad, presupuesto y preferencias de convivencia." },
  { question: "¿Qué métodos de pago aceptáis?", answer: "CoFlow todavía no tiene pagos ni suscripciones activos. Publicaremos los métodos disponibles antes de habilitar cualquier cobro." },
];

export default function HelpPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLocaleLowerCase("es");
  const filteredFaqs = useMemo(
    () => faqs.filter((item) => `${item.question} ${item.answer}`.toLocaleLowerCase("es").includes(normalizedQuery)),
    [normalizedQuery]
  );

  return (
    <div className="mx-auto w-full max-w-5xl pb-6 sm:pb-10">
      <header>
        <div className="flex items-center gap-3 md:block">
          <button type="button" onClick={() => router.back()} aria-label="Volver" className="flex h-10 w-10 shrink-0 items-center justify-start text-brand-dark md:hidden">
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h1 className="text-2xl font-extrabold tracking-[-0.025em] text-foreground sm:text-3xl">Centro de ayuda</h1>
        </div>
        <p className="mt-1 text-sm leading-6 text-secondary sm:mt-2 sm:text-base">
          Encuentra respuestas, guías y soluciones para todo lo relacionado con CoFlow.
        </p>
      </header>

      <label className="relative mt-5 block sm:mt-6">
        <span className="sr-only">Buscar en el centro de ayuda</span>
        <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar en el centro de ayuda..."
          className="h-12 w-full rounded-14 border border-border bg-surface pl-12 pr-4 text-sm text-foreground shadow-soft outline-none transition placeholder:text-muted focus:border-primary focus:ring-4 focus:ring-primary/10"
        />
      </label>

      <section className="mt-6">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-base font-extrabold text-foreground">Temas principales</h2>
          <span className="text-xs font-bold text-primary sm:hidden">Ver todos</span>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
          {topics.map((topic) => {
            const Icon = topic.icon;
            return (
              <button
                key={topic.title}
                type="button"
                onClick={() => toast.show(`${topic.title}: más guías estarán disponibles próximamente`)}
                className="group flex min-h-36 flex-col rounded-18 border border-border bg-surface p-4 text-left shadow-soft transition hover:border-primary/25 sm:min-h-40 sm:p-5"
              >
                <Icon className="h-7 w-7 text-primary" strokeWidth={1.8} />
                <h3 className="mt-4 text-sm font-extrabold leading-5 text-foreground">{topic.title}</h3>
                <p className="mt-1 hidden text-xs leading-5 text-secondary sm:block">{topic.description}</p>
                <ChevronRight className="mt-auto h-4 w-4 self-end text-primary transition group-hover:translate-x-0.5" />
              </button>
            );
          })}
        </div>
      </section>

      <div className="mt-7 grid gap-4 lg:grid-cols-[minmax(0,1fr)_17rem]">
        <section>
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-base font-extrabold text-foreground">Preguntas frecuentes</h2>
            <span className="text-xs font-bold text-primary">Ver todas</span>
          </div>
          <div className="mt-3 overflow-hidden rounded-18 border border-border bg-surface shadow-soft">
            {filteredFaqs.length > 0 ? filteredFaqs.map((item) => (
              <details key={item.question} className="group border-b border-border last:border-b-0">
                <summary className="flex min-h-12 cursor-pointer list-none items-center gap-3 px-4 py-3 text-sm font-semibold text-foreground sm:px-5">
                  <span className="min-w-0 flex-1">{item.question}</span>
                  <ChevronDown className="h-4 w-4 shrink-0 text-muted transition group-open:rotate-180" />
                </summary>
                <p className="px-4 pb-4 text-sm leading-6 text-secondary sm:px-5">{item.answer}</p>
              </details>
            )) : (
              <div className="px-5 py-8 text-center">
                <CircleHelp className="mx-auto h-7 w-7 text-primary" />
                <p className="mt-3 text-sm font-bold text-foreground">No encontramos esa respuesta</p>
                <p className="mt-1 text-xs text-muted">Prueba con otras palabras o contacta con soporte.</p>
              </div>
            )}
          </div>
        </section>

        <aside className="h-fit rounded-18 border border-border bg-surface p-5 shadow-soft">
          <h2 className="text-base font-extrabold text-foreground">¿Necesitas más ayuda?</h2>
          <p className="mt-1 text-sm leading-6 text-secondary">Nuestro equipo está aquí para ayudarte.</p>
          <button
            type="button"
            onClick={() => toast.show("El canal de soporte estará disponible próximamente")}
            className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-14 bg-primary px-4 text-sm font-bold text-white shadow-button transition hover:bg-primary-hover"
          >
            <Headphones className="h-4.5 w-4.5" />
            Contactar con soporte
          </button>
          <div className="mt-4 flex items-center gap-2 text-xs text-secondary">
            <Clock3 className="h-4 w-4 shrink-0 text-primary" />
            <span>Tiempo de respuesta habitual: menos de 24 h</span>
          </div>
        </aside>
      </div>

      <aside className="mt-7 flex items-start gap-4 rounded-18 border border-border bg-surface p-5 shadow-soft sm:items-center sm:p-6">
        <ShieldCheck className="h-8 w-8 shrink-0 text-primary" strokeWidth={1.7} />
        <div>
          <h2 className="text-base font-extrabold text-foreground">CoFlow está aquí para ayudarte</h2>
          <p className="mt-1 text-sm leading-6 text-secondary">Construimos una comunidad segura, transparente y confiable. Si tienes cualquier duda, contacta con nosotros.</p>
        </div>
      </aside>
    </div>
  );
}
