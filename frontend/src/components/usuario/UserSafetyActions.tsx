"use client";

import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import BottomSheet from "@/components/ui/BottomSheet";
import { toast } from "@/components/ui/Toast";
import { getCommunityErrorMessage } from "@/lib/communityErrors";
import { blockUser, reportUser } from "@/services/users";
import type { UserReportReason } from "@/types/userSafety";

const REPORT_REASONS: Array<{
  value: UserReportReason;
  label: string;
}> = [
  { value: "HARASSMENT", label: "Acoso o comportamiento intimidatorio" },
  { value: "SPAM", label: "Spam o contenido engañoso" },
  { value: "IMPERSONATION", label: "Suplantación de identidad" },
  { value: "UNSAFE_BEHAVIOUR", label: "Comportamiento que parece inseguro" },
  { value: "INAPPROPRIATE_CONTENT", label: "Contenido inapropiado" },
  { value: "OTHER", label: "Otro motivo" },
];

type Step = "menu" | "report" | "block";

export default function UserSafetyActions({
  open,
  userId,
  firstName,
  onClose,
  onBlocked,
}: {
  open: boolean;
  userId: string;
  firstName: string;
  onClose: () => void;
  onBlocked?: () => void;
}) {
  const [step, setStep] = useState<Step>("menu");
  const [reason, setReason] = useState<UserReportReason | null>(null);
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function close() {
    if (submitting) return;
    setStep("menu");
    setReason(null);
    setDetails("");
    setError("");
    onClose();
  }

  async function submitReport() {
    if (!reason || submitting) return;
    setSubmitting(true);
    setError("");
    let completed = false;
    try {
      await reportUser(userId, {
        reason,
        details: details.trim() || undefined,
      });
      toast.success("Gracias. Hemos recibido tu reporte.");
      completed = true;
    } catch (requestError) {
      setError(
        getCommunityErrorMessage(
          requestError,
          "No hemos podido enviar el reporte. Inténtalo de nuevo."
        )
      );
    } finally {
      setSubmitting(false);
    }
    if (completed) closeAfterSubmit();
  }

  async function confirmBlock() {
    if (submitting) return;
    setSubmitting(true);
    setError("");
    let completed = false;
    try {
      await blockUser(userId);
      toast.success(`${firstName} ha sido bloqueado.`);
      completed = true;
    } catch (requestError) {
      setError(
        getCommunityErrorMessage(
          requestError,
          "No hemos podido bloquear a esta persona."
        )
      );
    } finally {
      setSubmitting(false);
    }
    if (completed) {
      closeAfterSubmit();
      onBlocked?.();
    }
  }

  function closeAfterSubmit() {
    setStep("menu");
    setReason(null);
    setDetails("");
    setError("");
    onClose();
  }

  return (
    <AnimatePresence>
      {open && (
        <BottomSheet
          onClose={close}
          closeOnOutsideClick={!submitting}
          ariaLabel="Seguridad del perfil"
          className="sm:max-w-md"
        >
          <div className="overflow-y-auto px-5 pb-[calc(var(--safe-bottom)+1.25rem)] pt-2 sm:px-6 sm:pb-6">
            {step === "menu" && (
              <>
                <SheetHeader
                  title={`Opciones sobre ${firstName}`}
                  description="Tu seguridad y tranquilidad son lo primero."
                  onClose={close}
                />
                <div className="mt-5 overflow-hidden rounded-18 border border-border bg-surface">
                  <ActionButton
                    title="Reportar perfil"
                    description="Cuéntanos si algo no encaja con las normas de CoFlow."
                    onClick={() => setStep("report")}
                  />
                  <ActionButton
                    title={`Bloquear a ${firstName}`}
                    description="No podréis veros, conectar ni enviaros mensajes."
                    destructive
                    onClick={() => setStep("block")}
                  />
                </div>
              </>
            )}

            {step === "report" && (
              <>
                <SheetHeader
                  title="¿Qué ha ocurrido?"
                  description="El reporte es confidencial. No informaremos a la otra persona de quién lo ha enviado."
                  onBack={() => setStep("menu")}
                  onClose={close}
                />
                <div className="mt-5 space-y-2">
                  {REPORT_REASONS.map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setReason(item.value)}
                      aria-pressed={reason === item.value}
                      className={`flex min-h-13 w-full items-center justify-between rounded-14 border px-4 py-3 text-left text-sm font-bold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground ${
                        reason === item.value
                          ? "border-foreground bg-black text-white"
                          : "border-border bg-surface text-foreground hover:border-secondary/50"
                      }`}
                    >
                      {item.label}
                      <span
                        className={`h-4 w-4 rounded-full border ${
                          reason === item.value
                            ? "border-white bg-white shadow-[inset_0_0_0_4px_#000]"
                            : "border-secondary/60"
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <label className="mt-4 block">
                  <span className="text-xs font-bold text-secondary">
                    Añade contexto si lo necesitas (opcional)
                  </span>
                  <textarea
                    value={details}
                    onChange={(event) => setDetails(event.target.value.slice(0, 500))}
                    rows={3}
                    placeholder="No incluyas datos sensibles."
                    className="mt-2 w-full resize-none rounded-14 border border-border bg-surface px-4 py-3 text-sm text-foreground shadow-soft outline-none transition placeholder:text-muted hover:border-secondary/40 focus:border-foreground focus:ring-2 focus:ring-foreground/10"
                  />
                  <span className="mt-1 block text-right text-[11px] text-muted">
                    {details.length}/500
                  </span>
                </label>
                {error && <ErrorMessage>{error}</ErrorMessage>}
                <button
                  type="button"
                  onClick={submitReport}
                  disabled={!reason || submitting}
                  className="mt-4 flex h-12 w-full items-center justify-center rounded-14 bg-black px-5 text-sm font-bold text-white shadow-button transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {submitting ? "Enviando..." : "Enviar reporte"}
                </button>
              </>
            )}

            {step === "block" && (
              <>
                <SheetHeader
                  title={`¿Bloquear a ${firstName}?`}
                  description="La conexión y el chat se cerrarán. La otra persona no recibirá una notificación."
                  onBack={() => setStep("menu")}
                  onClose={close}
                />
                <div className="mt-5 rounded-18 border border-border bg-surface p-4 text-sm leading-6 text-secondary shadow-soft">
                  Dejaréis de aparecer en vuestros resultados, perfiles guardados y conversaciones. Podrás deshacerlo más tarde desde Privacidad.
                </div>
                {error && <ErrorMessage>{error}</ErrorMessage>}
                <button
                  type="button"
                  onClick={confirmBlock}
                  disabled={submitting}
                  className="mt-5 flex h-12 w-full items-center justify-center rounded-14 bg-red-600 px-5 text-sm font-bold text-white shadow-button transition hover:bg-red-700 disabled:opacity-50"
                >
                  {submitting ? "Bloqueando..." : "Bloquear"}
                </button>
                <button
                  type="button"
                  onClick={() => setStep("menu")}
                  disabled={submitting}
                  className="mt-2 flex h-11 w-full items-center justify-center text-sm font-bold text-foreground disabled:opacity-50"
                >
                  Cancelar
                </button>
              </>
            )}
          </div>
        </BottomSheet>
      )}
    </AnimatePresence>
  );
}

function SheetHeader({
  title,
  description,
  onBack,
  onClose,
}: {
  title: string;
  description: string;
  onBack?: () => void;
  onClose: () => void;
}) {
  return (
    <div className="grid grid-cols-[2.75rem_1fr_2.75rem] items-start gap-2">
      <div>
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            aria-label="Volver"
            className="flex h-11 w-11 items-center justify-center rounded-full text-foreground transition hover:bg-surface-soft"
          >
            <ArrowLeftIcon />
          </button>
        )}
      </div>
      <div className="pt-1 text-center">
        <h2 className="text-xl font-extrabold tracking-tight text-foreground">
          {title}
        </h2>
        <p className="mt-1.5 text-xs leading-5 text-secondary">{description}</p>
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label="Cerrar"
        className="flex h-11 w-11 items-center justify-center rounded-full text-foreground transition hover:bg-surface-soft"
      >
        <CloseIcon />
      </button>
    </div>
  );
}

function ActionButton({
  title,
  description,
  onClick,
  destructive = false,
}: {
  title: string;
  description: string;
  onClick: () => void;
  destructive?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-4 border-b border-border px-4 py-4 text-left last:border-b-0 hover:bg-surface-soft"
    >
      <span className="min-w-0 flex-1">
        <span
          className={`block text-sm font-extrabold ${
            destructive ? "text-red-600" : "text-foreground"
          }`}
        >
          {title}
        </span>
        <span className="mt-1 block text-xs leading-5 text-secondary">
          {description}
        </span>
      </span>
      <ChevronIcon />
    </button>
  );
}

function ErrorMessage({ children }: { children: React.ReactNode }) {
  return (
    <p role="alert" className="mt-4 rounded-14 border border-red-100 bg-red-50 p-3 text-sm font-semibold text-red-700">
      {children}
    </p>
  );
}

function BaseIcon({ children }: { children: React.ReactNode }) {
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
      {children}
    </svg>
  );
}

function ArrowLeftIcon() {
  return <BaseIcon><path d="M19 12H5M11 18l-6-6 6-6" /></BaseIcon>;
}

function CloseIcon() {
  return <BaseIcon><path d="m6 6 12 12M18 6 6 18" /></BaseIcon>;
}

function ChevronIcon() {
  return <BaseIcon><path d="m9 6 6 6-6 6" /></BaseIcon>;
}
