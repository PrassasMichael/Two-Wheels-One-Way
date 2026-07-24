"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { FormEvent, useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowLeft, ArrowUp, ExternalLink, LoaderCircle, MapPin, Plus, RefreshCw, Trash2 } from "lucide-react";
import "../../../packing/packing.css";
import "./route-map.css";

type Stop = { id: string; name: string; notes: string };
type LocatedStop = Stop & { lat: number; lon: number };
type LeafletWindow = Window & { L?: any };

function makeId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return `stop-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function isStop(value: unknown): value is Stop {
  if (!value || typeof value !== "object") return false;
  const stop = value as Partial<Stop>;
  return typeof stop.id === "string" && typeof stop.name === "string" && typeof stop.notes === "string";
}

function loadLeaflet(): Promise<any> {
  return new Promise((resolve, reject) => {
    const current = window as LeafletWindow;
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
      existing.addEventListener("load", () => resolve((window as LeafletWindow).L));
      existing.addEventListener("error", () => reject(new Error("Map library failed to load.")));
      return;
    }
    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.dataset.leaflet = "true";
    script.onload = () => resolve((window as LeafletWindow).L);
    script.onerror = () => reject(new Error("Map library failed to load."));
    document.body.appendChild(script);
  });
}

async function locateStop(stop: Stop): Promise<LocatedStop | null> {
  const response = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(stop.name)}`, {
    headers: { "Accept-Language": "en" },
  });
  if (!response.ok) return null;
  const results = await response.json();
  const match = Array.isArray(results) ? results[0] : null;
  if (!match) return null;
  const lat = Number(match.lat);
  const lon = Number(match.lon);
  return Number.isFinite(lat) && Number.isFinite(lon) ? { ...stop, lat, lon } : null;
}

