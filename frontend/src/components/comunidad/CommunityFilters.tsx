"use client";

import { COMMUNITY_PROFILE_TYPE_OPTIONS } from "@/lib/communityProfileType";
import type {
  CommunityJoinType,
  CommunityProfileType,
  CommunityUrgency,
} from "@/types/community";

export interface CommunityFilterState {
  maxBudget: string;
  joinType: CommunityJoinType | "ALL";
  urgency: CommunityUrgency | "ALL";
  profileType: CommunityProfileType | "ALL";
  moveInBefore: string;
  showNoSpots: boolean;
}

export const defaultCommunityFilters: CommunityFilterState = {
  maxBudget: "",
  joinType: "ALL",
  urgency: "ALL",
  profileType: "ALL",
  moveInBefore: "",
  showNoSpots: false,
};

export function isCommunityFiltersActive(
  filters: CommunityFilterState
): boolean {
  return (
    filters.maxBudget !== "" ||
    filters.joinType !== "ALL" ||
    filters.urgency !== "ALL" ||
    filters.profileType !== "ALL" ||
    filters.moveInBefore !== "" ||
    filters.showNoSpots
  );
}

export const JOIN_TYPE_OPTIONS: { value: CommunityJoinType | "ALL"; label: string }[] = [
  { value: "ALL", label: "Todos" },
  { value: "OPEN", label: "Entrada inmediata" },
  { value: "REQUEST", label: "Con solicitud" },
];

export const URGENCY_OPTIONS: { value: CommunityUrgency | "ALL"; label: string }[] = [
  { value: "ALL", label: "Todas" },
  { value: "NORMAL", label: "Sin prisa" },
  { value: "SOON", label: "Próximamente" },
  { value: "URGENT", label: "Urgente" },
];

