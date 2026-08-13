"use client";

import { useEffect, useRef, useState, type RefObject } from "react";

const SEARCH_DEBOUNCE_MS = 280;
const MIN_QUERY_LENGTH = 3;

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

export function resolveNominatimAddress(result: NominatimResult): ResolvedAddress {
  const address = result.address;
  const street = address.road || address.pedestrian || "";
  const addressLine = address.house_number
    ? `${street} ${address.house_number}`.trim()
    : street || result.display_name.split(",")[0];

  return {
    addressLine,
    city:
      address.city ||
      address.town ||
      address.village ||
      address.municipality ||
      "",
    province: address.province || address.state || "",
    postalCode: address.postcode || "",
    neighborhood:
      address.suburb || address.neighbourhood || address.quarter || null,
    latitude: Number(result.lat),
    longitude: Number(result.lon),
  };
}

function getLocationLabel(result: NominatimResult) {
  const address = result.address;
  const street =
    address.road || address.pedestrian || result.display_name.split(",")[0];
  const number = address.house_number ? `, ${address.house_number}` : "";
  const place =
    address.city || address.town || address.village || address.municipality || "";

  return {
    primary: `${street}${number}`,
    secondary: [address.postcode, place, address.province || address.state]
      .filter(Boolean)
      .join(" · "),
  };
}

export default function AddressAutocomplete({
  value,
  onChange,
  onResolved,
  onFocus,
  inputRef,
  variant = "inline",
}: {
  value: string;
  onChange: (value: string) => void;
  onResolved: (address: ResolvedAddress) => void;
  onFocus?: () => void;
  inputRef?: RefObject<HTMLInputElement | null>;
  variant?: "inline" | "sheet";
}) {
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const skipNextSearch = useRef(false);

  useEffect(() => {
    if (skipNextSearch.current) {
      skipNextSearch.current = false;
      return;
    }

    const controller = new AbortController();
    const query = value.trim();

    const timeout = window.setTimeout(async () => {
      if (query.length < MIN_QUERY_LENGTH) {
        setSuggestions([]);
        setOpen(false);
        setLoading(false);
        setFailed(false);
        return;
      }

      setLoading(true);
      setFailed(false);
      setOpen(true);

      try {
        const response = await fetch(
          `/api/geocoding/search?q=${encodeURIComponent(query)}`,
          { signal: controller.signal }
        );
        if (!response.ok) throw new Error("Address search failed");
        setSuggestions((await response.json()) as NominatimResult[]);
      } catch (error) {
        if ((error as { name?: string })?.name !== "AbortError") {
          setSuggestions([]);
          setFailed(true);
        }
      } finally {
        setLoading(false);
      }
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [value]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSelect(result: NominatimResult) {
    const resolved = resolveNominatimAddress(result);
    skipNextSearch.current = true;
    onChange(resolved.addressLine);
    onResolved(resolved);
    setOpen(false);
    setSuggestions([]);
  }

  const isSheet = variant === "sheet";

  return (
    <div
      ref={containerRef}
      className={isSheet ? "flex min-h-0 flex-1 flex-col" : "relative"}
    >
      <label className="sr-only" htmlFor="property-address-search">
        ¿Dónde está tu vivienda?
      </label>
      <div className="flex h-16 items-center gap-3 rounded-full border border-[#c9c9c9] bg-white px-5 shadow-[0_8px_24px_rgba(0,0,0,0.07)] transition focus-within:border-black focus-within:ring-1 focus-within:ring-black sm:h-17">
        <SearchIcon />
        <input
          id="property-address-search"
          ref={inputRef}
          type="search"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onFocus={() => {
            onFocus?.();
            if (
              suggestions.length > 0 ||
              value.trim().length >= MIN_QUERY_LENGTH
            ) {
              setOpen(true);
            }
          }}
          placeholder="¿Dónde está tu vivienda?"
          autoComplete="street-address"
          className="min-w-0 flex-1 bg-transparent text-[1.05rem] font-medium text-[#191919] outline-none placeholder:text-[#717171] sm:text-lg"
        />
        {loading ? <SpinnerIcon /> : null}
      </div>

      {open ? (
        <ul
          aria-live="polite"
          className={
            isSheet
              ? "mt-5 min-h-0 overflow-y-auto pb-4"
              : "absolute z-10 mt-2 w-full overflow-hidden rounded-18 border border-border bg-surface shadow-[0_18px_36px_rgba(26,55,43,0.12)]"
          }
        >
          {suggestions.map((result, index) => {
            const label = getLocationLabel(result);

            return (
              <li key={`${result.lat}-${result.lon}-${index}`}>
                <button
                  type="button"
                  onClick={() => handleSelect(result)}
                  className="flex w-full items-center gap-4 border-b border-[#e7e7e7] px-2 py-4 text-left transition last:border-b-0 hover:bg-[#f7f7f7] sm:px-3"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#f5f5f5] text-[#222]">
                    <PinIcon />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-base font-semibold text-[#191919]">
                      {label.primary}
                    </span>
                    <span className="mt-0.5 block truncate text-sm text-secondary">
                      {label.secondary || result.display_name}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
          {!loading && suggestions.length === 0 ? (
            <li className="px-4 py-7 text-center text-sm leading-6 text-secondary">
              {failed
                ? "No hemos podido buscar direcciones ahora. Inténtalo de nuevo."
                : "No hemos encontrado esa dirección. Prueba con calle, número y ciudad."}
            </li>
          ) : null}
        </ul>
      ) : null}
    </div>
  );
}

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      className="h-6 w-6 shrink-0 text-secondary"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4 4" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-5 w-5 shrink-0 animate-spin text-black"
      aria-label="Buscando"
    >
      <path d="M20 12a8 8 0 1 1-2.3-5.7" />
    </svg>
  );
}
