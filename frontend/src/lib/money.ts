export function formatEuros(value: string | null): string {
  if (value === null) return "—";

  const amount = Number(value);
  if (Number.isNaN(amount)) return "—";

  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(amount);
}

const MONTH_NAMES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

export function formatMonthLabel(year: number, month: number): string {
  const name = MONTH_NAMES[month - 1] ?? "";
  return `${name.charAt(0).toUpperCase()}${name.slice(1)} ${year}`;
}
