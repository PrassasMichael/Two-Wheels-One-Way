"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { FormEvent, useEffect, useRef, useState } from "react";
import {
  ArrowDown, ArrowLeft, ArrowUp, ExternalLink, LoaderCircle, MapPin, Navigation,
  Plus, RefreshCw, Route, Trash2,
} from "lucide-react";
import "../../../packing/packing.css";
import "./route-map.css";

type Stop = {
  id: string;
  name: string;
  notes: string;
  address?: string;
  placeId?: string;
  lat?: number;
  lng?: number;
};

type LocatedStop = Stop & { lat: number; lng: number };
type MapProvider = "google" | "openstreetmap";
type GoogleWindow = Window & { google?: any; __twoWheelsGoogleMapsReady?: () => void; L?: any };

const googleMapsKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

function makeId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return `stop-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function normalizeStop(value: unknown): Stop | null {
  if (!value || typeof value !== "object") return null;
  const stop = value as Record<string, unknown>;
  const rawName = typeof stop.name === "string" ? stop.name : typeof stop.title === "string" ? stop.title : typeof stop.place === "string" ? stop.place : "";
  const name = rawName.trim();
  if (!name) return null;
  const lat = Number(stop.lat);
  const lng = Number(stop.lng ?? stop.lon);
  return {
    id: typeof stop.id === "string" && stop.id ? stop.id : makeId(),
    name,
    notes: typeof stop.notes === "string" ? stop.notes : typeof stop.detail === "string" ? stop.detail : "",
    address: typeof stop.address === "string" ? stop.address : undefined,
    placeId: typeof stop.placeId === "string" ? stop.placeId : undefined,
    lat: Number.isFinite(lat) ? lat : undefined,
    lng: Number.isFinite(lng) ? lng : undefined,
  };
}

function normalizeStops(value: unknown): Stop[] {
  if (!Array.isArray(value)) return [];
  return value.reduce<Stop[]>((result, item) => {
    const normalized = normalizeStop(item);
    if (normalized) result.push(normalized);
    return result;
  }, []);
}

function loadGoogleMaps(): Promise<any> {
  return new Promise((resolve, reject) => {
    const current = window as GoogleWindow;
    if (current.google?.maps) return resolve(current.google.maps);
    if (!googleMapsKey) return reject(new Error("Google Maps key is not configured."));

    const existing = document.querySelector('script[data-google-maps="true"]') as HTMLScriptElement | null;
    if (existing) {
      const timer = window.setInterval(() => {
        if (current.google?.maps) {
          window.clearInterval(timer);
          resolve(current.google.maps);
        }
      }, 100);
      window.setTimeout(() => {
        window.clearInterval(timer);
        if (!current.google?.maps) reject(new Error("Google Maps did not finish loading."));
      }, 12000);
      return;
    }

    current.__twoWheelsGoogleMapsReady = () => resolve(current.google?.maps);
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(googleMapsKey)}&libraries=places&callback=__twoWheelsGoogleMapsReady&v=weekly`;
    script.async = true;
    script.defer = true;
    script.dataset.googleMaps = "true";
    script.onerror = () => reject(new Error("Google Maps could not load. Check the API key and domain restrictions."));
    document.head.appendChild(script);
  });
}

function loadLeaflet(): Promise<any> {
  return new Promise((resolve, reject) => {
    const current = window as GoogleWindow;
    if (current.L) return resolve(current.L);
    if (!document.querySelector('link[data-leaflet="true"]')) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      link.dataset.leaflet = "true";
      document.head.appendChild(link);
    }
    const existing = document.querySelector('script[data-leaflet="true"]') as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", () => resolve((window as GoogleWindow).L));
      existing.addEventListener("error", () => reject(new Error("Fallback map failed to load.")));
      return;
    }
    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.dataset.leaflet = "true";
    script.onload = () => resolve((window as GoogleWindow).L);
    script.onerror = () => reject(new Error("Fallback map failed to load."));
    document.body.appendChild(script);
  });
}

