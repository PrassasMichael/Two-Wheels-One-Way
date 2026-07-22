"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, CalendarDays, Camera, MapPin, NotebookPen, Route, Search } from "lucide-react";
import initialItinerary from "@/content/epirus-2026.json";

const STORAGE_KEY = "two-wheels-one-way:epirus-2026";

export default function RoadbooksPage() {
  const [itinerary, setItinerary] = useState(initialItinerary);
  const [query, setQuery] = useState("");

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setItinerary(JSON.parse(stored));
    } catch {}
  }, []);

  const days = useMemo(() => itinerary.chapters.flatMap((chapter) => chapter.days.map((day) => ({ ...day, chapter: chapter.title }))), [itinerary]);
  const stops = useMemo(() => days.reduce((total, day) => total + day.stops.length, 0), [days]);
  const matches = !query.trim() || [itinerary.headline, itinerary.dates, ...days.flatMap((day) => [day.title, day.summary, day.date, day.chapter])].join(" ").toLowerCase().includes(query.toLowerCase());

  return (
    <main className="archive-page workspace-page">
      <header className="archive-page-header">
        <Link href="/"><ArrowLeft size={17} /> Back home</Link>
        <div className="archive-header-links"><Link href="/stories">Stories</Link><Link href="/map">Map</Link></div>
      </header>

      <section className="archive-page-hero compact-archive-hero">
        <p className="eyebrow dark">JOURNEY ROADBOOKS</p>
        <h1>Every plan,<br />stage and route.</h1>
        <p>Your working travel library. Open a roadbook, continue planning or jump directly to notes, photographs and maps.</p>
      </section>

      <section className="roadbook-dashboard">
        <div className="roadbook-stat"><strong>{itinerary.chapters.length}</strong><span>Chapters</span></div>
        <div className="roadbook-stat"><strong>{days.length}</strong><span>Planned days</span></div>
        <div className="roadbook-stat"><strong>{stops}</strong><span>Stops & activities</span></div>
        <label className="roadbook-search"><Search size={18} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search roadbooks" /></label>
      </section>

      <section className="archive-page-content">
        {matches ? (
          <article className="library-card functional-library-card">
            <div className="library-card-number">01</div>
            <div className="library-card-main">
              <p className="eyebrow dark">GREECE · SEPTEMBER 2026</p>
              <h2>Epirus, Athens and Crete</h2>
              <p>{itinerary.headline}</p>
              <div className="library-meta"><span><CalendarDays size={16} /> {itinerary.dates}</span><span><MapPin size={16} /> Greece</span><span><Route size={16} /> {days.length} days planned</span></div>
              <div className="library-actions">
                <Link className="primary-button" href="/trips/epirus-athens-crete-2026">Open roadbook <ArrowRight size={17} /></Link>
                <Link href="/trips/epirus-athens-crete-2026/edit">Edit plan</Link>
                <Link href="/stories"><NotebookPen size={16} /> Notes & photos</Link>
                <Link href="/map"><Camera size={16} /> Route map</Link>
              </div>
            </div>
          </article>
        ) : <div className="empty-workspace"><p>No roadbooks match “{query}”.</p></div>}

        <section className="roadbook-preview-list">
          <div className="workspace-heading"><Route size={23} /><div><p className="eyebrow dark">ACTIVE ITINERARY</p><h2>Greece 2026 timeline</h2></div></div>
          {days.map((day, index) => (
            <Link href="/trips/epirus-athens-crete-2026" className="roadbook-preview-day" key={`${day.chapter}-${index}`}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <div><small>{day.date} · {day.chapter}</small><strong>{day.title}</strong><p>{day.summary}</p></div>
              <ArrowRight size={18} />
            </Link>
          ))}
        </section>
      </section>
    </main>
  );
}
