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
import Link from "next/link";
import type { LucideIcon } from "lucide-react";

type HelpTopic = "all" | "start" | "housing" | "messages" | "security" | "payments" | "problems";

const topics: Array<{ key: Exclude<HelpTopic, "all">; title: string; description: string; icon: LucideIcon }> = [
  { key: "start", title: "Empezar en CoFlow", description: "Crea tu perfil, completa tus datos y da tus primeros pasos.", icon: Users },
  { key: "housing", title: "Comunidades y pisos", description: "Cómo funcionan las comunidades, solicitudes y viviendas.", icon: Home },
  { key: "messages", title: "Mensajes e invitaciones", description: "Resuelve dudas sobre mensajes, invitaciones y avisos.", icon: MessageSquare },
  { key: "security", title: "Cuenta y seguridad", description: "Gestiona tu cuenta, privacidad, verificación y seguridad.", icon: ShieldCheck },
  { key: "payments", title: "Pagos y suscripciones", description: "Información sobre planes, pagos y métodos de cobro.", icon: CreditCard },
  { key: "problems", title: "Solución de problemas", description: "Encuentra soluciones a los problemas más comunes.", icon: Wrench },
];

const faqs = [
  { topic: "housing", question: "¿Cómo creo mi primera comunidad?", answer: "Ve a Crear comunidad, completa los cuatro pasos y revisa el resumen antes de entrar en tu nueva comunidad." },
  { topic: "housing", question: "¿Cómo funcionan las solicitudes de piso?", answer: "Cuando una vivienda admita solicitudes podrás enviar la tuya desde su ficha. El propietario podrá revisarla y responderte desde CoFlow." },
  { topic: "security", question: "¿Es seguro compartir mis datos en CoFlow?", answer: "Mostramos únicamente la información necesaria para ayudarte a encontrar personas compatibles. Puedes cambiar la visibilidad del perfil desde Privacidad." },
  { topic: "start", question: "¿Cómo puedo cambiar mis preferencias?", answer: "Entra en Perfil y abre Preferencias de vivienda. Desde ahí puedes actualizar ciudad, presupuesto y preferencias de convivencia." },
  { topic: "messages", question: "¿Cómo empiezo una conversación?", answer: "Cuando una conexión sea aceptada podrás escribirle desde Mensajes. Las conversaciones de comunidad aparecen en la misma bandeja." },
  { topic: "payments", question: "¿Cómo se cobran las publicaciones?", answer: "Cada piso publicado tiene su propia cuota. Los propietarios pueden revisar la tarjeta guardada y el estado de cada suscripción desde Ajustes." },
  { topic: "problems", question: "No puedo enviar un mensaje, ¿qué hago?", answer: "Comprueba tu conexión y vuelve a intentarlo desde el propio mensaje. CoFlow conserva los mensajes que no hayan podido enviarse para que puedas reintentarlos." },
];

export default function HelpPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [activeTopic, setActiveTopic] = useState<HelpTopic>("all");
  const normalizedQuery = query.trim().toLocaleLowerCase("es");
  const filteredFaqs = useMemo(
    () => faqs.filter((item) => (activeTopic === "all" || item.topic === activeTopic) && `${item.question} ${item.answer}`.toLocaleLowerCase("es").includes(normalizedQuery)),
    [activeTopic, normalizedQuery]
  );

  return (
    <div className="mx-auto w-full max-w-5xl pb-6 sm:pb-10">
      <header>
        <div className="flex items-center gap-3 md:block">
          <button type="button" onClick={() => router.back()} aria-label="Volver" className="flex h-10 w-10 shrink-0 items-center justify-start text-brand-dark md:hidden">
            <ArrowLeft className="h-6 w-6" />
          </button>
          <div><p className="text-[11px] font-bold uppercase tracking-[0.15em] text-primary">Ayuda y confianza</p><h1 className="font-rounded text-3xl font-semibold tracking-[-0.04em] text-brand-dark sm:text-4xl">¿Cómo podemos ayudarte?</h1></div>
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
          className="h-13 w-full rounded-[18px] border border-black/[0.07] bg-[#fbfcfa] pl-12 pr-4 text-sm text-foreground shadow-[0_10px_30px_rgba(20,42,32,.045)] outline-none transition placeholder:text-muted focus:border-primary/40 focus:ring-4 focus:ring-primary/8"
        />
      </label>

      <section className="mt-6">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-base font-extrabold text-foreground">Temas principales</h2>
          {activeTopic !== "all" && <button type="button" onClick={() => setActiveTopic("all")} className="text-xs font-bold text-primary">Ver todos</button>}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
          {topics.map((topic) => {
            const Icon = topic.icon;
            return (
              <button
                key={topic.title}
                type="button"
                onClick={() => setActiveTopic((current) => current === topic.key ? "all" : topic.key)}
                aria-pressed={activeTopic === topic.key}
                className={`group flex min-h-36 flex-col rounded-[20px] border p-4 text-left transition sm:min-h-40 sm:p-5 ${activeTopic === topic.key ? "border-primary/30 bg-[#eef5f1] ring-1 ring-primary/15" : "border-black/[0.06] bg-[#fbfcfa] shadow-[0_8px_24px_rgba(20,42,32,.04)] hover:bg-[#f5f7f4]"}`}
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
            {(activeTopic !== "all" || query) && <button type="button" onClick={() => { setActiveTopic("all"); setQuery(""); }} className="text-xs font-bold text-primary">Limpiar filtros</button>}
          </div>
          <div className="mt-3 overflow-hidden rounded-[20px] border border-black/[0.06] bg-[#fbfcfa] shadow-[0_10px_30px_rgba(20,42,32,.04)]">
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

        <aside className="h-fit rounded-[20px] bg-brand-dark p-5 text-white shadow-[0_14px_36px_rgba(20,55,41,.16)]">
          <h2 className="text-base font-bold text-white">¿Necesitas más ayuda?</h2>
          <p className="mt-1 text-sm leading-6 text-white/65">Escríbenos explicando qué ha ocurrido y desde qué pantalla.</p>
          <a
            href="mailto:soporte@coflowapp.es?subject=Ayuda%20con%20CoFlow"
            className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-full bg-white px-4 text-sm font-bold text-brand-dark transition hover:bg-[#eff4f1]"
          >
            <Headphones className="h-4.5 w-4.5" />
            Contactar con soporte
          </a>
          <div className="mt-4 flex items-center gap-2 text-xs text-white/55"><Clock3 className="h-4 w-4 shrink-0" /><span>soporte@coflowapp.es</span></div>
        </aside>
      </div>

      <aside className="mt-7 flex flex-col gap-5 rounded-[20px] border border-black/[0.06] bg-[#fbfcfa] p-5 shadow-[0_10px_30px_rgba(20,42,32,.04)] sm:flex-row sm:items-center sm:p-6">
        <ShieldCheck className="h-8 w-8 shrink-0 text-primary" strokeWidth={1.7} />
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-extrabold text-foreground">CoFlow está aquí para ayudarte</h2>
          <p className="mt-1 text-sm leading-6 text-secondary">Construimos una comunidad segura, transparente y confiable. Si tienes cualquier duda, contacta con nosotros.</p>
        </div><div className="flex flex-wrap gap-x-4 gap-y-2 text-xs font-bold text-primary-dark"><Link href="/legal/normas-comunidad">Normas</Link><Link href="/legal/privacidad">Privacidad</Link><Link href="/legal/reportar">Reportar contenido</Link></div>
      </aside>
    </div>
  );
}
