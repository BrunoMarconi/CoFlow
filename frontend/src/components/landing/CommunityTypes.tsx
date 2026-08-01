import { CheckItem, SectionHeader } from "./shared";
import { OpenDoorIcon, ShieldIcon } from "./icons";

export default function CommunityTypes() {
  return (
    <section
      id="comunidades"
      className="scroll-mt-24 px-4 py-12 sm:px-6 sm:py-24 lg:py-28"
    >
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          eyebrow="Tú decides cómo crecer"
          title="Comunidades abiertas o con solicitud"
          description="Cada comunidad elige cómo entran nuevos miembros según el nivel de control que necesite."
        />

        <div className="mt-8 grid gap-6 sm:mt-12 lg:grid-cols-2">
          <article className="relative overflow-hidden rounded-[2rem] border border-brand/25 bg-brand/5 p-7 sm:p-9">
            <div className="absolute -right-14 -top-14 h-44 w-44 rounded-full bg-brand/15" />

            <div className="relative">
              <span className="inline-flex rounded-full bg-brand px-4 py-2 text-xs font-bold uppercase tracking-wider text-white">
                Entrada directa
              </span>

              <div className="mt-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-brand shadow-sm">
                <OpenDoorIcon />
              </div>

              <h3 className="mt-7 text-3xl font-black tracking-tight text-brand-dark">
                Comunidad abierta
              </h3>

              <p className="mt-4 max-w-xl text-base leading-7 text-muted">
                Entra directamente en la comunidad mientras haya plazas
                disponibles. Ideal para comunidades flexibles.
              </p>

              <div className="mt-7 space-y-3 text-brand-dark">
                <CheckItem text="Acceso inmediato" />
                <CheckItem text="Sin esperar aprobación" />
                <CheckItem text="Preferencias visibles antes de entrar" />
              </div>
            </div>
          </article>

          <article className="relative overflow-hidden rounded-[2rem] border border-line bg-white p-7 shadow-sm sm:p-9">
            <div className="absolute -right-14 -top-14 h-44 w-44 rounded-full bg-surface-soft" />

            <div className="relative">
              <span className="inline-flex rounded-full bg-brand-dark px-4 py-2 text-xs font-bold uppercase tracking-wider text-white">
                Aprobación necesaria
              </span>

              <div className="mt-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand/10 text-brand">
                <ShieldIcon />
              </div>

              <h3 className="mt-7 text-3xl font-black tracking-tight text-brand-dark">
                Comunidad con solicitud
              </h3>

              <p className="mt-4 max-w-xl text-base leading-7 text-muted">
                El administrador revisa tu perfil y decide. Ideal cuando la
                comunidad quiere conocer mejor a la persona antes de aceptarla.
              </p>

              <div className="mt-7 space-y-3 text-brand-dark">
                <CheckItem text="Revisan tu perfil" />
                <CheckItem text="Puedes incluir un mensaje" />
                <CheckItem text="El administrador decide" />
              </div>
            </div>
          </article>
        </div>

        <p className="mx-auto mt-10 max-w-3xl text-center text-sm font-semibold leading-7 text-muted">
          Una invitación para un compañero actual no es lo mismo que una
          solicitud para ocupar una plaza: la invitación la envía la
          comunidad, la solicitud la envías tú.
        </p>
      </div>
    </section>
  );
}
