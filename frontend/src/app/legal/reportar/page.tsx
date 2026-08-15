"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import LegalLayout from "@/components/legal/LegalLayout";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import Button from "@/components/ui/Button";
import { submitLegalReport } from "@/services/legal";
import { cn } from "@/lib/utils";
import type { LegalReportContentType } from "@/types/legal";

const CONTENT_TYPES: Array<{ value: LegalReportContentType; label: string }> = [
  { value: "PROFILE", label: "Perfil" },
  { value: "PROPERTY", label: "Propiedad" },
  { value: "COMMUNITY", label: "Comunidad" },
  { value: "OTHER", label: "Otro" },
];

export default function ReportarPage() {
  const [contentType, setContentType] = useState<LegalReportContentType>("PROFILE");
  const [urlOrLocation, setUrlOrLocation] = useState("");
  const [reason, setReason] = useState("");
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [reporterName, setReporterName] = useState("");
  const [reporterEmail, setReporterEmail] = useState("");
  const [evidence, setEvidence] = useState<File | null>(null);
  const [goodFaith, setGoodFaith] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!goodFaith) {
      setError("Debes declarar de buena fe que la denuncia es exacta y completa.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      await submitLegalReport({
        content_type: contentType,
        url_or_location: urlOrLocation,
        reason,
        additional_info: additionalInfo.trim() || undefined,
        reporter_name: reporterName.trim() || undefined,
        reporter_email: reporterEmail.trim() || undefined,
        good_faith_declared: goodFaith,
        evidence,
      });
      setSubmitted(true);
    } catch {
      setError("No hemos podido enviar la denuncia. Inténtalo de nuevo en unos minutos.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <LegalLayout title="Denunciar contenido ilegal" updated="15 de agosto de 2026">
        <div className="rounded-24 border border-primary/25 bg-primary/5 p-6 text-center">
          <p className="text-lg font-bold text-brand-dark">Denuncia enviada</p>
          <p className="mt-2 text-sm leading-6 text-secondary">
            Hemos recibido tu denuncia. Cuando dispongamos de tus datos de contacto, podremos confirmar la recepción,
            analizar la información, solicitar información adicional cuando sea necesaria y comunicar la decisión
            adoptada cuando corresponda.
          </p>
        </div>
      </LegalLayout>
    );
  }

  return (
    <LegalLayout title="Denunciar contenido ilegal" updated="15 de agosto de 2026">
      <p>
        Si consideras que un contenido disponible en CoFlow puede ser ilegal, puedes utilizar este formulario para
        notificárnoslo. Facilita información suficiente para que podamos localizar y evaluar correctamente el
        contenido.
      </p>

      <form onSubmit={submit} className="space-y-5">
        <div>
          <label className="mb-2 block text-sm font-semibold text-foreground">
            Tipo de contenido <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {CONTENT_TYPES.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setContentType(item.value)}
                aria-pressed={contentType === item.value}
                className={cn(
                  "flex h-11 items-center justify-center rounded-14 border text-sm font-bold transition",
                  contentType === item.value
                    ? "border-primary bg-primary text-white shadow-button"
                    : "border-border bg-surface text-secondary hover:border-primary/30"
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <Input
          label="URL o ubicación del contenido"
          required
          type="text"
          placeholder="https://coflowapp.es/..."
          value={urlOrLocation}
          onChange={(event) => setUrlOrLocation(event.target.value)}
        />

        <Textarea
          label="Motivo"
          required
          placeholder="Explica por qué consideras que este contenido es ilegal."
          value={reason}
          onChange={(event) => setReason(event.target.value)}
        />

        <Textarea
          label="Información adicional"
          helperText="Opcional. Proporciona cualquier información adicional que pueda ayudarnos a analizar la situación."
          value={additionalInfo}
          onChange={(event) => setAdditionalInfo(event.target.value)}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Nombre"
            placeholder="Nombre y apellidos"
            value={reporterName}
            onChange={(event) => setReporterName(event.target.value)}
          />
          <Input
            label="Email"
            type="email"
            placeholder="correo@ejemplo.com"
            value={reporterEmail}
            onChange={(event) => setReporterEmail(event.target.value)}
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-foreground">Pruebas</label>
          <input
            type="file"
            accept="image/*"
            onChange={(event) => setEvidence(event.target.files?.[0] ?? null)}
            className="block w-full text-sm text-secondary file:mr-4 file:h-10 file:rounded-14 file:border file:border-border file:bg-surface file:px-4 file:text-sm file:font-bold file:text-brand-dark"
          />
          <p className="mt-2 text-xs text-muted">Opcional. Adjunta una imagen como captura de pantalla.</p>
        </div>

        <label className="flex items-start gap-3 rounded-14 border border-border bg-surface p-4">
          <input
            type="checkbox"
            checked={goodFaith}
            onChange={(event) => setGoodFaith(event.target.checked)}
            className="mt-0.5 h-5 w-5 shrink-0 rounded border-border text-primary focus:ring-primary/30"
          />
          <span className="text-sm leading-6 text-secondary">
            Declaro de buena fe que considero que la información y las alegaciones incluidas en esta denuncia son
            exactas y completas.
          </span>
        </label>

        {error && <p role="alert" className="rounded-14 border border-red-200 bg-surface px-4 py-3 text-sm font-semibold text-red-600">{error}</p>}

        <Button type="submit" disabled={submitting} className="w-full">
          {submitting ? "Enviando..." : "Enviar denuncia"}
        </Button>
      </form>

      <p>
        Después de enviar la denuncia, cuando dispongamos de tus datos de contacto, CoFlow podrá confirmar la
        recepción, analizar la información, solicitar información adicional cuando sea necesaria y comunicar la
        decisión adoptada cuando corresponda. Los datos enviados se utilizarán para gestionar la denuncia, proteger a
        los usuarios, moderar CoFlow y cumplir las obligaciones legales aplicables. Consulta nuestra{" "}
        <Link href="/legal/privacidad" className="font-semibold text-primary-dark underline underline-offset-4">
          Política de Privacidad
        </Link>{" "}
        para obtener más información.
      </p>

      <p>
        Para problemas que no estén relacionados con contenido potencialmente ilegal: <strong>soporte@coflowapp.es</strong>
      </p>
    </LegalLayout>
  );
}
