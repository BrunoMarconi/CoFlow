import { ChatIcon } from "./icons";

const infoItems = [
  { label: "Miembros actuales", value: "3 de 4" },
  { label: "Plazas abiertas", value: "1 disponible" },
  { label: "Aportación mensual", value: "320€ / persona" },
  { label: "Fecha de entrada", value: "Disponible ya" },
  { label: "Tipo de acceso", value: "Entrada directa" },
] as const;

export default function CommunityPreview() {
  return (
    <section className="bg-brand/5 px-4 py-12 sm:px-6 sm:py-24 lg:py-28">
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
          <div className="overflow-hidden rounded-[1.75rem] border border-line">
            <div className="relative min-h-56 bg-linear-to-br from-brand-dark via-brand to-green-400 p-7">
              <div className="absolute -right-12 -top-14 h-48 w-48 rounded-full bg-white/10" />
              <div className="absolute -bottom-16 -left-10 h-52 w-52 rounded-full bg-green-100/10" />

              <div className="relative flex flex-wrap items-start gap-2">
                <span className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold text-white">
                  Teatinos, Málaga
                </span>

                <span className="rounded-full border border-white/20 bg-black/10 px-4 py-2 text-xs font-bold text-white">
                  Comunidad abierta
                </span>
              </div>

              <div className="relative mt-16 flex items-end gap-4">
                <span className="flex h-20 w-20 items-center justify-center rounded-2xl border border-white/20 bg-white/15 text-2xl font-black text-white backdrop-blur">
                  CT
                </span>

                <div>
                  <p className="text-sm font-semibold text-green-100">
                    Comunidad de CoFlow
                  </p>
                  <p className="mt-2 text-3xl font-black text-white">
                    Casa Teatinos
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <p className="text-xs font-bold uppercase tracking-wider text-brand">
                Sobre la comunidad
              </p>

              <p className="mt-3 text-sm leading-7 text-muted">
                Somos una comunidad tranquila de estudiantes y trabajadores.
                Buscamos una persona organizada, respetuosa y con ganas de
                crear un buen ambiente en casa.
              </p>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {infoItems.map((item) => (
                  <div
                    key={item.label}
                    className="rounded-xl bg-surface-soft p-4"
                  >
                    <p className="text-xs font-semibold text-muted">
                      {item.label}
                    </p>
                    <p className="mt-1 text-sm font-bold text-brand-dark">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
