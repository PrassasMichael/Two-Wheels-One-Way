import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim();

  if (!query || query.length < 2) {
    return NextResponse.json({ error: "Missing place name.", results: [] }, { status: 400 });
  }

  try {
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("q", query);
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("addressdetails", "1");
    url.searchParams.set("limit", "6");

    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "Two-Wheels-One-Way/1.0 travel-planner",
        "Accept-Language": "en",
      },
      next: { revalidate: 86400 },
    });

    if (!response.ok) {
      return NextResponse.json({ error: "Place lookup failed.", results: [] }, { status: 502 });
    }

    const data: unknown = await response.json();
    const source = Array.isArray(data) ? data : [];
    const results = source.reduce<Array<{ id: string; name: string; displayName: string; lat: number; lng: number; lon: number; type: string }>>((items, raw) => {
      if (!raw || typeof raw !== "object") return items;
      const item = raw as Record<string, unknown>;
      const lat = Number(item.lat);
      const lon = Number(item.lon);
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) return items;
      const displayName = String(item.display_name || query);
      items.push({
        id: String(item.place_id || `${lat}-${lon}`),
        name: String(item.name || displayName.split(",")[0]),
        displayName,
        lat,
        lng: lon,
        lon,
        type: String(item.type || item.category || "place"),
      });
      return items;
    }, []);

    const first = results[0];
    if (!first) return NextResponse.json({ error: "Place not found.", results: [] }, { status: 404 });

    return NextResponse.json({ lat: first.lat, lon: first.lon, displayName: first.displayName, results });
  } catch {
    return NextResponse.json({ error: "Place lookup is unavailable.", results: [] }, { status: 502 });
  }
}
