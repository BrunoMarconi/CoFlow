import Link from "next/link";
import type { OnboardingAnswers } from "@/types/onboarding";

interface PreferencesProps {
  answers: Partial<OnboardingAnswers>;
}

type PreferenceKey = keyof OnboardingAnswers;

type PreferenceDefinition = {
  key: PreferenceKey;
  label: string;
  shortLabel: string;
  icon: string;
};

const featuredPreferences: PreferenceDefinition[] = [
  {
    key: "cleanliness",
    label: "Nivel de limpieza",
    shortLabel: "Limpieza",
    icon: "sparkles",
  },
  {
    key: "noise",
    label: "Ambiente en casa",
    shortLabel: "Ambiente",
    icon: "volume",
  },
  {
    key: "visits",
    label: "Visitas",
    shortLabel: "Visitas",
    icon: "users",
  },
  {
    key: "smoking",
    label: "Tabaco",
    shortLabel: "Tabaco",
    icon: "smoking",
  },
  {
    key: "pets",
    label: "Mascotas",
    shortLabel: "Mascotas",
    icon: "paw",
  },
  {
    key: "space",
    label: "Espacio personal",
    shortLabel: "Espacio personal",
    icon: "user",
  },
];

const allPreferences: PreferenceDefinition[] = [
  {
    key: "cleanliness",
    label: "Nivel de limpieza profunda",
    shortLabel: "Limpieza",
    icon: "sparkles",
  },
  {
    key: "dishes",
    label: "Platos y fregadero",
    shortLabel: "Platos",
    icon: "dishes",
  },
  {
    key: "common_objects",
    label: "Objetos en zonas comunes",
    shortLabel: "Zonas comunes",
    icon: "home",
  },
  {
    key: "noise",
    label: "Ambiente ideal en casa",
    shortLabel: "Ambiente",
    icon: "volume",
  },
  {
    key: "visits",
    label: "Visitas inesperadas",
    shortLabel: "Visitas",
    icon: "users",
  },
  {
    key: "sleepovers",
    label: "Invitados que se quedan a dormir",
    shortLabel: "Pernoctaciones",
    icon: "moon",
  },
  {
    key: "wake_up",
    label: "Hora habitual de levantarse",
    shortLabel: "Rutina",
    icon: "sun",
  },
  {
    key: "night_noise",
    label: "Ruido después de las 22:00",
    shortLabel: "Ruido nocturno",
    icon: "moon",
  },
  {
    key: "smoking",
    label: "Postura sobre el tabaco",
    shortLabel: "Tabaco",
    icon: "smoking",
  },
  {
    key: "alcohol",
    label: "Postura sobre el alcohol",
    shortLabel: "Alcohol",
    icon: "glass",
  },
  {
    key: "pets",
    label: "Convivencia con mascotas",
    shortLabel: "Mascotas",
    icon: "paw",
  },
  {
    key: "bills",
    label: "Gestión de suministros",
    shortLabel: "Facturas",
    icon: "wallet",
  },
  {
    key: "food",
    label: "Gestión de la comida",
    shortLabel: "Comida",
    icon: "food",
  },
  {
    key: "communication",
    label: "Estilo de comunicación",
    shortLabel: "Comunicación",
    icon: "message",
  },
  {
    key: "conflicts",
    label: "Resolución de conflictos",
    shortLabel: "Conflictos",
    icon: "handshake",
  },
  {
    key: "rules",
    label: "Reglas de convivencia",
    shortLabel: "Reglas",
    icon: "clipboard",
  },
  {
    key: "culture",
    label: "Apertura cultural",
    shortLabel: "Cultura",
    icon: "globe",
  },
  {
    key: "space",
    label: "Necesidad de espacio personal",
    shortLabel: "Espacio personal",
    icon: "user",
  },
  {
    key: "lifestyle",
    label: "Tipo de convivencia buscada",
    shortLabel: "Convivencia",
    icon: "community",
  },
];

