const FAQ = [
  {
    question: "¿Cuándo serán visibles mis pisos?",
    answer:
      "Todavía no lo son. CoFlow está preparando el lanzamiento público de viviendas. Mientras tanto, tus pisos quedan guardados en tu cuenta.",
  },
  {
    question: "¿Qué significa marcar un piso como preparado?",
    answer:
      "Indica que ya has completado toda la información necesaria. No implica revisión ni publicación automática.",
  },
  {
    question: "¿Puedo tener varios pisos?",
    answer: "Sí, puedes registrar y gestionar tantos pisos como quieras.",
  },
  {
    question: "¿Puedo seguir usando CoFlow como usuario normal?",
    answer:
      "Sí. Tener un perfil de propietario no cambia tu cuenta ni tus funciones habituales en CoFlow.",
  },
];

export default function AyudaPropietariosPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
        Ayuda para propietarios
      </h1>

      <div className="mt-6 space-y-3">
        {FAQ.map((item) => (
          <details
            key={item.question}
            className="rounded-2xl border border-line bg-surface p-4"
          >
            <summary className="cursor-pointer text-sm font-bold text-foreground">
              {item.question}
            </summary>
            <p className="mt-2 text-sm leading-6 text-muted">
              {item.answer}
            </p>
          </details>
        ))}
      </div>
    </div>
  );
}
