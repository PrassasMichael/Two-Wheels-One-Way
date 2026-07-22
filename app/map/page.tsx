"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ExternalLink, Loader2, MapPin, Plus, Route, Search, Trash2 } from "lucide-react";
import initialItinerary from "@/content/epirus-2026.json";
import "./map.css";

type Stop = { type: string; time: string; title: string; detail: string };
type Day = { date: string; title: string; summary: string; stops: Stop[] };
type Itinerary = typeof initialItinerary;
type Place = { id: string; name: string; displayName?: string; lat: number; lng: number; note: string; chapterNumber?: string; chapterTitle?: string; dayDate?: string; dayTitle?: string };
type SearchResult = { id: string; name: string; displayName: string; lat: number; lng: number; type: string };
type RouteSegment = { fromId: string; toId: string; coordinates: [number, number][] | null; distanceKm?: number; durationMinutes?: number; mode: "road" | "direct" };
type LeafletMap = { remove: () => void; fitBounds: (bounds: unknown, options?: unknown) => void; setView: (center: [number, number], zoom: number) => void };

declare global { interface Window { L?: any } }

const PLACES_KEY = "two-wheels-one-way:map:places";
const ITINERARY_KEY = "two-wheels-one-way:epirus-2026";
const defaultPlaces: Place[] = [
  { id: "thessaloniki", name: "Thessaloniki", lat: 40.6401, lng: 22.9444, note: "Arrival and rental car collection", chapterNumber: "01", chapterTitle: "The road to Epirus", dayDate: "5 September 2026", dayTitle: "The adventure begins" },
  { id: "ioannina", name: "Ioannina", lat: 39.665, lng: 20.8537, note: "Road-trip base", chapterNumber: "01", chapterTitle: "The road to Epirus", dayDate: "5 September 2026", dayTitle: "The adventure begins" },
  { id: "tzoumerka", name: "Tzoumerka", lat: 39.48, lng: 21.13, note: "Mountain day trip", chapterNumber: "02", chapterTitle: "A week through Epirus", dayDate: "6 September 2026", dayTitle: "Tzoumerka day trip" },
  { id: "zagori", name: "Zagorochoria", lat: 39.88, lng: 20.75, note: "Villages and gorge", chapterNumber: "02", chapterTitle: "A week through Epirus", dayDate: "7 September 2026", dayTitle: "Zagorochoria day trip" },
  { id: "sivota", name: "Sivota", lat: 39.4079, lng: 20.2406, note: "Ionian coast", chapterNumber: "02", chapterTitle: "A week through Epirus", dayDate: "8 September 2026", dayTitle: "Sivota and Parga" },
  { id: "parga", name: "Parga", lat: 39.2853, lng: 20.4005, note: "Seaside stop", chapterNumber: "02", chapterTitle: "A week through Epirus", dayDate: "8 September 2026", dayTitle: "Sivota and Parga" },
  { id: "lefkada", name: "Lefkada", lat: 38.7066, lng: 20.6407, note: "Island chapter", chapterNumber: "02", chapterTitle: "A week through Epirus", dayDate: "10 September 2026", dayTitle: "Travel to Lefkada" },
  { id: "athens", name: "Athens", lat: 37.9838, lng: 23.7275, note: "City chapter", chapterNumber: "03", chapterTitle: "Athens", dayDate: "11 September 2026", dayTitle: "Travel to Athens" },
  { id: "crete", name: "Crete", lat: 35.2401, lng: 24.8093, note: "Final island chapter", chapterNumber: "04", chapterTitle: "Crete", dayDate: "15 September 2026", dayTitle: "Fly to Crete" },
];

