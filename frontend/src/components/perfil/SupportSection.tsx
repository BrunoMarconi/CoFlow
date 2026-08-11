import ListRow from "@/components/perfil/ListRow";

export default function SupportSection() {
  return (
    <div className="divide-y divide-border rounded-18 border border-border bg-surface">
      <ListRow icon={<HelpIcon />} label="Centro de ayuda" href="/ayuda" />
      <ListRow icon={<FlagIcon />} label="Reportar un problema" />
      <ListRow icon={<FeedbackIcon />} label="Enviar feedback" />
    </div>
  );
}

function HelpIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-4.5 w-4.5" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9a2.5 2.5 0 0 1 5 0c0 1.7-2.5 2-2.5 3.5" />
      <path d="M12 17h.01" />
    </svg>
  );
}

function FlagIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-4.5 w-4.5" aria-hidden="true">
      <path d="M4 22V4" />
      <path d="M4 4h14l-2 4 2 4H4" />
    </svg>
  );
}

function FeedbackIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-4.5 w-4.5" aria-hidden="true">
      <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z" />
      <path d="M8 10h8" />
      <path d="M8 14h5" />
    </svg>
  );
}
