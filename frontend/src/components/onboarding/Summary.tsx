interface SummaryProps {
  answeredCount: number;
  totalCount: number;
}

export default function Summary({ answeredCount, totalCount }: SummaryProps) {
  return (
    <div className="mt-10 grid gap-4 sm:grid-cols-2">
      <div className="rounded-2xl bg-[#F8FAFC] p-5">
        <p className="text-3xl font-bold text-[#163B2E]">{answeredCount}</p>
        <p className="mt-1 text-sm text-gray-500">Respuestas</p>
      </div>

      <div className="rounded-2xl bg-[#F8FAFC] p-5">
        <p className="text-3xl font-bold text-[#163B2E]">
          {totalCount === 0 ? 0 : Math.round((answeredCount / totalCount) * 100)}%
        </p>
        <p className="mt-1 text-sm text-gray-500">Perfil completado</p>
      </div>
    </div>
  );
}
