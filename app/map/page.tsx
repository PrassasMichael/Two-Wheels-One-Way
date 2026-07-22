"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Camera,
  Car,
  ExternalLink,
  Fuel,
  Loader2,
  MapPin,
  Pause,
  Plane,
  Play,
  Plus,
  Route,
  Search,
  Sparkles,
  Trash2,
} from "lucide-react";
import initialItinerary from "@/content/epirus-2026.json";
import "./map.css";

type Stop = { type: string; time: string; title: string; detail: string };
type Day = { date: string; title: string; summary: string; stops: Stop[] };
type Itinerary = typeof initialItinerary;
type Place = {
  id: string;
  name: string;
  displayName?: string;
  lat: number;
  lng: number;
  note: string;
  chapterNumber?: string;
  chapterTitle?: string;
  dayDate?: string;
  dayTitle?: string;
};
type SearchResult = { id: string; name: string; displayName: string; lat: number; lng: number; type: string };
type RouteSegment = {
  fromId: string;
  toId: string;
  coordinates: [number, number][] | null;
  distanceKm?: number;
  durationMinutes?: number;
  mode: "road" | "flight" | "direct";
};
type LeafletMap = {
  remove: () => void;
  fitBounds: (bounds: unknown, options?: unknown) => void;
  setView: (center: [number, number], zoom: number) => void;
};

declare global { interface Window { L?: any } }

const PLACES_KEY = "two-wheels-one-way:map:places";
const ITINERARY_KEY = "two-wheels-one-way:epirus-2026";
const SETTINGS_KEY = "two-wheels-one-way:map:cost-settings";

const defaultPlaces: Place[] = [
  { id: "thessaloniki", name: "Thessaloniki", lat: 40.6401, lng: 22.9444, note: "Arrival and rental car collection", dayDate: "5 September 2026", dayTitle: "The adventure begins" },
  { id: "ioannina", name: "Ioannina", lat: 39.665, lng: 20.8537, note: "Road-trip base", dayDate: "5 September 2026", dayTitle: "The adventure begins" },
  { id: "tzoumerka", name: "Tzoumerka", lat: 39.48, lng: 21.13, note: "Mountain day trip", dayDate: "6 September 2026", dayTitle: "Tzoumerka day trip" },
  { id: "ioannina-return-1", name: "Ioannina", lat: 39.665, lng: 20.8537, note: "Return for the night", dayDate: "6 September 2026", dayTitle: "Tzoumerka day trip" },
  { id: "zagori", name: "Zagorochoria", lat: 39.88, lng: 20.75, note: "Stone villages and gorge", dayDate: "7 September 2026", dayTitle: "Zagorochoria day trip" },
  { id: "ioannina-return-2", name: "Ioannina", lat: 39.665, lng: 20.8537, note: "Return for the night", dayDate: "7 September 2026", dayTitle: "Zagorochoria day trip" },
  { id: "sivota", name: "Sivota", lat: 39.4079, lng: 20.2406, note: "Ionian coast stop", dayDate: "8 September 2026", dayTitle: "To Sivota and Parga" },
  { id: "parga", name: "Parga", lat: 39.2853, lng: 20.4005, note: "Seaside base", dayDate: "8 September 2026", dayTitle: "To Sivota and Parga" },
  { id: "lefkada", name: "Lefkada", lat: 38.7066, lng: 20.6407, note: "Drive from Parga", dayDate: "10 September 2026", dayTitle: "Drive from Parga to Lefkada" },
  { id: "athens", name: "Athens", lat: 37.9838, lng: 23.7275, note: "Drive from Lefkada", dayDate: "11 September 2026", dayTitle: "Drive from Lefkada to Athens" },
  { id: "crete", name: "Crete", lat: 35.2401, lng: 24.8093, note: "Flight from Athens", dayDate: "15 September 2026", dayTitle: "Fly from Athens to Crete" },
];

