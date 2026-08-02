"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export default function HowWeCalculateIt() {
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-4 rounded-2xl border border-line bg-surface">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between px-5 py-4 text-left text-sm font-bold text-foreground"
      >
        Cómo lo calculamos
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 transition-transform",
            open && "rotate-180"
          )}
        />
      </button>

      {open && (
        <div className="space-y-3 border-t border-line px-5 py-4 text-sm leading-6 text-muted">
          <p>
            Analizamos los últimos meses completos de tus cuentas conectadas
            para identificar qué ingresos se repiten mes a mes (nómina,
            transferencias recurrentes, etc.) y qué gastos son fijos o
            variables.
          </p>
          <p>
            A partir de tus ingresos recurrentes y tu margen mensual medio
            (ingresos menos gastos), aplicamos un límite conservador: nunca
            más del 35 % de tus ingresos recurrentes ni más del 70 % de tu
            margen medio, con un tope adicional del 40 % de tus ingresos
            recurrentes en cualquier caso.
          </p>
          <p>
            No mostramos tus movimientos ni el detalle de tus gastos a los
            propietarios: solo el resultado que decidas compartir.
          </p>
          <p className="font-semibold text-foreground">
            Este resultado no garantiza el pago del alquiler ni sustituye la
            decisión del propietario o la inmobiliaria.
          </p>
        </div>
      )}
    </div>
  );
}