async function locateStop(stop: Stop): Promise<LocatedStop | null> {
  if (Number.isFinite(stop.lat) && Number.isFinite(stop.lng)) return stop as LocatedStop;
  const response = await fetch(`/api/geocode?q=${encodeURIComponent(stop.address || stop.name)}`);
  if (!response.ok) return null;
  const payload = await response.json();
  const match = payload?.lat !== undefined ? payload : Array.isArray(payload?.results) ? payload.results[0] : null;
  const lat = Number(match?.lat);
  const lng = Number(match?.lng ?? match?.lon);
  return Number.isFinite(lat) && Number.isFinite(lng) ? { ...stop, lat, lng } : null;
}

function formatDuration(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.round((seconds % 3600) / 60);
  return hours ? `${hours} h ${minutes} min` : `${minutes} min`;
}

export default function TripMapPage() {
  const { slug } = useParams<{ slug: string }>();
  const storageKey = `two-wheels-one-way:trip:${slug}:route`;
  const legacyStorageKey = `two-wheels-one-way:trip:${slug}:map`;
  const mapElement = useRef<HTMLDivElement | null>(null);
  const placeInput = useRef<HTMLInputElement | null>(null);
  const googleMap = useRef<any>(null);
  const directionsService = useRef<any>(null);
  const directionsRenderer = useRef<any>(null);
  const autocomplete = useRef<any>(null);
  const leafletMap = useRef<any>(null);
  const leafletLayer = useRef<any>(null);
  const selectedPlace = useRef<Partial<Stop> | null>(null);

  const [stops, setStops] = useState<Stop[]>([]);
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [mapLoading, setMapLoading] = useState(false);
  const [mapMessage, setMapMessage] = useState("Add at least two stops to calculate a road route.");
  const [provider, setProvider] = useState<MapProvider>(googleMapsKey ? "google" : "openstreetmap");
  const [distanceKm, setDistanceKm] = useState(0);
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [routeCount, setRouteCount] = useState(0);
  const [routeIndex, setRouteIndex] = useState(0);
  const [avoidTolls, setAvoidTolls] = useState(false);
  const [avoidHighways, setAvoidHighways] = useState(false);
  const [avoidFerries, setAvoidFerries] = useState(false);

  useEffect(() => {
    try {
      const current = normalizeStops(JSON.parse(localStorage.getItem(storageKey) || "[]"));
      const legacy = normalizeStops(JSON.parse(localStorage.getItem(legacyStorageKey) || "[]"));
      const recovered = current.length ? current : legacy;
      setStops(recovered);
      if (recovered.length) localStorage.setItem(storageKey, JSON.stringify(recovered));
    } catch {
      setStops([]);
    }
    setLoaded(true);
  }, [legacyStorageKey, storageKey]);

  useEffect(() => {
    if (!loaded) return;
    try { localStorage.setItem(storageKey, JSON.stringify(stops)); } catch {}
  }, [loaded, stops, storageKey]);

  useEffect(() => {
    if (!loaded || !googleMapsKey || !placeInput.current) return;
    void loadGoogleMaps().then((maps) => {
      if (autocomplete.current || !placeInput.current) return;
      autocomplete.current = new maps.places.Autocomplete(placeInput.current, {
        fields: ["place_id", "geometry", "formatted_address", "name"],
        types: ["geocode", "establishment"],
      });
      autocomplete.current.addListener("place_changed", () => {
        const place = autocomplete.current.getPlace();
        const location = place.geometry?.location;
        if (!location) return;
        selectedPlace.current = {
          name: place.name || place.formatted_address || name,
          address: place.formatted_address || "",
          placeId: place.place_id || "",
          lat: location.lat(),
          lng: location.lng(),
        };
        setName(place.name || place.formatted_address || name);
      });
    }).catch(() => setProvider("openstreetmap"));
  }, [loaded, name]);

  async function renderGoogleRoute() {
    if (!mapElement.current) return;
    const maps = await loadGoogleMaps();
    setProvider("google");
    if (!googleMap.current) {
      googleMap.current = new maps.Map(mapElement.current, {
        center: { lat: 55.6761, lng: 12.5683 },
        zoom: 5,
        mapTypeControl: true,
        streetViewControl: false,
        fullscreenControl: true,
      });
      directionsService.current = new maps.DirectionsService();
      directionsRenderer.current = new maps.DirectionsRenderer({
        map: googleMap.current,
        draggable: true,
        preserveViewport: false,
        suppressMarkers: false,
      });
      directionsRenderer.current.addListener("directions_changed", () => {
        const directions = directionsRenderer.current.getDirections();
        const route = directions?.routes?.[directionsRenderer.current.getRouteIndex?.() || 0];
        if (!route) return;
        const totals = route.legs.reduce((sum: { distance: number; duration: number }, leg: any) => ({
          distance: sum.distance + (leg.distance?.value || 0),
          duration: sum.duration + (leg.duration?.value || 0),
        }), { distance: 0, duration: 0 });
        setDistanceKm(Math.round(totals.distance / 1000));
        setDurationSeconds(totals.duration);
      });
    }

    if (stops.length < 2) {
      directionsRenderer.current.setDirections({ routes: [] });
      setDistanceKm(0);
      setDurationSeconds(0);
      setRouteCount(0);
      setMapMessage("Add at least two stops to calculate a Google road route.");
      return;
    }

    const locatedResults = await Promise.all(stops.map(locateStop));
    const located = locatedResults.reduce<LocatedStop[]>((result, stop) => { if (stop) result.push(stop); return result; }, []);
    if (located.length < 2) throw new Error("Google could not locate enough stops. Use specific city, hotel, or landmark names.");

    const request = {
      origin: { lat: located[0].lat, lng: located[0].lng },
      destination: { lat: located[located.length - 1].lat, lng: located[located.length - 1].lng },
      waypoints: located.slice(1, -1).map((stop) => ({ location: { lat: stop.lat, lng: stop.lng }, stopover: true })),
      travelMode: maps.TravelMode.DRIVING,
      provideRouteAlternatives: true,
      avoidTolls,
      avoidHighways,
      avoidFerries,
    };

    const result = await directionsService.current.route(request);
    directionsRenderer.current.setDirections(result);
    directionsRenderer.current.setRouteIndex(Math.min(routeIndex, Math.max(0, result.routes.length - 1)));
    setRouteCount(result.routes.length);
    setRouteIndex((current) => Math.min(current, Math.max(0, result.routes.length - 1)));
    setMapMessage(`${located.length} stops routed on real roads with Google Maps.`);
  }

  async function renderOpenStreetMap() {
    if (!mapElement.current) return;
    setProvider("openstreetmap");
    const L = await loadLeaflet();
    if (!leafletMap.current) {
      leafletMap.current = L.map(mapElement.current, { zoomControl: true }).setView([55.6761, 12.5683], 5);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: "© OpenStreetMap contributors" }).addTo(leafletMap.current);
      leafletLayer.current = L.layerGroup().addTo(leafletMap.current);
    }
    leafletLayer.current.clearLayers();
    const results = await Promise.all(stops.map(locateStop));
    const located = results.reduce<LocatedStop[]>((result, stop) => { if (stop) result.push(stop); return result; }, []);
    located.forEach((stop, index) => L.marker([stop.lat, stop.lng]).addTo(leafletLayer.current).bindPopup(`<strong>${index + 1}. ${stop.name}</strong><br>${stop.notes || "Route stop"}`));
    if (located.length > 1) L.polyline(located.map((stop) => [stop.lat, stop.lng]), { color: "#f36b2b", weight: 4, opacity: 0.85 }).addTo(leafletLayer.current);
    if (located.length) leafletMap.current.fitBounds(L.latLngBounds(located.map((stop) => [stop.lat, stop.lng])), { padding: [40, 40], maxZoom: 12 });
    setMapMessage(googleMapsKey ? "Google Maps was unavailable, so the fallback map is shown." : "Add the Google Maps key in Render to enable real road routing and Places search.");
    window.setTimeout(() => leafletMap.current?.invalidateSize(), 100);
  }

  async function renderMap() {
    if (!mapElement.current || !loaded) return;
    setMapLoading(true);
    setMapMessage("Calculating the journey…");
    try {
      if (googleMapsKey) await renderGoogleRoute();
      else await renderOpenStreetMap();
    } catch (error) {
      setMapMessage(error instanceof Error ? error.message : "The route could not be calculated.");
      if (googleMapsKey) {
        try { await renderOpenStreetMap(); } catch {}
      }
    } finally {
      setMapLoading(false);
    }
  }

  useEffect(() => {
    if (!loaded) return;
    const timeout = window.setTimeout(() => { void renderMap(); }, 500);
    return () => window.clearTimeout(timeout);
  }, [loaded, stops, avoidTolls, avoidHighways, avoidFerries]);

  useEffect(() => {
    if (provider !== "google" || !directionsRenderer.current) return;
    directionsRenderer.current.setRouteIndex(routeIndex);
    const directions = directionsRenderer.current.getDirections();
    const route = directions?.routes?.[routeIndex];
    if (!route) return;
    const totals = route.legs.reduce((sum: { distance: number; duration: number }, leg: any) => ({
      distance: sum.distance + (leg.distance?.value || 0),
      duration: sum.duration + (leg.duration?.value || 0),
    }), { distance: 0, duration: 0 });
    setDistanceKm(Math.round(totals.distance / 1000));
    setDurationSeconds(totals.duration);
  }, [provider, routeIndex]);

  function addStop(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) return;
    const place = selectedPlace.current;
    setStops((current) => [...current, {
      id: makeId(),
      name: String(place?.name || name).trim(),
      notes: notes.trim(),
      address: place?.address,
      placeId: place?.placeId,
      lat: typeof place?.lat === "number" ? place.lat : undefined,
      lng: typeof place?.lng === "number" ? place.lng : undefined,
    }]);
    selectedPlace.current = null;
    setName("");
    setNotes("");
  }

  function move(index: number, direction: -1 | 1) {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= stops.length) return;
    setStops((current) => {
      const next = [...current];
      [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
      return next;
    });
  }

  const directionsUrl = stops.length > 1 ? `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(stops[0].address || stops[0].name)}&destination=${encodeURIComponent(stops[stops.length - 1].address || stops[stops.length - 1].name)}&waypoints=${encodeURIComponent(stops.slice(1, -1).map((stop) => stop.address || stop.name).join("|"))}&travelmode=driving` : "";

  return (
    <main className="archive-page workspace-page route-planner-page">
      <header className="archive-page-header"><Link href={`/trips/${slug}`}><ArrowLeft size={17} /> Back to trip</Link><div className="archive-header-links"><Link href={`/trips/${slug}/packing`}>Packing</Link><Link href="/trips">Change trip</Link></div></header>
      <section className="archive-page-hero compact-archive-hero"><p className="eyebrow dark">GOOGLE ROUTE PLANNER · {slug.replaceAll("-", " ").toUpperCase()}</p><h1>Build the road,<br />not just the list.</h1><p>Search real places, calculate the road route, compare alternatives and keep the accepted itinerary saved inside this trip.</p></section>

      <section className="route-metrics">
        <div><small>Map provider</small><strong>{provider === "google" ? "Google Maps" : "OpenStreetMap fallback"}</strong></div>
        <div><small>Distance</small><strong>{distanceKm ? `${distanceKm.toLocaleString()} km` : "—"}</strong></div>
        <div><small>Estimated riding</small><strong>{durationSeconds ? formatDuration(durationSeconds) : "—"}</strong></div>
        <div><small>Saved stops</small><strong>{stops.length}</strong></div>
      </section>

      <section className="route-map-panel google-planner-panel">
        <header>
          <div><p className="eyebrow dark">LIVE ROAD ROUTE</p><h2>{routeCount > 1 ? `${routeCount} route alternatives` : "Interactive journey map"}</h2><p>{mapMessage}</p></div>
          <div className="route-map-actions"><button type="button" onClick={() => void renderMap()} disabled={mapLoading}>{mapLoading ? <LoaderCircle className="route-map-spin" size={16} /> : <RefreshCw size={16} />} Recalculate</button>{directionsUrl && <a href={directionsUrl} target="_blank" rel="noreferrer">Open in Google Maps <ExternalLink size={15} /></a>}</div>
        </header>

        <div className="route-planner-controls">
          <label><input type="checkbox" checked={avoidTolls} onChange={(event) => setAvoidTolls(event.target.checked)} /> Avoid tolls</label>
          <label><input type="checkbox" checked={avoidHighways} onChange={(event) => setAvoidHighways(event.target.checked)} /> Avoid highways</label>
          <label><input type="checkbox" checked={avoidFerries} onChange={(event) => setAvoidFerries(event.target.checked)} /> Avoid ferries</label>
          {routeCount > 1 && <label className="route-alternative-select">Route option<select value={routeIndex} onChange={(event) => setRouteIndex(Number(event.target.value))}>{Array.from({ length: routeCount }, (_, index) => <option value={index} key={index}>Option {index + 1}</option>)}</select></label>}
        </div>

        <div className="route-map-canvas" ref={mapElement}><span>{mapLoading ? "Calculating route…" : "Interactive route map"}</span></div>
        <small>{provider === "google" ? "The displayed line follows Google’s calculated road route. Drag the route to inspect alternatives, then keep the saved stop order as the itinerary." : "Google Maps is not configured or unavailable. The fallback map shows saved stops without full road-routing intelligence."}</small>
      </section>

      {!googleMapsKey && <section className="route-google-setup"><Navigation /><div><strong>Enable the full Google planner</strong><p>Add <code>NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> in Render and enable Maps JavaScript, Places and Directions APIs.</p></div></section>}

      <section className="packing-workspace route-workspace">
        <form className="packing-add-form" onSubmit={addStop}>
          <div className="workspace-heading"><MapPin size={23} /><div><p className="eyebrow dark">ADD A REAL PLACE</p><h2>New route stop</h2></div></div>
          <label>Search place<input ref={placeInput} value={name} onChange={(event) => { setName(event.target.value); selectedPlace.current = null; }} placeholder={googleMapsKey ? "Search city, hotel, landmark or address" : "Town, hotel or landmark + country"} /></label>
          <label>Planning notes<input value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Overnight, fuel, meal, viewpoint…" /></label>
          <button className="primary-button" type="submit" disabled={!name.trim()}><Plus size={17} /> Add to route</button>
          <small>{googleMapsKey ? "Choose a Google suggestion when possible so the location stays precise." : "Saved automatically. Google autocomplete activates after the API key is configured."}</small>
        </form>

        <div className="packing-lists">
          <div className="workspace-heading"><Route size={23} /><div><p className="eyebrow dark">ITINERARY ORDER</p><h2>{stops.length} saved stops</h2></div></div>
          {stops.map((stop, index) => <article className="packing-category route-stop-card" key={stop.id}><header><h3>{String(index + 1).padStart(2, "0")} · {stop.name}</h3><span>{index === 0 ? "Start" : index === stops.length - 1 ? "Finish" : "Stop"}</span></header>{stop.address && stop.address !== stop.name && <small className="route-stop-address">{stop.address}</small>}<p className="workspace-card-copy">{stop.notes || "No planning notes yet."}</p><div className="workspace-card-actions"><button type="button" onClick={() => move(index, -1)} disabled={index === 0}><ArrowUp size={16} /> Earlier</button><button type="button" onClick={() => move(index, 1)} disabled={index === stops.length - 1}><ArrowDown size={16} /> Later</button><button type="button" onClick={() => setStops((current) => current.filter((item) => item.id !== stop.id))}><Trash2 size={16} /> Remove</button></div></article>)}
          {!stops.length && <div className="empty-workspace"><MapPin size={24} /><p>No route stops have been added to this journey yet.</p></div>}
        </div>
      </section>
    </main>
  );
}
