"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ExternalLink, MapPin, Plus, Route, Trash2 } from "lucide-react";

type Place = { id: string; name: string; lat: number; lng: number; note: string };
type LeafletMap = { remove: () => void; fitBounds: (bounds: unknown, options?: unknown) => void };

declare global {
  interface Window { L?: any; }
}

const PLACES_KEY = "two-wheels-one-way:map:places";
const defaultPlaces: Place[] = [
  { id: "thessaloniki", name: "Thessaloniki", lat: 40.6401, lng: 22.9444, note: "Arrival and rental car collection" },
  { id: "ioannina", name: "Ioannina", lat: 39.665, lng: 20.8537, note: "Road-trip base" },
  { id: "tzoumerka", name: "Tzoumerka", lat: 39.48, lng: 21.13, note: "Mountain day trip" },
  { id: "zagori", name: "Zagorochoria", lat: 39.88, lng: 20.75, note: "Villages and gorge" },
  { id: "sivota", name: "Sivota", lat: 39.4079, lng: 20.2406, note: "Ionian coast" },
  { id: "parga", name: "Parga", lat: 39.2853, lng: 20.4005, note: "Seaside stop" },
  { id: "lefkada", name: "Lefkada", lat: 38.7066, lng: 20.6407, note: "Island chapter" },
  { id: "athens", name: "Athens", lat: 37.9838, lng: 23.7275, note: "City chapter" },
  { id: "crete", name: "Crete", lat: 35.2401, lng: 24.8093, note: "Final island chapter" },
];

export default function MapPage() {
  const mapElement = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<LeafletMap | null>(null);
  const [places, setPlaces] = useState<Place[]>(defaultPlaces);
  const [selected, setSelected] = useState(defaultPlaces[0].id);
  const [newPlace, setNewPlace] = useState({ name: "", lat: "", lng: "", note: "" });

  useEffect(() => {
    try {
      const stored = localStorage.getItem(PLACES_KEY);
      if (stored) setPlaces(JSON.parse(stored));
    } catch {}
  }, []);

  useEffect(() => { localStorage.setItem(PLACES_KEY, JSON.stringify(places)); }, [places]);

  useEffect(() => {
    const cssId = "leaflet-css";
    if (!document.getElementById(cssId)) {
      const link = document.createElement("link");
      link.id = cssId;
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    function initialise() {
      if (!mapElement.current || !window.L) return;
      mapInstance.current?.remove();
      const L = window.L;
      const map = L.map(mapElement.current, { scrollWheelZoom: true }).setView([38.8, 22.2], 6);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(map);
      const coordinates = places.map((place) => [place.lat, place.lng]);
      places.forEach((place, index) => {
        L.marker([place.lat, place.lng]).addTo(map).bindPopup(`<strong>${index + 1}. ${place.name}</strong><br>${place.note || "Saved destination"}`);
      });
      if (coordinates.length > 1) L.polyline(coordinates, { color: "#b95532", weight: 4, opacity: .85 }).addTo(map);
      if (coordinates.length) map.fitBounds(L.latLngBounds(coordinates), { padding: [35, 35] });
      mapInstance.current = map;
    }

    if (window.L) initialise();
    else {
      const script = document.createElement("script");
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.onload = initialise;
      document.body.appendChild(script);
    }
    return () => mapInstance.current?.remove();
  }, [places]);

  function addPlace() {
    const lat = Number(newPlace.lat);
    const lng = Number(newPlace.lng);
    if (!newPlace.name.trim() || !Number.isFinite(lat) || !Number.isFinite(lng)) return;
    const place = { id: crypto.randomUUID(), name: newPlace.name.trim(), lat, lng, note: newPlace.note.trim() };
    setPlaces((current) => [...current, place]);
    setSelected(place.id);
    setNewPlace({ name: "", lat: "", lng: "", note: "" });
  }

  const selectedPlace = places.find((place) => place.id === selected);

  return (
    <main className="archive-page workspace-page">
      <header className="archive-page-header">
        <Link href="/"><ArrowLeft size={17} /> Back home</Link>
        <div className="archive-header-links"><Link href="/roadbooks">Roadbooks</Link><Link href="/stories">Stories</Link></div>
      </header>

      <section className="archive-page-hero compact-archive-hero">
        <p className="eyebrow dark">ONE CONNECTED MAP</p>
        <h1>Every road,<br />in one place.</h1>
        <p>Explore the active route, open destinations and add future stops with coordinates and notes.</p>
      </section>

      <section className="interactive-map-layout">
        <div className="map-canvas-wrap"><div ref={mapElement} className="leaflet-map" aria-label="Interactive Greece route map" /></div>

        <aside className="map-control-panel">
          <div className="workspace-heading"><Route size={23} /><div><p className="eyebrow dark">CURRENT ROUTE</p><h2>Greece 2026</h2></div></div>
          <div className="map-place-list">
            {places.map((place, index) => (
              <button type="button" className={selected === place.id ? "active" : ""} key={place.id} onClick={() => setSelected(place.id)}>
                <span>{String(index + 1).padStart(2, "0")}</span><div><strong>{place.name}</strong><small>{place.note || `${place.lat}, ${place.lng}`}</small></div><MapPin size={17} />
              </button>
            ))}
          </div>

          {selectedPlace && <div className="selected-place-card"><p className="eyebrow dark">SELECTED PLACE</p><h3>{selectedPlace.name}</h3><p>{selectedPlace.note}</p><a href={`https://www.openstreetmap.org/?mlat=${selectedPlace.lat}&mlon=${selectedPlace.lng}#map=12/${selectedPlace.lat}/${selectedPlace.lng}`} target="_blank" rel="noreferrer">Open full map <ExternalLink size={15} /></a>{!defaultPlaces.some((place) => place.id === selectedPlace.id) && <button type="button" onClick={() => setPlaces((current) => current.filter((place) => place.id !== selectedPlace.id))}><Trash2 size={15} /> Remove place</button>}</div>}

          <div className="add-place-panel">
            <p className="eyebrow dark">ADD A PLACE</p>
            <input placeholder="Place name" value={newPlace.name} onChange={(e) => setNewPlace({ ...newPlace, name: e.target.value })} />
            <div><input placeholder="Latitude" inputMode="decimal" value={newPlace.lat} onChange={(e) => setNewPlace({ ...newPlace, lat: e.target.value })} /><input placeholder="Longitude" inputMode="decimal" value={newPlace.lng} onChange={(e) => setNewPlace({ ...newPlace, lng: e.target.value })} /></div>
            <textarea rows={3} placeholder="Why this place matters" value={newPlace.note} onChange={(e) => setNewPlace({ ...newPlace, note: e.target.value })} />
            <button type="button" onClick={addPlace}><Plus size={16} /> Add to map</button>
          </div>
        </aside>
      </section>
    </main>
  );
}