function isValidPlace(value: unknown): value is Place {
  if (!value || typeof value !== "object") return false;
  const place = value as Partial<Place>;
  return typeof place.id === "string" && typeof place.name === "string" && typeof place.lat === "number" && Number.isFinite(place.lat) && typeof place.lng === "number" && Number.isFinite(place.lng) && typeof place.note === "string";
}
function isValidItinerary(value: unknown): value is Itinerary {
  if (!value || typeof value !== "object") return false;
  const candidate = value as { chapters?: unknown };
  return Array.isArray(candidate.chapters) && candidate.chapters.every((chapter) => !!chapter && typeof chapter === "object" && Array.isArray((chapter as { days?: unknown }).days));
}
function makeId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return `place-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
function directOnly(from: Place, to: Place) {
  const text = `${from.dayTitle ?? ""} ${to.dayTitle ?? ""} ${from.note} ${to.note}`.toLowerCase();
  return /\b(fly|flight|ferry|boat)\b/.test(text);
}

export default function MapPage() {
  const mapElement = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<LeafletMap | null>(null);
  const markerRefs = useRef<Record<string, any>>({});
  const [itinerary, setItinerary] = useState<Itinerary>(initialItinerary);
  const [places, setPlaces] = useState<Place[]>(defaultPlaces);
  const [segments, setSegments] = useState<RouteSegment[]>([]);
  const [routing, setRouting] = useState(false);
  const [selected, setSelected] = useState(defaultPlaces[0].id);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [selectedDay, setSelectedDay] = useState("");
  const [note, setNote] = useState("");
  const [mapError, setMapError] = useState("");

  function destroyMap() {
    const current = mapInstance.current;
    mapInstance.current = null;
    markerRefs.current = {};
    if (!current) return;
    try { current.remove(); } catch {}
    if (mapElement.current) {
      mapElement.current.innerHTML = "";
      delete (mapElement.current as HTMLDivElement & { _leaflet_id?: number })._leaflet_id;
    }
  }

  useEffect(() => {
    try {
      const storedItinerary = localStorage.getItem(ITINERARY_KEY);
      if (storedItinerary) { const parsed = JSON.parse(storedItinerary); if (isValidItinerary(parsed)) setItinerary(parsed); }
      const storedPlaces = localStorage.getItem(PLACES_KEY);
      if (storedPlaces) {
        const parsed = JSON.parse(storedPlaces);
        if (Array.isArray(parsed)) {
          const validPlaces = parsed.filter(isValidPlace);
          if (validPlaces.length) setPlaces(validPlaces); else localStorage.removeItem(PLACES_KEY);
        }
      }
    } catch { localStorage.removeItem(PLACES_KEY); }
  }, []);
  useEffect(() => { try { localStorage.setItem(PLACES_KEY, JSON.stringify(places)); } catch {} }, [places]);

  const days = useMemo(() => itinerary.chapters.flatMap((chapter) => Array.isArray(chapter.days) ? chapter.days.map((day: Day, dayIndex: number) => ({ id: `${chapter.number}-${dayIndex}`, chapterNumber: chapter.number, chapterTitle: chapter.title, date: day.date, title: day.title, summary: day.summary })) : []), [itinerary]);

  useEffect(() => {
    let cancelled = false;
    async function buildRoutes() {
      const pairs = places.slice(0, -1).map((from, index) => ({ from, to: places[index + 1] }));
      setRouting(true);
      const next = await Promise.all(pairs.map(async ({ from, to }): Promise<RouteSegment> => {
        if (directOnly(from, to)) return { fromId: from.id, toId: to.id, coordinates: null, mode: "direct" };
        try {
          const response = await fetch(`/api/route?from=${from.lat},${from.lng}&to=${to.lat},${to.lng}`);
          const payload = await response.json();
          if (payload.route?.coordinates?.length) return { fromId: from.id, toId: to.id, coordinates: payload.route.coordinates, distanceKm: payload.route.distanceKm, durationMinutes: payload.route.durationMinutes, mode: "road" };
        } catch {}
        return { fromId: from.id, toId: to.id, coordinates: null, mode: "direct" };
      }));
      if (!cancelled) { setSegments(next); setRouting(false); }
    }
    if (places.length > 1) buildRoutes(); else setSegments([]);
    return () => { cancelled = true; };
  }, [places]);

  useEffect(() => {
    let cancelled = false;
    setMapError("");
    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link"); link.id = "leaflet-css"; link.rel = "stylesheet"; link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"; document.head.appendChild(link);
    }
    function initialise() {
      if (cancelled || !mapElement.current || !window.L) return;
      try {
        destroyMap();
        const L = window.L;
        const map = L.map(mapElement.current, { scrollWheelZoom: true }).setView([38.8, 22.2], 6);
        mapInstance.current = map;
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "&copy; OpenStreetMap contributors · routes by OSRM", maxZoom: 19 }).addTo(map);
        const validPlaces = places.filter(isValidPlace);
        const bounds: [number, number][] = validPlaces.map((place) => [place.lat, place.lng]);
        validPlaces.forEach((place, index) => {
          const marker = L.marker([place.lat, place.lng]).addTo(map).bindPopup([`<strong>${index + 1}. ${place.name}</strong>`, place.dayDate ? `<small>${place.dayDate}</small>` : "", place.dayTitle ? `<br>${place.dayTitle}` : "", place.note ? `<br>${place.note}` : ""].join(""));
          marker.on("click", () => setSelected(place.id)); markerRefs.current[place.id] = marker;
        });
        segments.forEach((segment) => {
          const from = validPlaces.find((place) => place.id === segment.fromId);
          const to = validPlaces.find((place) => place.id === segment.toId);
          if (!from || !to) return;
          if (segment.mode === "road" && segment.coordinates?.length) {
            L.polyline(segment.coordinates, { color: "#b95532", weight: 4, opacity: .88 }).addTo(map).bindTooltip(`${segment.distanceKm ?? ""} km · ${segment.durationMinutes ?? ""} min`);
          } else {
            L.polyline([[from.lat, from.lng], [to.lat, to.lng]], { color: "#777267", weight: 2.5, opacity: .8, dashArray: "8 10" }).addTo(map).bindTooltip("Flight, ferry or route unavailable");
          }
        });
        if (bounds.length) map.fitBounds(L.latLngBounds(bounds), { padding: [35, 35] });
        window.setTimeout(() => { if (!cancelled) map.invalidateSize?.(); }, 100);
      } catch { destroyMap(); setMapError("The map could not initialise. Reload the page to try again."); }
    }
    if (window.L) initialise();
    else {
      const existing = document.querySelector<HTMLScriptElement>('script[src*="leaflet.js"]');
      const script = existing ?? document.createElement("script");
      const onLoad = () => initialise();
      const onError = () => { if (!cancelled) setMapError("The map library could not be loaded."); };
      script.addEventListener("load", onLoad, { once: true }); script.addEventListener("error", onError, { once: true });
      if (!existing) { script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"; script.async = true; document.body.appendChild(script); }
      return () => { cancelled = true; script.removeEventListener("load", onLoad); script.removeEventListener("error", onError); destroyMap(); };
    }
    return () => { cancelled = true; destroyMap(); };
  }, [places, segments]);

  useEffect(() => {
    const place = places.find((item) => item.id === selected);
    if (!place || !mapInstance.current || !isValidPlace(place)) return;
    try { mapInstance.current.setView([place.lat, place.lng], 11); markerRefs.current[place.id]?.openPopup?.(); } catch {}
  }, [selected, places]);

  async function searchPlaces(event?: React.FormEvent) {
    event?.preventDefault();
    const cleanQuery = query.trim();
    if (cleanQuery.length < 2) return;
    setSearching(true); setSearchError(""); setResults([]);
    try {
      const response = await fetch(`/api/geocode?q=${encodeURIComponent(cleanQuery)}`);
      if (!response.ok) throw new Error("Search failed");
      const payload = await response.json();
      const safeResults = Array.isArray(payload.results) ? payload.results.filter((result: SearchResult) => result && typeof result.name === "string" && Number.isFinite(result.lat) && Number.isFinite(result.lng)) : [];
      setResults(safeResults);
      if (!safeResults.length) setSearchError("No matching places found. Try a nearby town or a more specific name.");
    } catch { setSearchError("Place search is temporarily unavailable. Please try again."); }
    finally { setSearching(false); }
  }

  function addSearchResult(result: SearchResult) {
    const day = days.find((item) => item.id === selectedDay);
    const place: Place = { id: makeId(), name: result.name, displayName: result.displayName, lat: result.lat, lng: result.lng, note: note.trim() || day?.summary || "Saved destination", chapterNumber: day?.chapterNumber, chapterTitle: day?.chapterTitle, dayDate: day?.date, dayTitle: day?.title };
    setPlaces((current) => [...current, place]); setSelected(place.id); setResults([]); setQuery(""); setNote("");
  }
  function removePlace(id: string) {
    setPlaces((current) => { const next = current.filter((place) => place.id !== id); setSelected((active) => active === id ? next[0]?.id ?? "" : active); return next; });
  }

  const selectedPlace = places.find((place) => place.id === selected);
  const roadSegments = segments.filter((segment) => segment.mode === "road");
  const totalDistance = roadSegments.reduce((sum, segment) => sum + (segment.distanceKm ?? 0), 0);
  const totalMinutes = roadSegments.reduce((sum, segment) => sum + (segment.durationMinutes ?? 0), 0);

  return (
    <main className="archive-page workspace-page">
      <header className="archive-page-header"><Link href="/"><ArrowLeft size={17} /> Back home</Link><div className="archive-header-links"><Link href="/roadbooks">Roadbooks</Link><Link href="/stories">Stories</Link></div></header>
      <section className="archive-page-hero compact-archive-hero"><p className="eyebrow dark">ONE CONNECTED MAP</p><h1>Every road,<br />in one place.</h1><p>Driving stages follow the real road network. Flights, ferries and unavailable routes appear as dashed connections.</p></section>
      <section className="interactive-map-layout">
        <div className="map-canvas-wrap"><div ref={mapElement} className="leaflet-map" aria-label="Interactive Greece route map" />{routing && <div className="map-routing-status"><Loader2 className="spin" size={16} /> Calculating road routes…</div>}{mapError && <div className="map-fallback"><MapPin size={25} /><p>{mapError}</p><button type="button" onClick={() => window.location.reload()}>Reload map</button></div>}</div>
        <aside className="map-control-panel">
          <div className="workspace-heading"><Route size={23} /><div><p className="eyebrow dark">CURRENT ROUTE</p><h2>Greece 2026</h2></div></div>
          <div className="route-summary"><span><strong>{Math.round(totalDistance)}</strong> road km</span><span><strong>{Math.floor(totalMinutes / 60)}h {totalMinutes % 60}m</strong> estimated drive</span></div>
          <form className="map-search-panel" onSubmit={searchPlaces}><p className="eyebrow dark">SEARCH & ADD LOCATION</p><div className="map-search-row"><input placeholder="Search village, beach, hotel or landmark" value={query} onChange={(event) => setQuery(event.target.value)} /><button type="submit" disabled={searching || query.trim().length < 2}>{searching ? <Loader2 className="spin" size={17} /> : <Search size={17} />}</button></div><select value={selectedDay} onChange={(event) => setSelectedDay(event.target.value)}><option value="">Link to a journey day (optional)</option>{days.map((day) => <option value={day.id} key={day.id}>{day.date} — {day.title}</option>)}</select><textarea rows={2} placeholder="Optional note" value={note} onChange={(event) => setNote(event.target.value)} />{searchError && <p className="map-search-error">{searchError}</p>}{results.length > 0 && <div className="map-search-results">{results.map((result) => <button type="button" key={result.id} onClick={() => addSearchResult(result)}><MapPin size={17} /><span><strong>{result.name}</strong><small>{result.displayName}</small></span><Plus size={16} /></button>)}</div>}</form>
          <div className="map-place-list">{places.map((place, index) => <button type="button" className={selected === place.id ? "active" : ""} key={place.id} onClick={() => setSelected(place.id)}><span>{String(index + 1).padStart(2, "0")}</span><div><strong>{place.name}</strong><small>{place.dayDate ? `${place.dayDate} · ${place.dayTitle}` : place.note}</small></div><MapPin size={17} /></button>)}</div>
          {selectedPlace && <div className="selected-place-card"><p className="eyebrow dark">SELECTED PLACE</p><h3>{selectedPlace.name}</h3>{selectedPlace.dayDate && <span className="selected-place-date">{selectedPlace.dayDate} · {selectedPlace.dayTitle}</span>}<p>{selectedPlace.note}</p>{selectedPlace.displayName && <small>{selectedPlace.displayName}</small>}<div className="selected-place-actions"><a href={`https://www.openstreetmap.org/?mlat=${selectedPlace.lat}&mlon=${selectedPlace.lng}#map=12/${selectedPlace.lat}/${selectedPlace.lng}`} target="_blank" rel="noreferrer">Open full map <ExternalLink size={15} /></a><button type="button" onClick={() => removePlace(selectedPlace.id)}><Trash2 size={15} /> Remove</button></div></div>}
        </aside>
      </section>
    </main>
  );
}
