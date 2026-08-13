"use client";

import { useMemo, useRef, useState } from "react";
import { Home, LoaderCircle, Minus, Plus } from "lucide-react";
import { resolveNominatimAddress, type ResolvedAddress } from "./AddressAutocomplete";

const TILE_SIZE = 256;
const MIN_ZOOM = 13;
const MAX_ZOOM = 18;

type Point = { x: number; y: number };
type Coordinates = { latitude: number; longitude: number };

function project({ latitude, longitude }: Coordinates, zoom: number): Point {
  const scale = TILE_SIZE * 2 ** zoom;
  const sinLatitude = Math.sin((latitude * Math.PI) / 180);

  return {
    x: ((longitude + 180) / 360) * scale,
    y:
      (0.5 -
        Math.log((1 + sinLatitude) / (1 - sinLatitude)) / (4 * Math.PI)) *
      scale,
  };
}

function unproject({ x, y }: Point, zoom: number): Coordinates {
  const scale = TILE_SIZE * 2 ** zoom;
  const longitude = (x / scale) * 360 - 180;
  const n = Math.PI - (2 * Math.PI * y) / scale;
  const latitude = (180 / Math.PI) * Math.atan(Math.sinh(n));

  return { latitude, longitude };
}

function tileKey(x: number, y: number, zoom: number) {
  const tileCount = 2 ** zoom;
  const wrappedX = ((x % tileCount) + tileCount) % tileCount;
  const clampedY = Math.min(tileCount - 1, Math.max(0, y));
  return { x: wrappedX, y: clampedY };
}

