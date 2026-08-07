"use client";

import { useEffect, useRef, useState } from "react";
import Input from "@/components/ui/Input";

const SEARCH_DEBOUNCE_MS = 400;
const MIN_QUERY_LENGTH = 4;

export interface ResolvedAddress {
  addressLine: string;
  city: string;
  province: string;
  postalCode: string;
  neighborhood: string | null;
  latitude: number;
  longitude: number;
}

interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
  address: {
    road?: string;
    house_number?: string;
    pedestrian?: string;
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    state?: string;
    province?: string;
    postcode?: string;
    suburb?: string;
    neighbourhood?: string;
    quarter?: string;
  };
}

function toResolvedAddress(result: NominatimResult): ResolvedAddress {
  const address = result.address;

  const street = address.road || address.pedestrian || "";
  const addressLine = address.house_number
    ? `${street} ${address.house_number}`.trim()
    : street || result.display_name.split(",")[0];

  return {
    addressLine,
    city: address.city || address.town || address.village || address.municipality || "",
    province: address.province || address.state || "",
    postalCode: address.postcode || "",
    neighborhood: address.suburb || address.neighbourhood || address.quarter || null,
    latitude: Number(result.lat),
    longitude: Number(result.lon),
  };
}

export default function AddressAutocomplete({
  value,
  onChange,
  onResolved,
}: {
  value: string;
  onChange: (value: string) => void;
  onResolved: (address: ResolvedAddress) => void;
}) {
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const skipNextSearch = useRef(false);

  useEffect(() => {
    if (skipNextSearch.current) {
      skipNextSearch.current = false;
      return;
    }

    const controller = new AbortController();
    const query = value.trim();

    const timeout = window.setTimeout(() => {
      if (query.length < MIN_QUERY_LENGTH) {
        setSuggestions([]);
        setOpen(false);
        return;
      }

      setLoading(true);

      const params = new URLSearchParams({
        format: "json",
        addressdetails: "1",
        countrycodes: "es",
        limit: "5",
        q: query,
      });

      fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
        signal: controller.signal,
      })
        .then((response) => (response.ok ? response.json() : []))
        .then((data: NominatimResult[]) => {
          setSuggestions(data);
          setOpen(data.length > 0);
        })
        .catch(() => {
          // Búsqueda opcional: si falla, el propietario sigue escribiendo a mano.
        })
        .finally(() => setLoading(false));
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [value]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSelect(result: NominatimResult) {
    const resolved = toResolvedAddress(result);
    skipNextSearch.current = true;
    onChange(resolved.addressLine);
    onResolved(resolved);
    setOpen(false);
    setSuggestions([]);
  }

  return (
    <div ref={containerRef} className="relative">
      <Input
        label="Dirección"
        helperText="Escribe y elige una sugerencia para rellenar ciudad, provincia y código postal automáticamente."
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        placeholder="Ej. Calle Mayor 12"
        autoComplete="off"
        required
      />

      {loading && (
        <p className="mt-1 text-xs font-semibold text-muted">Buscando...</p>
      )}

      {open && suggestions.length > 0 && (
        <ul className="absolute z-10 mt-1 w-full overflow-hidden rounded-14 border border-line bg-surface shadow-lg">
          {suggestions.map((result, index) => (
            <li key={`${result.lat}-${result.lon}-${index}`}>
              <button
                type="button"
                onClick={() => handleSelect(result)}
                className="block w-full px-4 py-2.5 text-left text-sm text-foreground hover:bg-surface-soft"
              >
                {result.display_name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
