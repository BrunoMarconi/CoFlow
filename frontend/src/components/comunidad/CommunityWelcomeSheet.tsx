"use client";

import BottomSheet from "@/components/ui/BottomSheet";

export default function CommunityWelcomeSheet({ onClose }: { onClose: () => void }) {
  return (
    <BottomSheet onClose={onClose} ariaLabel="Antes de dar el paso" className="sm:max-w-md">
      <div className="flex min-h-[52dvh] flex-col px-6 pb-[calc(1.5rem+var(--safe-bottom))] pt-2 sm:min-h-0 sm:px-8 sm:pb-8 sm:pt-4">
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/8 text-primary-dark">
            <VideoIcon />
          </div>

          <h2 className="mt-6 text-2xl font-extrabold tracking-tight text-brand-dark">
            Antes de dar el paso
          </h2>

          <p className="mt-3 max-w-xs text-sm leading-6 text-secondary">
            Muchas de las mejores convivencias empiezan con una videollamada. Así os conocéis un poco antes de decidir — sin presión, solo para ir con más confianza.
          </p>

          <p className="mt-4 max-w-xs text-xs leading-5 text-muted">
            Es un paso sencillo que ayuda a que la convivencia arranque con buen pie.
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-6 flex h-13 w-full items-center justify-center rounded-14 bg-primary text-sm font-bold text-white shadow-button transition hover:bg-primary-hover"
        >
          Entendido
        </button>
      </div>
    </BottomSheet>
  );
}

function VideoIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7" aria-hidden="true">
      <rect x="2.5" y="6" width="14" height="12" rx="2.5" />
      <path d="M16.5 10.5 21 8v8l-4.5-2.5" />
    </svg>
  );
}