const discoveryPlaces = [
  { name: "Vikos Gorge", lat: 39.9706, lng: 20.7297, kind: "Viewpoint" },
  { name: "Acheron Springs", lat: 39.2366, lng: 20.5838, kind: "Nature" },
  { name: "Porto Katsiki", lat: 38.6017, lng: 20.5494, kind: "Beach" },
  { name: "Cape Lefkatas", lat: 38.5654, lng: 20.5458, kind: "Photo spot" },
];

function isValidPlace(value: unknown): value is Place {
  if (!value || typeof value !== "object") return false;
  const place = value as Partial<Place>;
  return typeof place.id === "string" && typeof place.name === "string" &&
    typeof place.lat === "number" && Number.isFinite(place.lat) &&
    typeof place.lng === "number" && Number.isFinite(place.lng) && typeof place.note === "string";
}

function isValidItinerary(value: unknown): value is Itinerary {
  if (!value || typeof value !== "object") return false;
  const candidate = value as { chapters?: unknown };
  return Array.isArray(candidate.chapters) && candidate.chapters.every((chapter) =>
    !!chapter && typeof chapter === "object" && Array.isArray((chapter as { days?: unknown }).days)
  );
}

function makeId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return `place-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function isFlight(from: Place, to: Place) {
  return from.name.toLowerCase().includes("athens") && to.name.toLowerCase().includes("crete");
}

export default function MapPage() {
  const mapElement = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<LeafletMap | null>(null);
  const markerRefs = useRef<Record<string, any>>({});
  const playbackTimer = useRef<number | null>(null);
  const [itinerary, setItinerary] = useState<Itinerary>(initialItinerary);
  const [places, setPlaces] = useState<Place[]>(defaultPlaces);
  const [segments, setSegments] = useState<RouteSegment[]>([]);
  const [routing, setRouting] = useState(false);
  const [selected, setSelected] = useState(defaultPlaces[0].id);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [selectedDay, setSelectedDay] = useState("all");
  const [linkDay, setLinkDay] = useState("");
  const [note, setNote] = useState("");
  const [mapError, setMapError] = useState("");
  const [mode, setMode] = useState<"planning" | "diary">("planning");
  const [showDiscoveries, setShowDiscoveries] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [playbackIndex, setPlaybackIndex] = useState(0);
  const [consumption, setConsumption] = useState(7.5);
  const [fuelPrice, setFuelPrice] = useState(14.5);

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
      if (storedItinerary) {
        const parsed = JSON.parse(storedItinerary);
        if (isValidItinerary(parsed)) setItinerary(parsed);
      }
      const storedPlaces = localStorage.getItem(PLACES_KEY);
      if (storedPlaces) {
        const parsed = JSON.parse(storedPlaces);
        if (Array.isArray(parsed)) {
          const valid = parsed.filter(isValidPlace);
          if (valid.length) setPlaces(valid);
        }
      }
      const settings = localStorage.getItem(SETTINGS_KEY);
      if (settings) {
        const parsed = JSON.parse(settings);
        if (Number.isFinite(parsed.consumption)) setConsumption(parsed.consumption);
        if (Number.isFinite(parsed.fuelPrice)) setFuelPrice(parsed.fuelPrice);
      }
    } catch {}
  }, []);

  useEffect(() => { try { localStorage.setItem(PLACES_KEY, JSON.stringify(places)); } catch {} }, [places]);
  useEffect(() => { try { localStorage.setItem(SETTINGS_KEY, JSON.stringify({ consumption, fuelPrice })); } catch {} }, [consumption, fuelPrice]);

  const days = useMemo(() => itinerary.chapters.flatMap((chapter) =>
    Array.isArray(chapter.days) ? chapter.days.map((day: Day, dayIndex: number) => ({
      id: `${chapter.number}-${dayIndex}`,
      chapterNumber: chapter.number,
      chapterTitle: chapter.title,
      date: day.date,
      title: day.title,
      summary: day.summary,
    })) : []
  ), [itinerary]);

  const dayDates = useMemo(() => Array.from(new Set(places.map((place) => place.dayDate).filter(Boolean))) as string[], [places]);
  const visiblePlaces = useMemo(() => selectedDay === "all" ? places : places.filter((place) => place.dayDate === selectedDay), [places, selectedDay]);
  const visibleIds = useMemo(() => new Set(visiblePlaces.map((place) => place.id)), [visiblePlaces]);
  const visibleSegments = useMemo(() => selectedDay === "all" ? segments : segments.filter((segment) => visibleIds.has(segment.fromId) && visibleIds.has(segment.toId)), [segments, selectedDay, visibleIds]);

  useEffect(() => {
    let cancelled = false;
    async function buildRoutes() {
      const pairs = places.slice(0, -1).map((from, index) => ({ from, to: places[index + 1] }));
      setRouting(true);
      const next = await Promise.all(pairs.map(async ({ from, to }): Promise<RouteSegment> => {
        if (isFlight(from, to)) return { fromId: from.id, toId: to.id, coordinates: null, mode: "flight" };
        try {
          const response = await fetch(`/api/route?from=${from.lat},${from.lng}&to=${to.lat},${to.lng}`);
          const payload = await response.json();
          if (payload.route?.coordinates?.length) {
            return {
              fromId: from.id,
              toId: to.id,
              coordinates: payload.route.coordinates,
              distanceKm: payload.route.distanceKm,
              durationMinutes: payload.route.durationMinutes,
              mode: "road",
            };
          }
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
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    function initialise() {
      if (cancelled || !mapElement.current || !window.L) return;
      try {
        destroyMap();
        const L = window.L;
        const map = L.map(mapElement.current, { scrollWheelZoom: true }).setView([38.8, 22.2], 6);
        mapInstance.current = map;
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "&copy; OpenStreetMap contributors · routes by OSRM",
          maxZoom: 19,
        }).addTo(map);

        const bounds: [number, number][] = visiblePlaces.map((place) => [place.lat, place.lng]);
        visiblePlaces.forEach((place, index) => {
          const marker = L.marker([place.lat, place.lng]).addTo(map).bindPopup([
            `<strong>${index + 1}. ${place.name}</strong>`,
            place.dayDate ? `<small>${place.dayDate}</small>` : "",
            place.dayTitle ? `<br>${place.dayTitle}` : "",
            place.note ? `<br>${place.note}` : "",
          ].join(""));
          marker.on("click", () => setSelected(place.id));
          markerRefs.current[place.id] = marker;
        });

        visibleSegments.forEach((segment) => {
          const from = places.find((place) => place.id === segment.fromId);
          const to = places.find((place) => place.id === segment.toId);
          if (!from || !to) return;
          if (segment.mode === "road" && segment.coordinates?.length) {
            L.polyline(segment.coordinates, { color: "#b95532", weight: 4, opacity: .9 })
              .addTo(map)
              .bindTooltip(`${segment.distanceKm ?? ""} km · ${segment.durationMinutes ?? ""} min`);
          } else {
            const label = segment.mode === "flight" ? "Flight: Athens → Crete" : "Route unavailable";
            L.polyline([[from.lat, from.lng], [to.lat, to.lng]], {
              color: "#777267",
              weight: 2.5,
              opacity: .85,
              dashArray: "8 10",
            }).addTo(map).bindTooltip(label);
          }
        });

        if (showDiscoveries) {
          discoveryPlaces.forEach((place) => {
            const icon = L.divIcon({ className: "discovery-marker", html: "★", iconSize: [28, 28] });
            L.marker([place.lat, place.lng], { icon }).addTo(map).bindPopup(`<strong>${place.name}</strong><br>${place.kind}`);
            bounds.push([place.lat, place.lng]);
          });
        }

        if (bounds.length) map.fitBounds(L.latLngBounds(bounds), { padding: [35, 35] });
        window.setTimeout(() => { if (!cancelled) map.invalidateSize?.(); }, 100);
      } catch {
        destroyMap();
        setMapError("The map could not initialise. Reload the page to try again.");
      }
    }

    if (window.L) initialise();
    else {
      const existing = document.querySelector<HTMLScriptElement>('script[src*="leaflet.js"]');
      const script = existing ?? document.createElement("script");
      const onLoad = () => initialise();
      const onError = () => { if (!cancelled) setMapError("The map library could not be loaded."); };
      script.addEventListener("load", onLoad, { once: true });
      script.addEventListener("error", onError, { once: true });
      if (!existing) {
        script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
        script.async = true;
        document.body.appendChild(script);
      }
      return () => {
        cancelled = true;
        script.removeEventListener("load", onLoad);
        script.removeEventListener("error", onError);
        destroyMap();
      };
    }
    return () => { cancelled = true; destroyMap(); };
  }, [visiblePlaces, visibleSegments, showDiscoveries, places]);

  useEffect(() => {
    const place = places.find((item) => item.id === selected);
    if (!place || !mapInstance.current || !isValidPlace(place)) return;
    try {
      mapInstance.current.setView([place.lat, place.lng], 11);
      markerRefs.current[place.id]?.openPopup?.();
    } catch {}
  }, [selected, places]);

  useEffect(() => {
    if (!playing || visiblePlaces.length === 0) return;
    playbackTimer.current = window.setInterval(() => {
      setPlaybackIndex((current) => {
        const next = current + 1 >= visiblePlaces.length ? 0 : current + 1;
        setSelected(visiblePlaces[next].id);
        return next;
      });
    }, 1800);
    return () => {
      if (playbackTimer.current) window.clearInterval(playbackTimer.current);
      playbackTimer.current = null;
    };
  }, [playing, visiblePlaces]);

  async function searchPlaces(event?: React.FormEvent) {
    event?.preventDefault();
    const cleanQuery = query.trim();
    if (cleanQuery.length < 2) return;
    setSearching(true);
    setSearchError("");
    setResults([]);
    try {
      const response = await fetch(`/api/geocode?q=${encodeURIComponent(cleanQuery)}`);
      if (!response.ok) throw new Error("Search failed");
      const payload = await response.json();
      const safeResults = Array.isArray(payload.results) ? payload.results.filter((result: SearchResult) =>
        result && typeof result.name === "string" && Number.isFinite(result.lat) && Number.isFinite(result.lng)
      ) : [];
      setResults(safeResults);
      if (!safeResults.length) setSearchError("No matching places found. Try a nearby town or a more specific name.");
    } catch {
      setSearchError("Place search is temporarily unavailable. Please try again.");
    } finally {
      setSearching(false);
    }
  }

  function addSearchResult(result: SearchResult) {
    const day = days.find((item) => item.id === linkDay);
    const place: Place = {
      id: makeId(),
      name: result.name,
      displayName: result.displayName,
      lat: result.lat,
      lng: result.lng,
      note: note.trim() || day?.summary || "Saved destination",
      chapterNumber: day?.chapterNumber,
      chapterTitle: day?.chapterTitle,
      dayDate: day?.date,
      dayTitle: day?.title,
    };
    setPlaces((current) => [...current, place]);
    setSelected(place.id);
    setResults([]);
    setQuery("");
    setNote("");
  }

  function removePlace(id: string) {
    setPlaces((current) => {
      const next = current.filter((place) => place.id !== id);
      setSelected((active) => active === id ? next[0]?.id ?? "" : active);
      return next;
    });
  }

  function togglePlayback() {
    setPlaying((current) => !current);
    if (!playing && visiblePlaces.length) {
      setPlaybackIndex(0);
      setSelected(visiblePlaces[0].id);
    }
  }

  const selectedPlace = places.find((place) => place.id === selected);
  const roadSegments = visibleSegments.filter((segment) => segment.mode === "road");
  const totalDistance = roadSegments.reduce((sum, segment) => sum + (segment.distanceKm ?? 0), 0);
  const totalMinutes = roadSegments.reduce((sum, segment) => sum + (segment.durationMinutes ?? 0), 0);
  const estimatedLitres = totalDistance * consumption / 100;
  const estimatedFuelCost = estimatedLitres * fuelPrice;

  return (
    <main className="archive-page workspace-page">
      <header className="archive-page-header">
        <Link href="/"><ArrowLeft size={17} /> Back home</Link>
        <div className="archive-header-links"><Link href="/roadbooks">Roadbooks</Link><Link href="/stories">Stories</Link></div>
      </header>

      <section className="archive-page-hero compact-archive-hero">
        <p className="eyebrow dark">ONE CONNECTED MAP</p>
        <h1>The journey,<br />day by day.</h1>
        <p>Driving stages follow real roads, Athens to Crete is shown as a flight, and every day can be explored on its own.</p>
      </section>

      <section className="map-command-bar">
        <div className="map-mode-switch">
          <button type="button" className={mode === "planning" ? "active" : ""} onClick={() => setMode("planning")}><Route size={16} /> Planning</button>
          <button type="button" className={mode === "diary" ? "active" : ""} onClick={() => setMode("diary")}><Camera size={16} /> Travel diary</button>
        </div>
        <label>Show route day
          <select value={selectedDay} onChange={(event) => { setSelectedDay(event.target.value); setPlaying(false); }}>
            <option value="all">Entire journey</option>
            {dayDates.map((date) => <option key={date} value={date}>{date}</option>)}
          </select>
        </label>
        <button type="button" className="play-route-button" onClick={togglePlayback}>
          {playing ? <Pause size={17} /> : <Play size={17} />} {playing ? "Pause journey" : "Play journey"}
        </button>
        <button type="button" className={showDiscoveries ? "discovery-toggle active" : "discovery-toggle"} onClick={() => setShowDiscoveries((current) => !current)}>
          <Sparkles size={17} /> Discovery layer
        </button>
      </section>

      <section className="interactive-map-layout">
        <div className="map-canvas-wrap">
          <div ref={mapElement} className="leaflet-map" aria-label="Interactive Greece route map" />
          {routing && <div className="map-routing-status"><Loader2 className="spin" size={16} /> Calculating road routes…</div>}
          {mapError && <div className="map-fallback"><MapPin size={25} /><p>{mapError}</p><button type="button" onClick={() => window.location.reload()}>Reload map</button></div>}
        </div>

        <aside className="map-control-panel">
          <div className="workspace-heading"><Route size={23} /><div><p className="eyebrow dark">CURRENT VIEW</p><h2>{selectedDay === "all" ? "Greece 2026" : selectedDay}</h2></div></div>

          <div className="route-summary route-summary-four">
            <span><Car size={17} /><strong>{Math.round(totalDistance)}</strong> road km</span>
            <span><Route size={17} /><strong>{Math.floor(totalMinutes / 60)}h {totalMinutes % 60}m</strong> drive</span>
            <span><Fuel size={17} /><strong>{estimatedLitres.toFixed(1)} L</strong> fuel</span>
            <span><Fuel size={17} /><strong>{Math.round(estimatedFuelCost)} DKK</strong> estimate</span>
          </div>

          <div className="fuel-settings">
            <label>Consumption L/100 km<input type="number" min="1" step="0.1" value={consumption} onChange={(event) => setConsumption(Number(event.target.value) || 0)} /></label>
            <label>Fuel price DKK/L<input type="number" min="1" step="0.1" value={fuelPrice} onChange={(event) => setFuelPrice(Number(event.target.value) || 0)} /></label>
          </div>

          {mode === "planning" ? (
            <form className="map-search-panel" onSubmit={searchPlaces}>
              <p className="eyebrow dark">SEARCH & ADD LOCATION</p>
              <div className="map-search-row">
                <input placeholder="Search village, beach, hotel or landmark" value={query} onChange={(event) => setQuery(event.target.value)} />
                <button type="submit" disabled={searching || query.trim().length < 2}>{searching ? <Loader2 className="spin" size={17} /> : <Search size={17} />}</button>
              </div>
              <select value={linkDay} onChange={(event) => setLinkDay(event.target.value)}>
                <option value="">Link to a journey day (optional)</option>
                {days.map((day) => <option value={day.id} key={day.id}>{day.date} — {day.title}</option>)}
              </select>
              <textarea rows={2} placeholder="Optional note" value={note} onChange={(event) => setNote(event.target.value)} />
              {searchError && <p className="map-search-error">{searchError}</p>}
              {results.length > 0 && <div className="map-search-results">{results.map((result) => (
                <button type="button" key={result.id} onClick={() => addSearchResult(result)}><MapPin size={17} /><span><strong>{result.name}</strong><small>{result.displayName}</small></span><Plus size={16} /></button>
              ))}</div>}
            </form>
          ) : (
            <div className="diary-panel">
              <Camera size={21} />
              <div><p className="eyebrow dark">TRAVEL DIARY MODE</p><h3>{selectedPlace?.name ?? "Choose a stop"}</h3><p>{selectedPlace?.note ?? "Tap a marker to revisit its story and photographs."}</p><Link href="/stories">Open stories and photographs</Link></div>
            </div>
          )}

          <div className="route-leg-list">
            <p className="eyebrow dark">ROUTE LEGS</p>
            {visibleSegments.map((segment, index) => {
              const from = places.find((place) => place.id === segment.fromId);
              const to = places.find((place) => place.id === segment.toId);
              if (!from || !to) return null;
              const cost = segment.mode === "road" ? ((segment.distanceKm ?? 0) * consumption / 100 * fuelPrice) : 0;
              return <button type="button" key={`${segment.fromId}-${segment.toId}`} onClick={() => setSelected(to.id)}>
                <span className="leg-icon">{segment.mode === "flight" ? <Plane size={17} /> : <Car size={17} />}</span>
                <span><strong>{from.name} → {to.name}</strong><small>{segment.mode === "flight" ? "Flight" : `${segment.distanceKm ?? "—"} km · ${segment.durationMinutes ?? "—"} min · ~${Math.round(cost)} DKK fuel`}</small></span>
                <span>{String(index + 1).padStart(2, "0")}</span>
              </button>;
            })}
          </div>

          <div className="map-place-list">
            {visiblePlaces.map((place, index) => (
              <button type="button" className={selected === place.id ? "active" : ""} key={place.id} onClick={() => setSelected(place.id)}>
                <span>{String(index + 1).padStart(2, "0")}</span><div><strong>{place.name}</strong><small>{place.dayDate ? `${place.dayDate} · ${place.dayTitle}` : place.note}</small></div><MapPin size={17} />
              </button>
            ))}
          </div>

          {selectedPlace && <div className="selected-place-card">
            <p className="eyebrow dark">SELECTED PLACE</p>
            <h3>{selectedPlace.name}</h3>
            {selectedPlace.dayDate && <span className="selected-place-date">{selectedPlace.dayDate} · {selectedPlace.dayTitle}</span>}
            <p>{selectedPlace.note}</p>
            {selectedPlace.displayName && <small>{selectedPlace.displayName}</small>}
            <div className="selected-place-actions">
              <a href={`https://www.openstreetmap.org/?mlat=${selectedPlace.lat}&mlon=${selectedPlace.lng}#map=12/${selectedPlace.lat}/${selectedPlace.lng}`} target="_blank" rel="noreferrer">Open full map <ExternalLink size={15} /></a>
              <button type="button" onClick={() => removePlace(selectedPlace.id)}><Trash2 size={15} /> Remove</button>
            </div>
          </div>}
        </aside>
      </section>
    </main>
  );
}
