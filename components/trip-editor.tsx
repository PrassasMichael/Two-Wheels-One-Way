"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Save } from "lucide-react";
import type { Trip, TripStatus } from "@/lib/types";
import { findCustomTrip, slugifyTrip, upsertCustomTrip } from "@/lib/client-trips";

const emptyTrip: Trip = {
  id: "",
  slug: "",
  title: "",
  subtitle: "",
  year: new Date().getFullYear(),
  status: "planning",
  origin: "Denmark",
  destination: "",
  countries: [],
  travellers: 2,
  transport: "",
  summary: "",
  tags: [],
};

export default function TripEditor({ mode, slug, initialTrip }: { mode: "create" | "edit"; slug?: string; initialTrip?: Trip | null }) {
  const router = useRouter();
  const [trip, setTrip] = useState<Trip>(initialTrip || emptyTrip);
  const [countries, setCountries] = useState(initialTrip?.countries.join(", ") || "");
  const [tags, setTags] = useState(initialTrip?.tags.join(", ") || "");

  useEffect(() => {
    if (mode === "edit" && slug && !initialTrip) {
      const custom = findCustomTrip(slug);
      if (custom) {
        setTrip(custom);
        setCountries(custom.countries.join(", "));
        setTags(custom.tags.join(", "));
      }
    }
  }, [initialTrip, mode, slug]);

  const generatedSlug = useMemo(() => slugifyTrip(trip.title || trip.destination), [trip.title, trip.destination]);

  function update<K extends keyof Trip>(key: K, value: Trip[K]) {
    setTrip((current) => ({ ...current, [key]: value }));
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    const finalSlug = mode === "edit" && trip.slug ? trip.slug : generatedSlug;
    const saved: Trip = {
      ...trip,
      id: trip.id || finalSlug,
      slug: finalSlug,
      year: Number(trip.year) || new Date().getFullYear(),
      travellers: Number(trip.travellers) || 1,
      countries: countries.split(",").map((item) => item.trim()).filter(Boolean),
      tags: tags.split(",").map((item) => item.trim()).filter(Boolean),
      subtitle: trip.subtitle || trip.summary,
    };
    upsertCustomTrip(saved);
    router.push(`/trips/${saved.slug}`);
  }

  return (
    <form className="trip-editor" onSubmit={submit}>
      <div className="trip-editor-grid">
        <label className="wide">Journey title<input required value={trip.title} onChange={(e) => update("title", e.target.value)} placeholder="Denmark to Greece" /></label>
        <label>Destination<input required value={trip.destination} onChange={(e) => update("destination", e.target.value)} placeholder="Crete, Greece" /></label>
        <label>Origin<input value={trip.origin} onChange={(e) => update("origin", e.target.value)} /></label>
        <label>Start date<input type="date" value={trip.startDate || ""} onChange={(e) => update("startDate", e.target.value)} /></label>
        <label>End date<input type="date" value={trip.endDate || ""} onChange={(e) => update("endDate", e.target.value)} /></label>
        <label>Travellers<input min="1" type="number" value={trip.travellers} onChange={(e) => update("travellers", Number(e.target.value))} /></label>
        <label>Status<select value={trip.status} onChange={(e) => update("status", e.target.value as TripStatus)}><option value="planning">Planning</option><option value="upcoming">Upcoming</option><option value="travelling">Travelling</option><option value="completed">Completed</option></select></label>
        <label className="wide">Transport<input value={trip.transport} onChange={(e) => update("transport", e.target.value)} placeholder="Motorcycle, rental car, ferry..." /></label>
        <label className="wide">Short description<input value={trip.subtitle} onChange={(e) => update("subtitle", e.target.value)} placeholder="A one-line description for journey cards" /></label>
        <label className="wide">Journey summary<textarea required rows={5} value={trip.summary} onChange={(e) => update("summary", e.target.value)} placeholder="Describe the route, purpose and shape of the trip." /></label>
        <label>Countries<input value={countries} onChange={(e) => setCountries(e.target.value)} placeholder="Denmark, Germany, Greece" /></label>
        <label>Tags<input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="Road trip, Couple, Summer" /></label>
      </div>
      <div className="trip-editor-footer"><span>Workspace: <strong>{generatedSlug}</strong></span><button className="v2-primary" type="submit">{mode === "create" ? <><span>Create journey</span><ArrowRight size={17} /></> : <><Save size={17} /><span>Save journey</span></>}</button></div>
    </form>
  );
}