export default function CommunityFilters({
  filters,
  onChange,
  onClear,
  resultCount,
  sheet = false,
}: {
  filters: CommunityFilterState;
  onChange: (filters: CommunityFilterState) => void;
  onClear: () => void;
  resultCount: number;
  sheet?: boolean;
}) {
  function update(patch: Partial<CommunityFilterState>) {
    onChange({ ...filters, ...patch });
  }

  if (sheet) {
    return (
      <div className="space-y-3.5 px-4 py-4 pb-8 sm:px-5">
        <FilterSection label="Rango de alquiler" value={filters.maxBudget ? `Hasta ${filters.maxBudget} €/mes` : "Sin límite"}>
          <input type="range" min="0" max="1500" step="50" value={filters.maxBudget || "0"} onChange={(event) => update({ maxBudget: event.target.value === "0" ? "" : event.target.value })} className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-[#e4ebe9] accent-[#4e675b]" aria-label="Presupuesto máximo" />
          <div className="mt-2.5 flex justify-between text-[11px] font-semibold text-[#8b928d]"><span>Sin límite</span><span>750 €</span><span>1.500 €</span></div>
        </FilterSection>

        <FilterSection label="Entrada antes de">
          <input type="date" value={filters.moveInBefore} onChange={(event) => update({ moveInBefore: event.target.value })} className="h-12 w-full rounded-2xl border border-[#e4ebe9] bg-[#fafcfb] px-4 text-[13px] font-medium text-[#161d1d] outline-none transition focus:border-[#4e675b] focus:bg-white focus:ring-4 focus:ring-[#4e675b]/10" />
        </FilterSection>

        <FilterSection label="Tipo de acceso">
          <div className="grid grid-cols-2 gap-2.5">{JOIN_TYPE_OPTIONS.filter(option => option.value !== "ALL").map((option) => <ChoiceCard key={option.value} active={filters.joinType === option.value} title={option.label} description={option.value === "OPEN" ? "Entrada disponible" : "La comunidad decide"} icon={option.value === "OPEN" ? <DoorIcon /> : <MessageIcon />} onClick={() => update({ joinType: filters.joinType === option.value ? "ALL" : option.value })} />)}</div>
        </FilterSection>

        <FilterSection label="Urgencia de entrada">
          <div className="grid grid-cols-4 gap-1 rounded-2xl bg-[#f0f3f2] p-1">{URGENCY_OPTIONS.map(option => <button key={option.value} type="button" onClick={() => update({ urgency: option.value })} className={`rounded-xl px-1 py-2.5 text-[11px] font-bold transition ${filters.urgency === option.value ? "bg-[#4e675b] text-white shadow-[0_2px_8px_rgba(78,103,91,.3)]" : "text-[#727974] hover:bg-white/70"}`}>{option.label}</button>)}</div>
        </FilterSection>

        <FilterSection label="Perfil de la comunidad">
          <div className="flex flex-wrap gap-2"><button type="button" onClick={() => update({ profileType: "ALL" })} className={`rounded-full border px-3.5 py-2 text-xs font-bold transition ${filters.profileType === "ALL" ? "border-[#4e675b] bg-[#4e675b] text-white shadow-[0_2px_8px_rgba(78,103,91,.25)]" : "border-[#e4ebe9] bg-[#fafcfb] text-[#424844] hover:border-[#c9d6d2]"}`}>Todos</button>{COMMUNITY_PROFILE_TYPE_OPTIONS.map(option => <button key={option.value} type="button" onClick={() => update({ profileType: option.value })} className={`rounded-full border px-3.5 py-2 text-xs font-bold transition ${filters.profileType === option.value ? "border-[#4e675b] bg-[#4e675b] text-white shadow-[0_2px_8px_rgba(78,103,91,.25)]" : "border-[#e4ebe9] bg-[#fafcfb] text-[#424844] hover:border-[#c9d6d2]"}`}>{option.label}</button>)}</div>
        </FilterSection>

        <FilterSection label="Disponibilidad">
          <div className="flex items-center justify-between gap-3"><div className="flex items-center gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#f4fbfa] text-[#4e675b]"><PeopleIcon /></span><div><p className="text-[13px] font-semibold text-[#161d1d]">Incluir comunidades completas</p><p className="mt-0.5 text-[11px] text-[#727974]">Muestra también comunidades sin plazas</p></div></div><button type="button" role="switch" aria-checked={filters.showNoSpots} onClick={() => update({ showNoSpots: !filters.showNoSpots })} className={`relative h-7 w-12 shrink-0 rounded-full transition ${filters.showNoSpots ? "bg-[#4e675b]" : "bg-[#d4dbdb]"}`}><span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-sm transition ${filters.showNoSpots ? "left-[22px]" : "left-0.5"}`} /></button></div>
        </FilterSection>
      </div>
    );
  }

  return (
    <div className={sheet ? "px-5 py-6" : "rounded-24 bg-flat p-4 sm:p-5"}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="filter-max-budget"
            className="mb-1.5 block text-xs font-semibold text-muted"
          >
            Presupuesto máximo
          </label>

          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-sm font-semibold text-muted">
              €
            </span>

            <input
              id="filter-max-budget"
              type="number"
              inputMode="numeric"
              min={0}
              value={filters.maxBudget}
              onChange={(event) =>
                update({ maxBudget: event.target.value })
              }
              placeholder="Sin límite"
              className="h-11.5 w-full rounded-14 border border-border bg-surface pl-9 pr-4 text-[15px] text-foreground outline-none transition-all duration-180 placeholder:text-muted hover:border-secondary/40 focus:border-primary focus:ring-4 focus:ring-primary/10"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="filter-move-in"
            className="mb-1.5 block text-xs font-semibold text-muted"
          >
            Entrada antes de
          </label>

          <input
            id="filter-move-in"
            type="date"
            value={filters.moveInBefore}
            onChange={(event) =>
              update({ moveInBefore: event.target.value })
            }
            className="h-11.5 w-full rounded-14 border border-border bg-surface px-4 text-[15px] text-foreground outline-none transition-all duration-180 hover:border-secondary/40 focus:border-primary focus:ring-4 focus:ring-primary/10"
          />
        </div>
      </div>

      <div className="mt-4">
        <p className="mb-1.5 text-xs font-semibold text-muted">
          Tipo de acceso
        </p>

        <div className="flex flex-wrap gap-2">
          {JOIN_TYPE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => update({ joinType: option.value })}
              className={`min-h-11 rounded-14 px-4 text-sm font-bold transition-colors duration-200 ${
                filters.joinType === option.value
                  ? "bg-brand-dark text-white"
                  : "bg-surface text-muted hover:bg-surface/70"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <p className="mb-1.5 text-xs font-semibold text-muted">Urgencia</p>

        <div className="flex flex-wrap gap-2">
          {URGENCY_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => update({ urgency: option.value })}
              className={`min-h-11 rounded-14 px-4 text-sm font-bold transition-colors duration-200 ${
                filters.urgency === option.value
                  ? "bg-brand-dark text-white"
                  : "bg-surface text-muted hover:bg-surface/70"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <p className="mb-1.5 text-xs font-semibold text-muted">
          Perfil de la comunidad
        </p>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => update({ profileType: "ALL" })}
            className={`min-h-11 rounded-14 px-4 text-sm font-bold transition-colors duration-200 ${
              filters.profileType === "ALL"
                ? "bg-brand-dark text-white"
                : "bg-surface text-muted hover:bg-surface/70"
            }`}
          >
            Todos
          </button>

          {COMMUNITY_PROFILE_TYPE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => update({ profileType: option.value })}
              className={`min-h-11 rounded-14 px-4 text-sm font-bold transition-colors duration-200 ${
                filters.profileType === option.value
                  ? "bg-brand-dark text-white"
                  : "bg-surface text-muted hover:bg-surface/70"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <label className="mt-4 flex min-h-11 items-center gap-3 rounded-14 bg-surface px-4 text-sm font-semibold text-foreground">
        <input
          type="checkbox"
          checked={filters.showNoSpots}
          onChange={(event) =>
            update({ showNoSpots: event.target.checked })
          }
          className="h-5 w-5 shrink-0 accent-[var(--brand)]"
        />
        Mostrar comunidades sin plazas abiertas
      </label>

      {!sheet && <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={onClear}
          className="flex h-12 w-full items-center justify-center rounded-14 border border-border bg-surface text-sm font-bold text-foreground transition-colors duration-200 hover:bg-surface-soft sm:w-auto"
        >
          Limpiar filtros
        </button>

        <p className="flex h-12 flex-1 items-center justify-center rounded-14 bg-surface-soft text-sm font-bold text-brand-dark sm:justify-start sm:px-4">
          {resultCount}{" "}
          {resultCount === 1
            ? "comunidad encontrada"
            : "comunidades encontradas"}
        </p>
      </div>}
    </div>
  );
}

function FilterSection({ label, value, children }: { label: string; value?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-[#eef1f0] bg-white p-4 shadow-[0_1px_3px_rgba(22,29,29,.05)]">
      <div className="mb-3.5 flex items-baseline justify-between gap-4">
        <h3 className="text-xs font-bold uppercase tracking-[.12em] text-[#727974]">{label}</h3>
        {value && <span className="rounded-full bg-[#4e675b] px-2.5 py-1 text-[11px] font-bold text-white shadow-[0_2px_6px_rgba(78,103,91,.25)]">{value}</span>}
      </div>
      {children}
    </section>
  );
}
function ChoiceCard({ active, title, description, icon, onClick }: { active: boolean; title: string; description: string; icon: React.ReactNode; onClick: () => void }) { return <button type="button" onClick={onClick} aria-pressed={active} className={`relative flex min-h-28 flex-col justify-between rounded-2xl border-2 p-3.5 text-left transition active:scale-[.98] ${active ? "border-[#4e675b] bg-[#f4fbfa] shadow-[0_4px_14px_rgba(78,103,91,.16)]" : "border-[#e4ebe9] bg-[#fafcfb] hover:border-[#c9d6d2]"}`}><span className={active ? "text-[#4e675b]" : "text-[#8b928d]"}>{icon}</span>{active && <span className="absolute right-3.5 top-3.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#4e675b] text-white"><CheckIcon /></span>}<span><strong className="block text-[13px] text-[#161d1d]">{title}</strong><span className="mt-0.5 block text-[11px] text-[#727974]">{description}</span></span></button>; }
function DoorIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5" aria-hidden="true"><path d="M4 21h16M6 21V4h11v17M13 12h.01" /></svg>; }
function MessageIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5" aria-hidden="true"><path d="M20 15a4 4 0 0 1-4 4H8l-4 3V7a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4Z" /></svg>; }
function PeopleIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4M8.5 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></svg>; }
function CheckIcon() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="h-2.5 w-2.5" aria-hidden="true"><path d="m6 12 4 4 8-9" /></svg>; }
