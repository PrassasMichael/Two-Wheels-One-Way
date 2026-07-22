import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type OsrmResponse = {
  code?: string;
  routes?: Array<{
    distance: number;
    duration: number;
    geometry: { coordinates: [number, number][]; type: "LineString" };
  }>;
};

function coordinate(value: string | null) {
  if (!value) return null;
  const [latText, lngText] = value.split(",");
  const lat = Number(latText);
  const lng = Number(lngText);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return { lat, lng };
}

export async function GET(request: NextRequest) {
  const from = coordinate(request.nextUrl.searchParams.get("from"));
  const to = coordinate(request.nextUrl.searchParams.get("to"));

  if (!from || !to) {
    return NextResponse.json({ error: "Valid from and to coordinates are required." }, { status: 400 });
  }

  const coordinates = `${from.lng},${from.lat};${to.lng},${to.lat}`;
  const url = `https://router.project-osrm.org/route/v1/driving/${coordinates}?overview=full&geometries=geojson&steps=false`;

  try {
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "Two-Wheels-One-Way/1.0 (private travel blog)",
      },
      next: { revalidate: 86400 },
    });

    if (!response.ok) {
      return NextResponse.json({ route: null, reason: "routing-service-error" }, { status: 200 });
    }

    const payload = await response.json() as OsrmResponse;
    const route = payload.code === "Ok" ? payload.routes?.[0] : undefined;

    if (!route?.geometry?.coordinates?.length) {
      return NextResponse.json({ route: null, reason: payload.code ?? "no-route" });
    }

    return NextResponse.json({
      route: {
        coordinates: route.geometry.coordinates.map(([lng, lat]) => [lat, lng]),
        distanceKm: Math.round(route.distance / 100) / 10,
        durationMinutes: Math.round(route.duration / 60),
      },
    }, {
      headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800" },
    });
  } catch {
    return NextResponse.json({ route: null, reason: "routing-unavailable" });
  }
}
