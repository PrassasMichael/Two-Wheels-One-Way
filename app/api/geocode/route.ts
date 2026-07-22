import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim();

  if (!query || query.length < 2) {
    return NextResponse.json({ results: [] });
  }

  try {
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("q", query);
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("addressdetails", "1");
    url.searchParams.set("limit", "6");
    url.searchParams.set("countrycodes", "gr");

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Two-Wheels-One-Way/1.0 travel-blog",
        "Accept-Language": "en",
      },
      next: { revalidate: 86400 },
    });

    if (!response.ok) {
      return NextResponse.json({ results: [] }, { status: 502 });
    }

    const data = await response.json();
    const results = data.map((item: any) => ({
      id: String(item.place_id),
      name: item.name || item.display_name.split(",")[0],
      displayName: item.display_name,
      lat: Number(item.lat),
      lng: Number(item.lon),
      type: item.type || item.category || "place",
    }));

    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ results: [] }, { status: 500 });
  }
}
