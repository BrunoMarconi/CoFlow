export default function RoommateIntentPrompt({
  submitting,
  onAnswer,
}: {
  submitting: boolean;
  onAnswer: (lookingForRoommates: boolean) => void;
}) {
  return (
    <div className="mx-auto flex min-h-[50vh] w-full max-w-xl flex-col items-center justify-center text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand/10 text-brand-dark">
        <UsersIcon />
      </span>

      <h1 className="mt-6 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
        ¿También estás buscando compañeros de piso?
      </h1>

      <p className="mt-3 text-base leading-7 text-muted">
        Puedes ser propietario y, a la vez, buscar personas con las que
        compartir vivienda. Puedes cambiar esto cuando quieras desde tu
        perfil.
      </p>

      <div className="mt-7 flex w-full flex-col gap-3">
        <button
          type="button"
          disabled={submitting}
          onClick={() => onAnswer(true)}
          className="flex h-14 w-full items-center justify-center rounded-2xl bg-brand px-6 text-sm font-bold text-white shadow-lg shadow-brand/20 transition hover:-translate-y-0.5 hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
        >
          Sí, también busco compañeros
        </button>

        <button
          type="button"
          disabled={submitting}
          onClick={() => onAnswer(false)}
          className="flex h-14 w-full items-center justify-center rounded-2xl border border-line bg-surface px-6 text-sm font-bold text-foreground transition hover:bg-surface-soft disabled:cursor-not-allowed disabled:opacity-60"
        >
          No, solo quiero publicar mi vivienda
        </button>
      </div>
    </div>
  );
}

function UsersIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-7 w-7"
      aria-hidden="true"
    >
      <circle cx="8" cy="8" r="3" />
      <circle cx="17" cy="7" r="2.5" />
      <path d="M2.5 20a5.5 5.5 0 0 1 11 0" />
      <path d="M14 14.5a4.5 4.5 0 0 1 7.5 3.5" />
    </svg>
  );
}
