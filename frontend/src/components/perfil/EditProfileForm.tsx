"use client";

import { FormEvent, useState } from "react";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import type { User } from "@/types/auth";
import type { UpdateProfileRequest } from "@/types/user";

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
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);

    const trimmedBudget = rentalBudget.trim();

    try {
      await onSubmit({
        first_name: firstName,
        last_name: lastName,
        phone: phone || null,
        rental_budget: trimmedBudget ? Number(trimmedBudget) : null,
        is_looking_for_roommates: lookingForRoommates,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <Input
          value={firstName}
          onChange={(event) => setFirstName(event.target.value)}
          placeholder="Nombre"
          required
        />
        <Input
          value={lastName}
          onChange={(event) => setLastName(event.target.value)}
          placeholder="Apellido"
          required
        />
      </div>

      <Input
        value={phone}
        onChange={(event) => setPhone(event.target.value)}
        placeholder="Teléfono"
      />

      <Input
        label="Presupuesto mensual aproximado para alquiler"
        helperText="Indica aproximadamente cuánto pagarías como máximo cada mes por tu parte del alquiler. No representa tus ingresos. Déjalo vacío si prefieres no indicarlo."
        type="number"
        inputMode="numeric"
        min={0}
        max={20000}
        value={rentalBudget}
        onChange={(event) => setRentalBudget(event.target.value)}
        placeholder="Ej. 550"
        leftElement={<span className="text-sm font-semibold">€</span>}
      />

      <div className="rounded-2xl border border-line p-4">
        <p className="text-sm font-bold text-foreground">
          Búsqueda de compañeros
        </p>

        <label className="mt-3 flex items-start gap-3">
          <input
            type="checkbox"
            checked={lookingForRoommates}
            onChange={(event) =>
              setLookingForRoommates(event.target.checked)
            }
            className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--brand)]"
          />

          <span className="text-sm font-semibold text-foreground">
            Estoy buscando compañeros de piso
          </span>
        </label>

        <p className="mt-2 text-xs leading-5 text-muted">
          Si lo desactivas, dejarás de aparecer en el descubrimiento de
          personas.
        </p>
      </div>

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Guardando..." : "Guardar cambios"}
      </Button>
    </form>
  );
}
