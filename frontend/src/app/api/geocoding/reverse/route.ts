import { NextResponse } from "next/server";

const NOMINATIM_REVERSE_URL = "https://nominatim.openstreetmap.org/reverse";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const latitude = Number(searchParams.get("lat"));
  const longitude = Number(searchParams.get("lon"));

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return NextResponse.json({ detail: "Invalid coordinates" }, { status: 400 });
  }

  const params = new URLSearchParams({
    format: "json",
    addressdetails: "1",
    "accept-language": "es",
    lat: String(latitude),
    lon: String(longitude),
  });

  const response = await fetch(`${NOMINATIM_REVERSE_URL}?${params}`, {
    headers: {
      Accept: "application/json",
      "User-Agent": "CoFlow/1.0 (property map confirmation)",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    return NextResponse.json({ detail: "Address lookup failed" }, { status: 502 });
  }

  return NextResponse.json(await response.json());
}
