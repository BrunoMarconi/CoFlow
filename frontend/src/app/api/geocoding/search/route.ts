import { NextResponse } from "next/server";

const NOMINATIM_SEARCH_URL = "https://nominatim.openstreetmap.org/search";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim() ?? "";

  if (query.length < 3) {
    return NextResponse.json([]);
  }

  const params = new URLSearchParams({
    format: "json",
    addressdetails: "1",
    countrycodes: "es",
    limit: "6",
    dedupe: "1",
    "accept-language": "es",
    q: /españa$/i.test(query) ? query : `${query}, España`,
  });

  const response = await fetch(`${NOMINATIM_SEARCH_URL}?${params}`, {
    headers: {
      Accept: "application/json",
      "User-Agent": "CoFlow/1.0 (property address search)",
    },
    next: { revalidate: 86_400 },
  });

  if (!response.ok) {
    return NextResponse.json([], { status: 502 });
  }

  return NextResponse.json(await response.json());
}
