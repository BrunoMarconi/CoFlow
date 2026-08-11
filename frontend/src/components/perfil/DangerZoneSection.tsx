"use client";

export default function DangerZoneSection({ onLogout }: { onLogout: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 pt-2 pb-6 text-center">
      <button
        type="button"
        onClick={onLogout}
        className="text-sm font-bold text-red-500 transition hover:text-red-600"
      >
        Cerrar sesión
      </button>

      {/* Sin flujo de baja de cuenta implementado todavía en backend —
          se deja visible pero inerte, discreto a propósito. */}
      <span className="text-xs font-semibold text-muted/70">
        Eliminar cuenta
      </span>
    </div>
  );
}