export default function PropertyLocationMap({
  address,
  latitude,
  longitude,
  onCoordinatesChange,
  onAddressResolved,
}: {
  address: string;
  latitude: number;
  longitude: number;
  onCoordinatesChange: (coordinates: Coordinates) => void;
  onAddressResolved: (address: ResolvedAddress) => void;
}) {
  const [zoom, setZoom] = useState(16);
  const [center, setCenter] = useState<Coordinates>({ latitude, longitude });
  const centerRef = useRef<Coordinates>({ latitude, longitude });
  const [dragging, setDragging] = useState(false);
  const [resolving, setResolving] = useState(false);
  const dragStart = useRef<{
    pointer: Point;
    center: Point;
  } | null>(null);

  const centerPoint = useMemo(() => project(center, zoom), [center, zoom]);
  const centerTileX = Math.floor(centerPoint.x / TILE_SIZE);
  const centerTileY = Math.floor(centerPoint.y / TILE_SIZE);
  const centerOffsetX = centerPoint.x - centerTileX * TILE_SIZE;
  const centerOffsetY = centerPoint.y - centerTileY * TILE_SIZE;

  const tiles = useMemo(() => {
    const nextTiles: Array<{
      key: string;
      x: number;
      y: number;
      left: number;
      top: number;
    }> = [];

    for (let offsetY = -2; offsetY <= 2; offsetY += 1) {
      for (let offsetX = -2; offsetX <= 2; offsetX += 1) {
        const rawX = centerTileX + offsetX;
        const rawY = centerTileY + offsetY;
        const tile = tileKey(rawX, rawY, zoom);

        nextTiles.push({
          key: `${zoom}-${rawX}-${rawY}`,
          x: tile.x,
          y: tile.y,
          left: offsetX * TILE_SIZE - centerOffsetX,
          top: offsetY * TILE_SIZE - centerOffsetY,
        });
      }
    }

    return nextTiles;
  }, [centerOffsetX, centerOffsetY, centerTileX, centerTileY, zoom]);

  async function resolveCenter(nextCenter: Coordinates) {
    setResolving(true);

    try {
      const params = new URLSearchParams({
        lat: String(nextCenter.latitude),
        lon: String(nextCenter.longitude),
      });
      const response = await fetch(`/api/geocoding/reverse?${params}`);

      if (response.ok) {
        const result = await response.json();
        onAddressResolved(resolveNominatimAddress(result));
      }
    } finally {
      setResolving(false);
    }
  }

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    dragStart.current = {
      pointer: { x: event.clientX, y: event.clientY },
      center: project(center, zoom),
    };
    setDragging(true);
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!dragStart.current) return;

    const nextPoint = {
      x: dragStart.current.center.x - (event.clientX - dragStart.current.pointer.x),
      y: dragStart.current.center.y - (event.clientY - dragStart.current.pointer.y),
    };

    const nextCenter = unproject(nextPoint, zoom);
    centerRef.current = nextCenter;
    setCenter(nextCenter);
  }

  function finishDrag() {
    if (!dragStart.current) return;
    dragStart.current = null;
    setDragging(false);
    onCoordinatesChange(centerRef.current);
    void resolveCenter(centerRef.current);
  }

  function changeZoom(nextZoom: number) {
    setZoom(Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, nextZoom)));
  }

  return (
    <div className="relative h-full min-h-0 overflow-hidden rounded-[1.5rem] border border-[#dddddd] bg-[#ece9e5] shadow-[0_10px_30px_rgba(0,0,0,0.08)]">
      <div
        role="application"
        aria-label="Mapa para confirmar la ubicación de la vivienda"
        className={`relative h-full min-h-48 w-full touch-none overflow-hidden select-none sm:min-h-70 ${
          dragging ? "cursor-grabbing" : "cursor-grab"
        }`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishDrag}
        onPointerCancel={finishDrag}
      >
        <div className="absolute left-1/2 top-1/2 h-0 w-0">
          {tiles.map((tile) => (
            // Map tiles are external raster resources, not application content.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={tile.key}
              src={`/api/geocoding/tiles/${zoom}/${tile.x}/${tile.y}`}
              alt=""
              draggable={false}
              className="pointer-events-none absolute h-64 w-64 max-w-none saturate-[0.7] contrast-[0.98]"
              style={{ left: tile.left, top: tile.top }}
            />
          ))}
        </div>

        <div className="pointer-events-none absolute inset-0 bg-white/3" />

        <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-full">
          <div className={`relative flex h-14 w-14 items-center justify-center rounded-full bg-black text-white shadow-[0_12px_28px_rgba(0,0,0,0.25)] transition ${dragging ? "-translate-y-2 scale-105" : ""}`}>
            <Home className="h-6 w-6" strokeWidth={2} />
            <span className="absolute -bottom-1 left-1/2 h-4 w-4 -translate-x-1/2 rotate-45 rounded-br-sm bg-black" />
          </div>
        </div>

        <div className="pointer-events-none absolute inset-x-4 top-4 flex justify-center sm:top-5">
          <div className="flex max-w-[92%] items-center gap-3 rounded-full border border-white/80 bg-white/95 px-4 py-3 text-sm font-semibold text-[#191919] shadow-[0_10px_28px_rgba(0,0,0,0.12)] backdrop-blur sm:px-5 sm:text-base">
            <span className="truncate">{address}</span>
            {resolving ? <LoaderCircle className="h-4 w-4 shrink-0 animate-spin" /> : null}
          </div>
        </div>

        <div className="absolute bottom-12 right-4 grid overflow-hidden rounded-xl border border-[#dddddd] bg-white shadow">
          <button
            type="button"
            aria-label="Acercar mapa"
            onClick={(event) => {
              event.stopPropagation();
              changeZoom(zoom + 1);
            }}
            onPointerDown={(event) => event.stopPropagation()}
            className="flex h-11 w-11 items-center justify-center border-b border-[#dddddd] text-[#191919] transition hover:bg-[#f5f5f5]"
          >
            <Plus className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label="Alejar mapa"
            onClick={(event) => {
              event.stopPropagation();
              changeZoom(zoom - 1);
            }}
            onPointerDown={(event) => event.stopPropagation()}
            className="flex h-11 w-11 items-center justify-center text-[#191919] transition hover:bg-[#f5f5f5]"
          >
            <Minus className="h-5 w-5" />
          </button>
        </div>

        <p className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-black/90 px-4 py-2 text-xs font-semibold text-white shadow sm:text-sm">
          Arrastra el mapa para ajustar el marcador
        </p>

        <a
          href="https://www.openstreetmap.org/copyright"
          target="_blank"
          rel="noreferrer"
          onPointerDown={(event) => event.stopPropagation()}
          className="absolute bottom-1 left-2 text-[9px] font-semibold text-black/65"
        >
          © OpenStreetMap
        </a>
      </div>
    </div>
  );
}
