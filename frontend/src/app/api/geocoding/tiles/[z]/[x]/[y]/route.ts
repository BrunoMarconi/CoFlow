import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ z: string; x: string; y: string }> }
) {
  const { z, x, y } = await params;
  const zoom = Number(z);
  const tileX = Number(x);
  const tileY = Number(y);

  if (
    !Number.isInteger(zoom) ||
    !Number.isInteger(tileX) ||
    !Number.isInteger(tileY) ||
    zoom < 0 ||
    zoom > 19
  ) {
    return NextResponse.json({ detail: "Invalid tile" }, { status: 400 });
  }

  try {
    const response = await fetch(
      `https://tile.openstreetmap.org/${zoom}/${tileX}/${tileY}.png`,
      {
        headers: {
          "User-Agent": "CoFlow/1.0 (map tiles for property location)",
        },
        next: { revalidate: 86_400 },
      }
    );

    if (!response.ok) {
      return new NextResponse(null, { status: response.status });
    }

    return new NextResponse(await response.arrayBuffer(), {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      },
    });
  } catch {
    return new NextResponse(null, { status: 502 });
  }
}
