import { ChatIcon } from "./icons";

const previewMessages = [
  {
    id: "m1",
    own: false,
    name: "Marta",
    initials: "M",
    text: "¡Hola! Bienvenido a Casa Teatinos 👋",
    time: "10:24",
  },
  {
    id: "m2",
    own: true,
    name: "Tú",
    initials: "Tú",
    text: "¡Genial, gracias! ¿Cuándo puedo pasar a conocer el piso?",
    time: "10:26",
  },
  {
    id: "m3",
    own: false,
    name: "Marta",
    initials: "M",
    text: "Este finde tenemos hueco, te paso la ubicación por aquí.",
    time: "10:27",
  },
] as const;

export default function CommunityPreview() {
  return (
    <section className="bg-brand/5 px-5 py-12 sm:px-8 sm:py-24 lg:py-28">
      <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-brand">
            Todo en un mismo lugar
          </p>

          <h2 className="mt-4 text-3xl font-black tracking-[-0.03em] text-brand-dark sm:text-4xl lg:text-5xl">
            Conoce la comunidad antes de solicitar entrar.
          </h2>

          <p className="mt-5 text-lg leading-8 text-muted">
            Consulta quién vive allí, cómo se organizan y qué esperan de la
            persona nueva.
          </p>

          <div className="mt-7 flex items-center gap-3 rounded-2xl border border-line bg-white px-5 py-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
              <ChatIcon />
            </span>
            <p className="text-sm leading-6 text-muted">
              Cuando te incorporas a una comunidad, se abre su chat grupal
              para que hables directamente con sus miembros.
            </p>
          </div>
        </div>

        <div className="rounded-[2.25rem] border border-white bg-white p-3 shadow-[0_25px_70px_rgba(22,59,46,0.12)]">
          <div className="overflow-hidden rounded-[1.75rem] border border-line bg-surface-soft">
            <div className="flex items-center gap-3 border-b border-line bg-white px-5 py-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-brand-dark to-brand text-sm font-black text-white">
                CT
              </span>

              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-brand-dark">
                  Casa Teatinos
                </p>
                <p className="text-xs font-semibold text-muted">
                  4 miembros · Chat grupal
                </p>
              </div>
            </div>

            <div className="space-y-3 p-4 sm:p-5">
              {previewMessages.map((message) => (
                <PreviewMessageBubble key={message.id} message={message} />
              ))}
            </div>

            <div className="flex items-center gap-2 border-t border-line bg-white p-3 sm:p-4">
              <div className="h-11 flex-1 rounded-2xl bg-surface-soft" />

              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand text-white">
                <SendIcon />
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function PreviewMessageBubble({
  message,
}: {
  message: (typeof previewMessages)[number];
}) {
  return (
    <div
      className={`flex items-end gap-2 ${
        message.own ? "flex-row-reverse" : "flex-row"
      }`}
    >
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
          message.own ? "bg-brand text-white" : "bg-brand-dark text-white"
        }`}
      >
        {message.initials}
      </div>

      <div
        className={`max-w-[78%] rounded-2xl px-4 py-2.5 ${
          message.own
            ? "rounded-br-md bg-brand text-white"
            : "rounded-bl-md bg-white text-brand-dark"
        }`}
      >
        <p className="text-sm leading-6">{message.text}</p>

        <p
          className={`mt-1 text-[10px] font-semibold ${
            message.own ? "text-white/70" : "text-muted"
          }`}
        >
          {message.time}
        </p>
      </div>
    </div>
  );
}

function SendIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="m22 2-7 20-4-9-9-4Z" />
      <path d="M22 2 11 13" />
    </svg>
  );
}
