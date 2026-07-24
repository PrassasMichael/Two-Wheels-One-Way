"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CalendarDays,
  FileText,
  Map,
  MapPin,
  Mountain,
  PackageCheck,
  Pencil,
  Receipt,
  Route,
  Users,
} from "lucide-react";
import type { Trip } from "@/lib/types";
import { findCustomTrip } from "@/lib/client-trips";
import { tripStorageKey } from "@/lib/trips";

const modules = [
  { href: "map", icon: Route, title: "Route", text: "Stops, roads and distance", image: "https://images.unsplash.com/photo-1519003300449-424ad0405076?auto=format&fit=crop&w=900&q=85" },
  { href: "packing", icon: PackageCheck, title: "Packing", text: "Gear for two riders", image: "https://images.unsplash.com/photo-1527631746610-bca00a040d60?auto=format&fit=crop&w=900&q=85" },
  { href: "budget", icon: Receipt, title: "Budget", text: "Planned and actual costs", image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=900&q=85" },
  { href: "documents", icon: FileText, title: "Documents", text: "Bookings and references", image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=900&q=85" },
  { href: "journal", icon: BookOpen, title: "Journal", text: "Plans and road memories", image: "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=900&q=85" },
];

const memories = [
  { title: "Mountain roads", label: "The road ahead", image: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1000&q=85" },
  { title: "Hidden villages", label: "Places worth stopping", image: "https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=1000&q=85" },
  { title: "Coffee with a view", label: "Slow mornings", image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1000&q=85" },
  { title: "Sunset by the sea", label: "The way back", image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1000&q=85" },
];

function readModuleData(slug: string, module: string): unknown {
  try {
    const raw = localStorage.getItem(tripStorageKey(slug, module));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function hasData(value: unknown): boolean {
  if (Array.isArray(value)) return value.length > 0;
  if (value && typeof value === "object") return Object.keys(value).length > 0;
  return Boolean(value);
}

export default function TripDashboardClient({ slug, initialTrip }: { slug: string; initialTrip: Trip | null }) {
  const [trip, setTrip] = useState<Trip | null>(initialTrip);
  const [moduleData, setModuleData] = useState<Record<string, unknown>>({});

  useEffect(() => {
    setTrip(findCustomTrip(slug) || initialTrip || null);
    setModuleData(Object.fromEntries(modules.map((module) => [module.href, readModuleData(slug, module.href)])));
  }, [initialTrip, slug]);

  const completed = modules.filter((module) => hasData(moduleData[module.href])).map((module) => module.href);
  const progress = Math.round((completed.length / modules.length) * 100);
  const focusItems = useMemo(() => trip?.planningNeeded?.slice(0, 3) ?? ["Confirm exact dates", "Finish the route", "Review the packing list"], [trip]);

  if (!trip) {
    return <main className="adventure-empty"><h1>Journey not found.</h1><Link href="/trips/new">Create a journey</Link></main>;
  }

  const dateLabel = trip.startDate || `${trip.month || ""} ${trip.year}`.trim();

  return (
    <main className="adventure-app">
      <aside className="adventure-sidebar">
        <Link className="adventure-logo" href="/"><Mountain /><strong>TWO WHEELS<br />ONE WAY</strong></Link>
        <nav>
          <Link className="active" href={`/trips/${trip.slug}`}><MapPin /> Overview</Link>
          {modules.map(({ href, icon: Icon, title }) => <Link href={`/trips/${trip.slug}/${href}`} key={href}><Icon /> {title}</Link>)}
          <Link href={`/trips/${trip.slug}/edit`}><Pencil /> Edit journey</Link>
        </nav>
        <div className="adventure-quote"><span>“</span><p>Not all those who wander are lost.</p><small>— J.R.R. Tolkien</small></div>
      </aside>

      <div className="adventure-main">
        <header className="adventure-topbar">
          <Link href="/trips"><ArrowLeft /> Back to trips</Link>
          <Link className="adventure-action" href={`/trips/${trip.slug}/edit`}>Trip actions <Pencil /></Link>
        </header>

        <section className="adventure-hero">
          <div className="adventure-hero-shade" />
          <div className="adventure-hero-copy">
            <p>{trip.destination} · {dateLabel}</p>
            <h1>{trip.title}</h1>
            <div className="adventure-description">{trip.summary}</div>
            <div className="adventure-stats">
              <span><CalendarDays /><small>Journey date</small><strong>{dateLabel}</strong></span>
              <span><Map /><small>Destination</small><strong>{trip.destination}</strong></span>
              <span><Mountain /><small>Status</small><strong>{trip.status}</strong></span>
              <span><Users /><small>Travellers</small><strong>{trip.travellers}</strong></span>
            </div>
          </div>
          <div className="adventure-progress-card">
            <small>Planning progress</small><strong>{progress}%</strong>
            <i><b style={{ width: `${progress}%` }} /></i>
            <p>{progress < 100 ? "Keep building your adventure." : "Your journey is ready."}</p>
          </div>
        </section>

        <section className="adventure-workspace">
          <aside className="attention-card">
            <h2>What needs attention</h2>
            {focusItems.map((item, index) => <Link href={`/trips/${trip.slug}/journal`} key={item}><span>{index + 1}</span><div><strong>{item}</strong><small>Planning task</small></div><ArrowRight /></Link>)}
            <Link className="attention-more" href={`/trips/${trip.slug}/journal`}>View all tasks</Link>
          </aside>

          <div className="adventure-modules">
            {modules.map(({ href, icon: Icon, title, text, image }, index) => {
              const started = completed.includes(href);
              const value = started ? Math.min(95, 45 + index * 10) : 15;
              return <Link className="adventure-module" href={`/trips/${trip.slug}/${href}`} key={href}>
                <div className="adventure-module-image" style={{ backgroundImage: `linear-gradient(180deg, transparent 38%, rgba(8,12,14,.95)), url(${image})` }} />
                <div className="adventure-module-copy"><h3><Icon /> {title}</h3><p>{text}</p><i><b style={{ width: `${value}%` }} /></i><small>{started ? `${value}%` : "Not started"}</small></div>
              </Link>;
            })}
          </div>
        </section>

        <section className="adventure-memories">
          <header><h2>Journey inspiration</h2><Link href={`/trips/${trip.slug}/journal`}>Open journal <ArrowRight /></Link></header>
          <div>{memories.map((memory) => <Link href={`/trips/${trip.slug}/journal`} className="memory-card" key={memory.title} style={{ backgroundImage: `linear-gradient(180deg, transparent 35%, rgba(5,8,10,.92)), url(${memory.image})` }}><small>{memory.label}</small><strong>{memory.title}</strong></Link>)}</div>
        </section>
      </div>
    </main>
  );
}