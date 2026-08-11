"use client";

import { FormEvent, useState, type ReactNode } from "react";
import Link from "next/link";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import Button from "@/components/ui/Button";
import type { User } from "@/types/auth";
import type { UpdateProfileRequest } from "@/types/user";

const BIO_MAX_LENGTH = 160;

interface EditProfileFormProps {
  user: User;
  onSubmit: (data: UpdateProfileRequest) => Promise<void>;
}

export default function EditProfileForm({ user, onSubmit }: EditProfileFormProps) {
  const [firstName, setFirstName] = useState(user.first_name);
  const [lastName, setLastName] = useState(user.last_name);
  const [phone, setPhone] = useState(user.phone ?? "");
  const [rentalBudget, setRentalBudget] = useState(
    user.rental_budget !== null ? String(user.rental_budget) : ""
  );
  const [lookingForRoommates, setLookingForRoommates] = useState(
    user.is_looking_for_roommates
  );
  const [age, setAge] = useState(
    user.age !== null ? String(user.age) : ""
  );
  const [occupation, setOccupation] = useState(user.occupation ?? "");
  const [bio, setBio] = useState(user.bio ?? "");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);

    const trimmedBudget = rentalBudget.trim();
    const trimmedAge = age.trim();

    try {
      await onSubmit({
        first_name: firstName,
        last_name: lastName,
        phone: phone || null,
        rental_budget: trimmedBudget ? Number(trimmedBudget) : null,
        is_looking_for_roommates: lookingForRoommates,
        age: trimmedAge ? Number(trimmedAge) : null,
        occupation: occupation.trim() || null,
        bio: bio.trim() || null,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <ProfileGroup title="Tu presentación">
        <NavigationRow
          href="/perfil#fotos"
          icon={<PhotosIcon />}
          title="Fotos"
          subtitle={`${user.photos.length} ${user.photos.length === 1 ? "foto añadida" : "fotos añadidas"}`}
        />
        <EditableBlock icon={<BioIcon />} title="Bio">
          <Textarea
            value={bio}
            onChange={(event) => setBio(event.target.value)}
            placeholder="Soy una persona tranquila y ordenada."
            maxLength={BIO_MAX_LENGTH}
            rows={2}
            className="min-h-20 bg-surface-soft"
          />
        </EditableBlock>
      </ProfileGroup>

      <ProfileGroup title="Información personal">
        <EditableBlock icon={<UserIcon />} title="Datos personales">
          <div className="grid grid-cols-2 gap-3">
            <Input value={firstName} onChange={(event) => setFirstName(event.target.value)} placeholder="Nombre" required />
            <Input value={lastName} onChange={(event) => setLastName(event.target.value)} placeholder="Apellido" required />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <Input type="number" inputMode="numeric" min={18} max={99} value={age} onChange={(event) => setAge(event.target.value)} placeholder="Edad" />
            <Input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="Teléfono" />
          </div>
        </EditableBlock>
        <EditableBlock icon={<BriefcaseIcon />} title="Ocupación">
          <Input value={occupation} onChange={(event) => setOccupation(event.target.value)} placeholder="Ej. Programador" maxLength={100} />
        </EditableBlock>
      </ProfileGroup>

      <ProfileGroup title="Convivencia">
        <NavigationRow href="/onboarding?edit=true" icon={<LeafIcon />} title="Hábitos y estilo de vida" subtitle="Limpieza, convivencia y normas" />
        <NavigationRow href="/onboarding?edit=true" icon={<PetIcon />} title="Mascotas" subtitle="Preferencias sobre animales" />
        <NavigationRow href="/onboarding?edit=true" icon={<ClockIcon />} title="Horarios" subtitle="Sueño, ruido y rutina" />
        <EditableBlock icon={<PeopleIcon />} title="Búsqueda de compañeros">
          <label className="flex items-center justify-between gap-4 rounded-14 bg-surface-soft px-4 py-3">
            <span className="text-sm font-semibold text-foreground">
              Estoy buscando compañeros
            </span>
            <input
              type="checkbox"
              checked={lookingForRoommates}
              onChange={(event) => setLookingForRoommates(event.target.checked)}
              className="h-5 w-5 shrink-0 accent-[var(--brand)]"
            />
          </label>
        </EditableBlock>
      </ProfileGroup>

      <ProfileGroup title="Preferencias">
        <EditableBlock icon={<BudgetIcon />} title="Presupuesto">
          <Input
            type="number"
            inputMode="numeric"
            min={0}
            max={20000}
            value={rentalBudget}
            onChange={(event) => setRentalBudget(event.target.value)}
            placeholder="Ej. 600 € / mes"
            leftElement={<span className="text-sm font-semibold">€</span>}
          />
        </EditableBlock>
        <NavigationRow href="/onboarding?edit=true" icon={<HomeIcon />} title="Preferencias de vivienda" subtitle="Ubicación y estilo de convivencia" />
      </ProfileGroup>

      <div className="sticky bottom-[calc(var(--mobile-bottom-nav-height)+var(--safe-bottom))] z-20 -mx-5 border-y border-border bg-surface/95 px-5 py-3 backdrop-blur-xl sm:static sm:mx-0 sm:rounded-18 sm:border">
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Guardando..." : "Guardar cambios"}
        </Button>
        <p className="mt-2 text-center text-xs text-muted">
          Los cambios se aplicarán al guardar
        </p>
      </div>
    </form>
  );
}

function ProfileGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 px-1 text-base font-bold text-primary-dark">{title}</h2>
      <div className="divide-y divide-border overflow-hidden rounded-24 border border-border bg-surface">
        {children}
      </div>
    </section>
  );
}

