"use client";

import { useEffect, useState, type ReactNode } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Briefcase, Building2, CircleAlert, LoaderCircle, Search, ShieldCheck, UserPlus, UserRound, Users } from "lucide-react";
import Input from "@/components/ui/Input";
import { ChoiceCard } from "./WizardControls";
import { searchTeamOwners } from "@/services/team";
import { OWNER_TYPE_LABELS, type OwnerMode } from "@/lib/teamListing";
import { cn } from "@/lib/utils";
import type { NewOwnerInput, OwnerType, TeamOwner } from "@/types/team";

export interface OwnerConflict {
  ownerProfileId: number;
  displayName: string;
}

const NEW_OWNER_TYPES: { value: OwnerType; hint: string; icon: ReactNode }[] = [
  { value: "AGENCY", hint: "Todos sus pisos en una cuenta", icon: <Building2 /> },
  { value: "INDIVIDUAL", hint: "Propietario particular", icon: <UserRound /> },
  { value: "COMPANY", hint: "Sociedad o gestora", icon: <Briefcase /> },
];

export default function OwnerPicker({
  mode,
  onModeChange,
  selectedOwner,
  onSelectOwner,
  newOwner,
  onNewOwnerChange,
  consent,
  onConsentChange,
  conflict,
  onAdoptConflict,
  locked,
  error,
}: {
  mode: OwnerMode;
  onModeChange: (mode: OwnerMode) => void;
  selectedOwner: TeamOwner | null;
  onSelectOwner: (owner: TeamOwner | null) => void;
  newOwner: NewOwnerInput;
  onNewOwnerChange: (changes: Partial<NewOwnerInput>) => void;
  consent: boolean;
  onConsentChange: (value: boolean) => void;
  conflict: OwnerConflict | null;
  onAdoptConflict: () => void;
  /** La vivienda ya existe: su cliente no se cambia desde aquí. */
  locked: boolean;
  error: string;
}) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedQuery(query.trim()), 220);
    return () => window.clearTimeout(timeout);
  }, [query]);

  const { data: owners = [], isFetching, isError } = useQuery({
    queryKey: ["team-owners", debouncedQuery],
    queryFn: () => searchTeamOwners(debouncedQuery),
    enabled: !locked && mode === "existing" && !selectedOwner,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });

  if (locked && selectedOwner) {
    return (
      <div className="flex items-center gap-3 rounded-field border border-border bg-surface p-3">
        <OwnerSummary owner={selectedOwner} />
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-surface-soft px-3 py-1.5 text-xs font-bold text-primary-dark">
          <ShieldCheck className="h-3.5 w-3.5" /> En su cuenta
        </span>
      </div>
    );
  }

  const ownerName =
    mode === "existing"
      ? selectedOwner?.display_name ?? "El cliente"
      : (newOwner.owner_type !== "INDIVIDUAL" ? newOwner.company_name : newOwner.first_name)?.trim() || "El cliente";

  return (
    <div>
      <div role="tablist" aria-label="Tipo de cliente" className="grid grid-cols-2 gap-1 rounded-full bg-surface-soft p-1">
        {(["existing", "new"] as const).map((value) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={mode === value}
            onClick={() => onModeChange(value)}
            className={cn(
              "flex min-h-11 items-center justify-center gap-2 rounded-full text-sm font-semibold transition-colors [&>svg]:h-4 [&>svg]:w-4",
              mode === value ? "bg-surface text-brand-dark shadow-soft" : "text-secondary hover:text-brand-dark"
            )}
          >
            {value === "existing" ? <Users /> : <UserPlus />}
            {value === "existing" ? "Cliente existente" : "Nuevo cliente"}
          </button>
        ))}
      </div>

      {mode === "existing" ? (
        <div className="mt-5">
          {selectedOwner ? (
            <div className="flex items-center gap-3 rounded-field border border-brand-dark bg-surface p-3 ring-1 ring-brand-dark">
              <OwnerSummary owner={selectedOwner} />
              <button
                type="button"
                onClick={() => onSelectOwner(null)}
                className="press-control shrink-0 rounded-full bg-surface-soft px-3.5 py-2 text-xs font-bold text-brand-dark hover:bg-black/[0.06]"
              >
                Cambiar
              </button>
            </div>
          ) : (
            <>
              <Input
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Busca por inmobiliaria, nombre, email o teléfono"
                leftElement={<Search className="h-4 w-4" />}
                aria-label="Buscar cliente"
              />
              <div className="mt-3 overflow-hidden rounded-field border border-border">
                {isError ? (
                  <p className="p-4 text-sm font-semibold text-red-600">No hemos podido cargar los clientes.</p>
                ) : owners.length === 0 && !isFetching ? (
                  <div className="flex flex-col items-center gap-3 px-4 py-7 text-center">
                    <p className="text-sm text-secondary">
                      {debouncedQuery ? `Ningún cliente coincide con «${debouncedQuery}».` : "Todavía no hay clientes."}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        onModeChange("new");
                        if (debouncedQuery) onNewOwnerChange({ company_name: debouncedQuery });
                      }}
                      className="press-control inline-flex min-h-10 items-center gap-2 rounded-full bg-brand-dark px-4 text-sm font-bold text-white"
                    >
                      <UserPlus className="h-4 w-4" /> Crear cliente nuevo
                    </button>
                  </div>
                ) : (
                  <ul className={cn("divide-y divide-border transition-opacity", isFetching && "opacity-60")}>
                    {owners.map((owner) => (
                      <li key={owner.owner_profile_id}>
                        <button
                          type="button"
                          onClick={() => onSelectOwner(owner)}
                          className="press-row hover-row flex w-full items-center gap-3 px-3 py-3 text-left"
                        >
                          <OwnerSummary owner={owner} />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                {isFetching && owners.length === 0 ? (
                  <p className="flex items-center justify-center gap-2 p-5 text-sm text-secondary">
                    <LoaderCircle className="h-4 w-4 animate-spin" /> Buscando…
                  </p>
                ) : null}
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="mt-5 space-y-5">
          <div className="grid gap-2 sm:grid-cols-3">
            {NEW_OWNER_TYPES.map((option) => (
              <ChoiceCard
                key={option.value}
                label={OWNER_TYPE_LABELS[option.value]}
                hint={option.hint}
                icon={option.icon}
                active={newOwner.owner_type === option.value}
                onClick={() => onNewOwnerChange({ owner_type: option.value })}
              />
            ))}
          </div>

          {newOwner.owner_type !== "INDIVIDUAL" ? (
            <Input
              label={newOwner.owner_type === "AGENCY" ? "Nombre de la inmobiliaria" : "Nombre de la empresa"}
              value={newOwner.company_name ?? ""}
              onChange={(event) => onNewOwnerChange({ company_name: event.target.value })}
              placeholder={newOwner.owner_type === "AGENCY" ? "Inmobiliaria Costa del Sol" : "Gestora Málaga S.L."}
              maxLength={150}
              required
            />
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label={newOwner.owner_type === "INDIVIDUAL" ? "Nombre" : "Persona de contacto"}
              value={newOwner.first_name ?? ""}
              onChange={(event) => onNewOwnerChange({ first_name: event.target.value })}
              autoComplete="off"
              maxLength={100}
            />
            <Input
              label="Apellidos"
              value={newOwner.last_name ?? ""}
              onChange={(event) => onNewOwnerChange({ last_name: event.target.value })}
              autoComplete="off"
              maxLength={100}
            />
            <Input
              label="Email"
              type="email"
              inputMode="email"
              value={newOwner.email ?? ""}
              onChange={(event) => onNewOwnerChange({ email: event.target.value })}
              helperText="Recibirá un enlace para activar su cuenta."
              autoComplete="off"
            />
            <Input
              label="Teléfono"
              type="tel"
              inputMode="tel"
              value={newOwner.phone ?? ""}
              onChange={(event) => onNewOwnerChange({ phone: event.target.value })}
              placeholder="+34 600 000 000"
              maxLength={30}
            />
          </div>

          {conflict ? (
            <div className="flex flex-col gap-3 rounded-field border border-amber-200 bg-amber-50 p-4 sm:flex-row sm:items-center">
              <CircleAlert className="h-5 w-5 shrink-0 text-amber-700" />
              <p className="flex-1 text-sm leading-6 text-amber-900">
                <strong>{conflict.displayName}</strong> ya es cliente de CoFlow con este email.
              </p>
              <button
                type="button"
                onClick={onAdoptConflict}
                className="press-control inline-flex min-h-10 shrink-0 items-center justify-center rounded-full bg-brand-dark px-4 text-sm font-bold text-white"
              >
                Añadir a su cuenta
              </button>
            </div>
          ) : null}
        </div>
      )}

      <label
        className={cn(
          "mt-6 flex cursor-pointer items-start gap-3 rounded-field border p-4 transition-colors",
          consent ? "border-primary/35 bg-primary/[0.035]" : "border-border hover:border-secondary/40"
        )}
      >
        <input
          type="checkbox"
          checked={consent}
          onChange={(event) => onConsentChange(event.target.checked)}
          className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--brand)]"
        />
        <span className="text-sm leading-6">
          <strong className="font-bold text-brand-dark">{ownerName} ha autorizado publicar esta vivienda en CoFlow.</strong>
          <span className="block text-secondary">Por teléfono, por email o por el acuerdo de colaboración.</span>
        </span>
      </label>

      {error ? (
        <p role="alert" className="mt-4 flex items-center gap-2 rounded-field bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          <CircleAlert className="h-4 w-4 shrink-0" /> {error}
        </p>
      ) : null}
    </div>
  );
}

function OwnerSummary({ owner }: { owner: TeamOwner }) {
  const Icon = owner.owner_type === "INDIVIDUAL" ? UserRound : Building2;
  const details = [
    owner.property_count !== null
      ? `${owner.property_count} ${owner.property_count === 1 ? "vivienda" : "viviendas"}`
      : null,
    owner.email ?? owner.phone,
  ].filter(Boolean);

  return (
    <span className="flex min-w-0 flex-1 items-center gap-3">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface-soft text-primary">
        <Icon className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="truncate text-sm font-bold text-brand-dark">{owner.display_name}</span>
          <span className="shrink-0 rounded-full bg-surface-soft px-2 py-0.5 text-2xs font-bold text-secondary">
            {OWNER_TYPE_LABELS[owner.owner_type]}
          </span>
        </span>
        <span className="mt-0.5 block truncate text-xs text-secondary">
          {details.join(" · ") || "Sin contacto"}
        </span>
      </span>
    </span>
  );
}
