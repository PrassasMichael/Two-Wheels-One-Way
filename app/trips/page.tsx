"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, CalendarDays, MapPin, Plus } from "lucide-react";
import tripsData from "@/content/trips.json";
import type { Trip } from "@/lib/types";
import { readCustomTrips } from "@/lib/client-trips";

const builtInTrips = tripsData as Trip[];

function mergedTrips(): Trip[] {
  const map = new Map<string, Trip>();
  builtInTrips.forEach((trip) => map.set(trip.slug, trip));
  readCustomTrips().forEach((trip) => map.set(trip.slug, trip));
  return Array.from(map.values()).sort((a, b) => b.year - a.year);
}

export default function TripsPage() {
  const [trips, setTrips] = useState<Trip[]>(builtInTrips);

  useEffect(() => {
    const sync = () => setTrips(mergedTrips());
    sync();
    window.addEventListener("trip-registry-updated", sync);
    window.addEventListener("storage", sync);
    return () => { window.removeEventListener("trip-registry-updated", sync); window.removeEventListener("storage", sync); };
  }, []);

  return (
    <main className="v2-page">
      <header className="v2-page-header"><Link href="/"><ArrowLeft size={17} /> Back home</Link><span className="v2-brand">Journey archive</span></header>
      <section className="v2-page-intro"><p className="v2-kicker">All journeys</p><h1>Every trip gets<br />its own world.</h1><p>Routes, packing, costs, documents and memories stay together inside one private archive — separate when they need to be, connected by one familiar system.</p></section>
      <section className="v2-journey-grid">
        {trips.map((trip) => <Link className="v2-journey-card" href={`/trips/${trip.slug}`} key={trip.id}><div className="v2-card-link" style={{ marginTop: 0 }}><span>{trip.status.toUpperCase()}</span><span>{trip.year}</span></div><h2>{trip.title}</h2><p>{trip.summary}</p><div className="v2-meta"><span className="v2-chip"><CalendarDays size={15} /> {trip.startDate || `${trip.month || ""} ${trip.year}`}</span><span className="v2-chip"><MapPin size={15} /> {trip.destination}</span></div><span className="v2-card-link"><span>Open journey</span><ArrowRight size={18} /></span></Link>)}
        <Link className="v2-journey-card v2-new-card" href="/trips/new"><div className="v2-card-link" style={{ marginTop: 0 }}><span>NEW JOURNEY</span><Plus size={19} /></div><h2>Create the next chapter.</h2><p>Set the trip once and receive a complete isolated route, packing, budget, documents and journal workspace.</p><span className="v2-card-link"><span>Create journey</span><ArrowRight size={18} /></span></Link>
      </section>
    </main>
  );
}
