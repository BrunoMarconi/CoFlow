import type { User } from "@/types/auth";

export default function ProfileInfo({ user }: { user: User }) {
  const rows = [
    {
      label: "Correo electrónico",
      value: user.email,
      icon: MailIcon,
    },
    {
      label: "Teléfono",
      value: user.phone || "Añadir teléfono",
      icon: PhoneIcon,
      missing: !user.phone,
    },
    {
      label: "Cuestionario de convivencia",
      value: user.onboarding_completed
        ? "Completado"
        : "Pendiente",
      icon: ClipboardIcon,
      positive: user.onboarding_completed,
    },
  ];

  return (
    <section className="rounded-[1.75rem] border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.15em] text-green-600">
          Datos personales
        </p>

        <h2 className="mt-2 text-xl font-bold text-[#163B2E]">
          Información
        </h2>

        <p className="mt-2 text-sm leading-6 text-gray-500">
          Esta información ayuda a identificar tu cuenta y mantener tu perfil
          actualizado.
        </p>
      </div>

      <div className="mt-6 space-y-3">
        {rows.map((row) => {
          const Icon = row.icon;

          return (
            <div
              key={row.label}
              className="flex items-center gap-4 rounded-2xl bg-[#F8FAFC] p-4"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-green-600 shadow-sm">
                <Icon />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-gray-500">
                  {row.label}
                </p>

                <p
                  className={`mt-1 truncate text-sm font-bold ${
                    row.missing
                      ? "text-gray-400"
                      : row.positive
                        ? "text-green-700"
                        : "text-[#163B2E]"
                  }`}
                >
                  {row.value}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function MailIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="M22 16.9v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.2 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.69 2.8a2 2 0 0 1-.45 2.11L8.1 9.9a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.33 1.84.56 2.8.69A2 2 0 0 1 22 16.9Z" />
    </svg>
  );
}

function ClipboardIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <rect x="5" y="4" width="14" height="17" rx="2" />
      <path d="M9 4V2h6v2" />
      <path d="m9 13 2 2 4-4" />
    </svg>
  );
}