function NavigationRow({ href, icon, title, subtitle }: { href: string; icon: ReactNode; title: string; subtitle: string }) {
  return (
    <Link href={href} className="flex min-h-18 items-center gap-3 px-4 py-3 transition hover:bg-surface-soft">
      <IconTile>{icon}</IconTile>
      <div className="min-w-0 flex-1">
        <p className="text-base font-bold text-brand-dark">{title}</p>
        <p className="mt-0.5 truncate text-sm text-muted">{subtitle}</p>
      </div>
      <ChevronIcon />
    </Link>
  );
}

function EditableBlock({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <div className="px-4 py-4">
      <div className="mb-3 flex items-center gap-3">
        <IconTile>{icon}</IconTile>
        <p className="text-base font-bold text-brand-dark">{title}</p>
      </div>
      <div className="pl-0 sm:pl-13">{children}</div>
    </div>
  );
}

function IconTile({ children }: { children: ReactNode }) {
  return <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-14 bg-mint-50 text-primary">{children}</span>;
}

function ChevronIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 shrink-0 text-muted" aria-hidden="true"><path d="m9 6 6 6-6 6" /></svg>;
}

function BaseIcon({ children }: { children: ReactNode }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">{children}</svg>;
}

function PhotosIcon() { return <BaseIcon><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-5-5L5 21" /></BaseIcon>; }
function BioIcon() { return <BaseIcon><circle cx="9" cy="7" r="3" /><path d="M3 20a6 6 0 0 1 12 0M16 8h5M16 12h4M16 16h3" /></BaseIcon>; }
function UserIcon() { return <BaseIcon><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></BaseIcon>; }
function BriefcaseIcon() { return <BaseIcon><rect x="3" y="7" width="18" height="14" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18" /></BaseIcon>; }
function LeafIcon() { return <BaseIcon><path d="M20 4C11 4 5 8 5 15c0 3 2 5 5 5 7 0 10-7 10-16Z" /><path d="M4 21c3-6 7-9 12-12" /></BaseIcon>; }
function PetIcon() { return <BaseIcon><circle cx="8" cy="8" r="2" /><circle cx="16" cy="8" r="2" /><circle cx="5" cy="13" r="2" /><circle cx="19" cy="13" r="2" /><path d="M8 18c0-3 2-5 4-5s4 2 4 5c0 2-2 3-4 3s-4-1-4-3Z" /></BaseIcon>; }
function ClockIcon() { return <BaseIcon><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></BaseIcon>; }
function PeopleIcon() { return <BaseIcon><circle cx="9" cy="8" r="3" /><path d="M3 20a6 6 0 0 1 12 0M16 6a3 3 0 0 1 0 6M18 15a5 5 0 0 1 3 5" /></BaseIcon>; }
function BudgetIcon() { return <BaseIcon><path d="M18 7a6 6 0 1 0 0 10M4 10h10M4 14h9" /></BaseIcon>; }
function HomeIcon() { return <BaseIcon><path d="m3 11 9-8 9 8M5 10v11h14V10" /></BaseIcon>; }
