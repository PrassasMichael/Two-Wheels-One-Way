"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, BookOpen, CalendarDays, FileText, Map, PackageCheck, Receipt, Users } from "lucide-react";
import type { Trip } from "@/lib/types";
import { findCustomTrip } from "@/lib/client-trips";
import { tripStorageKey } from "@/lib/trips";

const modules = [
  { href: "map", icon: Map, title: "Route", text: "Build the road and keep every meaningful stop in order." },
  { href: "packing", icon: PackageCheck, title: "Packing", text: "Prepare the luggage with a checklist made only for this journey." },
  { href: "journal", icon: BookOpen, title: "Journal", text: "Capture plans before departure and memories from the road." },
  { href: "budget", icon: Receipt, title: "Budget", text: "Keep planned and actual costs beside the journey they belong to." },
  { href: "documents", icon: FileText, title: "Documents", text: "Store bookings, insurance and practical travel references." },
];

function hasData(slug: string, module: string): boolean {
  try {
    const raw = localStorage.getItem(tripStorageKey(slug, module));
    if (!raw) return false;
    const value = JSON.parse(raw);
    if (Array.isArray(value)) return value.length > 0;
    if (value && typeof value === "object") return Object.keys(value).length > 0;
    return Boolean(value);
  } catch { return false; }
}

export default function TripDashboardClient({ slug, initialTrip }: { slug: string; initialTrip: Trip | null }) {
  const [trip, setTrip] = useState<Trip | null>(initialTrip);
  const [completed, setCompleted] = useState<string[]>([]);

  useEffect(() => {
    setTrip(findCustomTrip(slug) || initialTrip || null);
    setCompleted(modules.filter((module) => hasData(slug, module.href)).map((module) => module.href));
  }, [initialTrip, slug]);

  const progress = Math.round((completed.length / modules.length) * 100);
  const focusItems = useMemo(() => trip?.planningNeeded?.slice(0, 5) ?? ["Confirm exact dates", "Finish the route", "Review the packing list"], [trip]);

  if (!trip) return <main className="v2-page"><header className="v2-page-header"><Link href="/trips"><ArrowLeft size={17} /> All journeys</Link></header><section className="v2-dashboard-hero"><p className="v2-kicker">Journey not found</p><h1>This workspace does not exist.</h1><Link className="v2-primary" href="/trips/new">Create a journey <ArrowRight size={17} /></Link></section></main>;

  return (
    <main className="v2-page">
      <header className="v2-page-header"><Link href="/trips"><ArrowLeft size={17} /> All journeys</Link><Link href="/">Two Wheels, One Way</Link></header>
      <section className="v2-dashboard-hero">
        <div className="v2-dashboard-heading"><div><p className="v2-kicker">{trip.status} · {trip.month || ""} {trip.year}</p><h1>{trip.title}</h1><p>{trip.summary}</p></div><div className="trip-readiness"><strong>{progress}%</strong><span>planning readiness</span><i><b style={{ width: `${progress}%` }} /></i></div></div>
        <div className="v2-meta"><span className="v2-chip"><CalendarDays size={15} /> {trip.startDate || `${trip.month || ""} ${trip.year}`}</span><span className="v2-chip"><Users size={15} /> {trip.travellers} travellers</span></div>
      </section>
      <section className="v2-dashboard-grid">
        <div className="v2-module-grid">{modules.map(({ href, icon: Icon, title, text }) => <Link className={`v2-module ${completed.includes(href) ? "module-started" : ""}`} href={`/trips/${trip.slug}/${href}`} key={href}><span className="v2-feature-icon"><Icon size={21} /></span><h3>{title}</h3><p>{text}</p><span>{completed.includes(href) ? "Continue module" : "Start module"} <ArrowRight size={16} /></span></Link>)}</div>
        <aside className="v2-focus"><p className="v2-kicker">Planning focus</p><h2>What needs attention next.</h2><div className="v2-focus-list">{focusItems.map((item) => <div className="v2-focus-item" key={item}><i /> <span>{item}</span></div>)}</div><Link className="v2-card-link" href={`/trips/${trip.slug}/journal`}><span>Add a planning note</span><ArrowRight size={17} /></Link></aside>
      </section>
    </main>
  );
}
