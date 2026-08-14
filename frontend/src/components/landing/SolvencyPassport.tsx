import { CheckItem } from "./shared";
import { ShieldIcon } from "./icons";

const passportPoints = [
  "Conectas tu banco de forma segura, sin enseñar tus extractos",
  "Genera un resumen verificado de tu capacidad de pago",
  "Compartes un enlace cuando tú decidas, nunca tus movimientos",
] as const;

export default function SolvencyPassport() {
  return (
    <section className="px-5 py-12 sm:px-8 sm:py-24 lg:py-28">
      <div className="mx-auto max-w-7xl">
        <div className="grid items-center gap-10 rounded-[2.5rem] border border-line bg-white p-7 shadow-sm sm:p-12 lg:grid-cols-2 lg:gap-16 lg:p-16">
          <div className="order-2 flex justify-center lg:order-1">
            <div className="relative flex h-56 w-56 items-center justify-center rounded-full bg-brand/5 sm:h-72 sm:w-72">
              <div className="flex h-32 w-32 items-center justify-center rounded-[1.75rem] bg-white text-brand shadow-xl sm:h-40 sm:w-40">
                <span className="[&>svg]:h-14 [&>svg]:w-14 sm:[&>svg]:h-16 sm:[&>svg]:w-16">
                  <ShieldIcon />
                </span>
              </div>
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <span className="inline-flex rounded-full bg-brand-dark px-4 py-2 text-xs font-bold uppercase tracking-wider text-white">
              Próximamente
            </span>

            <h2 className="mt-6 max-w-xl text-3xl font-black tracking-[-0.03em] text-brand-dark sm:text-4xl lg:text-5xl">
              Un pasaporte de solvencia, sin enseñar tus extractos a nadie.
            </h2>

            <p className="mt-5 max-w-xl text-lg leading-8 text-muted">
              Demuestra que puedes pagar el alquiler sin mandar documentos
              privados por chat. CoFlow generará un resumen verificado de tu
              situación económica que decides cuándo y con quién compartir.
            </p>

            <div className="mt-7 space-y-3 text-brand-dark">
              {passportPoints.map((point) => (
                <CheckItem key={point} text={point} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
