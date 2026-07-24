"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { ArrowDown, ArrowLeft, ArrowUp, MapPin, Plus, Trash2 } from "lucide-react";
import "../../../packing/packing.css";

type Stop = { id: string; name: string; notes: string };

function makeId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return `stop-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function isStop(value: unknown): value is Stop {
  if (!value || typeof value !== "object") return false;
  const stop = value as Partial<Stop>;
  return typeof stop.id === "string" && typeof stop.name === "string" && typeof stop.notes === "string";
}

export default function TripMapPage() {
  const { slug } = useParams<{ slug: string }>();
  const storageKey = `two-wheels-one-way:trip:${slug}:route`;
  const [stops, setStops] = useState<Stop[]>([]);
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const [loaded, setLoaded] = useState(false);

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
    try {
      localStorage.setItem(storageKey, JSON.stringify(stops));
    } catch {}
  }, [loaded, stops, storageKey]);

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

  return (
    <main className="archive-page workspace-page">
      <header className="archive-page-header"><Link href={`/trips/${slug}`}><ArrowLeft size={17} /> Back to trip</Link><div className="archive-header-links"><Link href={`/trips/${slug}/packing`}>Packing</Link><Link href="/trips">Change trip</Link></div></header>
      <section className="archive-page-hero compact-archive-hero"><p className="eyebrow dark">ROUTE · {slug.replaceAll("-", " ").toUpperCase()}</p><h1>Shape this<br />journey’s road.</h1><p>Stops and their order are stored only inside this trip. Reorder the route at any time.</p></section>
      <section className="packing-workspace">
        <form className="packing-add-form" onSubmit={addStop}>
          <div className="workspace-heading"><MapPin size={23} /><div><p className="eyebrow dark">ADD A PLACE</p><h2>New route stop</h2></div></div>
          <label>Place<input value={name} onChange={(event) => setName(event.target.value)} placeholder="Town, hotel or landmark" /></label>
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