export default function Preferences({ answers }: PreferencesProps) {
  const answeredCount = allPreferences.filter(
    (preference) => answers[preference.key]
  ).length;

  if (answeredCount === 0) {
    return (
      <section className="rounded-[1.75rem] border border-gray-100 bg-white p-6 shadow-sm">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-50 text-green-600">
          <PreferencesIcon />
        </div>

        <h2 className="mt-5 text-xl font-bold text-[#163B2E]">
          Preferencias de convivencia
        </h2>

        <p className="mt-3 text-sm leading-6 text-gray-500">
          Completa el cuestionario para que otras personas puedan saber cómo
          sería convivir contigo.
        </p>

        <Link
          href="/onboarding"
          className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-green-500 px-5 text-sm font-bold text-white transition hover:bg-green-600"
        >
          Completar cuestionario
        </Link>
      </section>
    );
  }

  return (
    <section className="rounded-[1.75rem] border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-green-600">
            Tu forma de convivir
          </p>

          <h2 className="mt-2 text-xl font-bold text-[#163B2E]">
            Preferencias
          </h2>

          <p className="mt-2 max-w-lg text-sm leading-6 text-gray-500">
            Una vista rápida de tus hábitos y del tipo de hogar que buscas.
          </p>
        </div>

        <Link
          href="/onboarding?edit=true"
          className="shrink-0 rounded-xl bg-green-50 px-3 py-2 text-xs font-bold text-green-700 transition hover:bg-green-100"
        >
          Editar
        </Link>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {featuredPreferences.map((preference) => {
          const value = answers[preference.key];

          if (!value) return null;

          return (
            <div
              key={preference.key}
              className="rounded-2xl border border-gray-100 bg-[#F8FAFC] p-4"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-green-600 shadow-sm">
                  <PreferenceIcon name={preference.icon} />
                </span>

                <p className="text-xs font-bold uppercase tracking-wide text-gray-500">
                  {preference.shortLabel}
                </p>
              </div>

              <p className="mt-3 text-sm font-bold leading-6 text-[#163B2E]">
                {value}
              </p>
            </div>
          );
        })}
      </div>

      <details className="group mt-5 overflow-hidden rounded-2xl border border-gray-100">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 bg-white px-4 py-4 text-sm font-bold text-[#163B2E] transition hover:bg-gray-50">
          <span>
            Ver todas las preferencias
            <span className="ml-2 text-xs font-semibold text-gray-400">
              {answeredCount}/19
            </span>
          </span>

          <span className="transition duration-200 group-open:rotate-180">
            <ChevronIcon />
          </span>
        </summary>

        <div className="border-t border-gray-100 bg-[#FBFCFB] p-4">
          <div className="space-y-2">
            {allPreferences.map((preference) => {
              const value = answers[preference.key];

              if (!value) return null;

              return (
                <div
                  key={preference.key}
                  className="rounded-xl bg-white px-4 py-3"
                >
                  <p className="text-xs font-semibold text-gray-500">
                    {preference.label}
                  </p>

                  <p className="mt-1 text-sm font-bold leading-5 text-[#163B2E]">
                    {value}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </details>
    </section>
  );
}

function PreferencesIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-6 w-6"
      aria-hidden="true"
    >
      <path d="M4 21v-7" />
      <path d="M4 10V3" />
      <path d="M12 21v-9" />
      <path d="M12 8V3" />
      <path d="M20 21v-5" />
      <path d="M20 12V3" />
      <path d="M1 14h6" />
      <path d="M9 8h6" />
      <path d="M17 16h6" />
    </svg>
  );
}

function ChevronIcon() {
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
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function PreferenceIcon({ name }: { name: string }) {
  const commonProps = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className: "h-5 w-5",
    "aria-hidden": true,
  };

  switch (name) {
    case "volume":
      return (
        <svg {...commonProps}>
          <path d="M11 5 6 9H2v6h4l5 4Z" />
          <path d="M15.5 8.5a5 5 0 0 1 0 7" />
          <path d="M18.5 5.5a9 9 0 0 1 0 13" />
        </svg>
      );

    case "users":
    case "community":
      return (
        <svg {...commonProps}>
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        </svg>
      );

    case "paw":
      return (
        <svg {...commonProps}>
          <circle cx="8" cy="8" r="2" />
          <circle cx="16" cy="8" r="2" />
          <circle cx="5" cy="13" r="2" />
          <circle cx="19" cy="13" r="2" />
          <path d="M12 12c-3 0-5 2.2-5 4.5S9 20 12 20s5-1.2 5-3.5S15 12 12 12Z" />
        </svg>
      );

    case "moon":
      return (
        <svg {...commonProps}>
          <path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8Z" />
        </svg>
      );

    case "sun":
      return (
        <svg {...commonProps}>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2" />
          <path d="M12 20v2" />
          <path d="m4.93 4.93 1.42 1.42" />
          <path d="m17.66 17.66 1.41 1.41" />
          <path d="M2 12h2" />
          <path d="M20 12h2" />
        </svg>
      );

    case "wallet":
      return (
        <svg {...commonProps}>
          <path d="M20 7V5a2 2 0 0 0-2-2H5a3 3 0 0 0 0 6h15v10H5a3 3 0 0 1-3-3V6" />
          <path d="M16 13h2" />
        </svg>
      );

    case "message":
      return (
        <svg {...commonProps}>
          <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z" />
        </svg>
      );

    case "globe":
      return (
        <svg {...commonProps}>
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18" />
          <path d="M12 3a15 15 0 0 1 0 18" />
          <path d="M12 3a15 15 0 0 0 0 18" />
        </svg>
      );

    case "user":
      return (
        <svg {...commonProps}>
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21a8 8 0 0 1 16 0" />
        </svg>
      );

    case "home":
      return (
        <svg {...commonProps}>
          <path d="m3 11 9-8 9 8" />
          <path d="M5 10v11h14V10" />
        </svg>
      );

    default:
      return (
        <svg {...commonProps}>
          <path d="m12 3 1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5Z" />
          <path d="m19 15 .8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8Z" />
        </svg>
      );
  }
}