export default function TripMapPage() {
  const { slug } = useParams<{ slug: string }>();
  const storageKey = `two-wheels-one-way:trip:${slug}:route`;
  const mapElement = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<any>(null);
  const mapLayer = useRef<any>(null);
  const [stops, setStops] = useState<Stop[]>([]);
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [mapLoading, setMapLoading] = useState(false);
  const [mapMessage, setMapMessage] = useState("Add at least one named stop to place it on the map.");
  const [locatedCount, setLocatedCount] = useState(0);

  useEffect(() => {
    try {
      const saved: unknown = JSON.parse(localStorage.getItem(storageKey) || "[]");
      if (Array.isArray(saved)) setStops(saved.filter(isStop));
    } catch {
      setStops([]);
    }
    setLoaded(true);
  }, [storageKey]);

  useEffect(() => {
    if (!loaded) return;
    try { localStorage.setItem(storageKey, JSON.stringify(stops)); } catch {}
  }, [loaded, stops, storageKey]);

  async function renderMap() {
    if (!mapElement.current) return;
    if (!stops.length) {
      setLocatedCount(0);
      setMapMessage("Add at least one named stop to place it on the map.");
      if (mapLayer.current) mapLayer.current.clearLayers();
      return;
    }
    setMapLoading(true);
    setMapMessage("Locating route stops…");
    try {
      const L = await loadLeaflet();
      if (!mapInstance.current) {
        mapInstance.current = L.map(mapElement.current, { zoomControl: true }).setView([55.6761, 12.5683], 5);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          attribution: "© OpenStreetMap contributors",
        }).addTo(mapInstance.current);
        mapLayer.current = L.layerGroup().addTo(mapInstance.current);
      }
      mapLayer.current.clearLayers();
      const located = (await Promise.all(stops.map(locateStop))).filter((stop): stop is LocatedStop => Boolean(stop));
      setLocatedCount(located.length);
      located.forEach((stop, index) => {
        L.marker([stop.lat, stop.lon]).addTo(mapLayer.current).bindPopup(`<strong>${index + 1}. ${stop.name}</strong><br>${stop.notes || "Route stop"}`);
      });
      if (located.length > 1) L.polyline(located.map((stop) => [stop.lat, stop.lon]), { color: "#f36b2b", weight: 4, opacity: 0.85 }).addTo(mapLayer.current);
      if (located.length) {
        mapInstance.current.fitBounds(L.latLngBounds(located.map((stop) => [stop.lat, stop.lon])), { padding: [40, 40], maxZoom: 12 });
        setMapMessage(located.length === stops.length ? `${located.length} route stops shown.` : `${located.length} of ${stops.length} stops found. Add a country or region to ambiguous place names.`);
      } else {
        setMapMessage("None of the saved stop names could be located. Try adding a city and country.");
      }
      window.setTimeout(() => mapInstance.current?.invalidateSize(), 100);
    } catch (error) {
      setMapMessage(error instanceof Error ? error.message : "The interactive map could not load.");
    } finally {
      setMapLoading(false);
    }
  }

  useEffect(() => {
    if (!loaded) return;
    const timeout = window.setTimeout(() => { void renderMap(); }, 450);
    return () => window.clearTimeout(timeout);
  }, [loaded, stops]);

  function addStop(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) return;
    setStops((current) => [...current, { id: makeId(), name: name.trim(), notes: notes.trim() }]);
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

  const directionsUrl = stops.length > 1 ? `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(stops[0].name)}&destination=${encodeURIComponent(stops[stops.length - 1].name)}&waypoints=${encodeURIComponent(stops.slice(1, -1).map((stop) => stop.name).join("|"))}&travelmode=driving` : "";

  return (
    <main className="archive-page workspace-page">
      <header className="archive-page-header"><Link href={`/trips/${slug}`}><ArrowLeft size={17} /> Back to trip</Link><div className="archive-header-links"><Link href={`/trips/${slug}/packing`}>Packing</Link><Link href="/trips">Change trip</Link></div></header>
      <section className="archive-page-hero compact-archive-hero"><p className="eyebrow dark">ROUTE · {slug.replaceAll("-", " ").toUpperCase()}</p><h1>Shape this<br />journey’s road.</h1><p>The interactive map and itinerary use the same saved route. Reorder a stop and the map updates automatically.</p></section>

      <section className="route-map-panel">
        <header><div><p className="eyebrow dark">INTERACTIVE MAP</p><h2>{locatedCount} mapped stops</h2><p>{mapMessage}</p></div><div className="route-map-actions"><button type="button" onClick={() => void renderMap()} disabled={mapLoading}>{mapLoading ? <LoaderCircle className="route-map-spin" size={16} /> : <RefreshCw size={16} />} Refresh map</button>{directionsUrl && <a href={directionsUrl} target="_blank" rel="noreferrer">Open road directions <ExternalLink size={15} /></a>}</div></header>
        <div className="route-map-canvas" ref={mapElement}><span>{mapLoading ? "Loading map…" : "Interactive route map"}</span></div>
        <small>Map tiles and place search are provided by OpenStreetMap. The line connects saved stops in order; it is not turn-by-turn routing.</small>
      </section>

      <section className="packing-workspace">
        <form className="packing-add-form" onSubmit={addStop}>
          <div className="workspace-heading"><MapPin size={23} /><div><p className="eyebrow dark">ADD A PLACE</p><h2>New route stop</h2></div></div>
          <label>Place<input value={name} onChange={(event) => setName(event.target.value)} placeholder="Town, hotel or landmark + country" /></label>
          <label>Notes<input value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Why stop here?" /></label>
          <button className="primary-button" type="submit" disabled={!name.trim()}><Plus size={17} /> Add stop</button>
          <small>Saved automatically for {slug}.</small>
        </form>
        <div className="packing-lists">
          <div className="workspace-heading"><MapPin size={23} /><div><p className="eyebrow dark">ROUTE ORDER</p><h2>{stops.length} saved stops</h2></div></div>
          {stops.map((stop, index) => <article className="packing-category" key={stop.id}><header><h3>{String(index + 1).padStart(2, "0")} · {stop.name}</h3><span>{index === 0 ? "Start" : index === stops.length - 1 ? "Finish" : "Stop"}</span></header><p className="workspace-card-copy">{stop.notes || "No notes yet."}</p><div className="workspace-card-actions"><button type="button" onClick={() => move(index, -1)} disabled={index === 0}><ArrowUp size={16} /> Earlier</button><button type="button" onClick={() => move(index, 1)} disabled={index === stops.length - 1}><ArrowDown size={16} /> Later</button><button type="button" onClick={() => setStops((current) => current.filter((item) => item.id !== stop.id))}><Trash2 size={16} /> Remove</button></div></article>)}
          {!stops.length && <div className="empty-workspace"><p>No route stops have been added to this journey yet.</p></div>}
        </div>
      </section>
    </main>
  );
}
