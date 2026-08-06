interface SummaryProps {
  answeredCount: number;
  totalCount: number;
}

export default function Summary({ answeredCount, totalCount }: SummaryProps) {
  return (
    <div className="mt-10 grid gap-4 sm:grid-cols-2">
      <div className="rounded-18 bg-surface-muted p-5">
        <p className="text-3xl font-bold text-brand-dark">{answeredCount}</p>
        <p className="mt-1 text-sm text-muted">Respuestas</p>
      </div>

      <div className="rounded-18 bg-surface-muted p-5">
        <p className="text-3xl font-bold text-brand-dark">
          {totalCount === 0 ? 0 : Math.round((answeredCount / totalCount) * 100)}%
        </p>
        <p className="mt-1 text-sm text-muted">Perfil completado</p>
      </div>
    </div>
  );
}
