"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, BedDouble, Car, CheckCircle2, Circle, Pencil, Plane, Route } from "lucide-react";
import initialItinerary from "@/content/epirus-2026.json";
import "./roadbook.css";

const STORAGE_KEY = "two-wheels-one-way:epirus-2026";
const icons = { flight: Plane, car: Car, drive: Route, stay: BedDouble };
type Itinerary = typeof initialItinerary;

export default function GreeceRoadbookPage() {
  const [itinerary, setItinerary] = useState<Itinerary>(initialItinerary);
  const [usingDraft, setUsingDraft] = useState(false);

  useEffect(() => {
    const loadDraft = () => {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        setItinerary(initialItinerary);
        setUsingDraft(false);
        return;
      }
      try {
        setItinerary(JSON.parse(stored));
        setUsingDraft(true);
      } catch {
        setItinerary(initialItinerary);
        setUsingDraft(false);
      }
    };

    loadDraft();
    window.addEventListener("storage", loadDraft);
    window.addEventListener("trip-itinerary-updated", loadDraft);
    window.addEventListener("focus", loadDraft);
    return () => {
      window.removeEventListener("storage", loadDraft);
      window.removeEventListener("trip-itinerary-updated", loadDraft);
      window.removeEventListener("focus", loadDraft);
    };
  }, []);

  return (
    <main className="roadbook-page">
      <section className="roadbook-hero">
        <div className="hero-noise" />
        <Link href="/" className="back-link"><ArrowLeft size={17} /> Back to all journeys</Link>
        <div className="roadbook-hero-content">
          <p className="eyebrow">GREECE · SEPTEMBER 2026</p>
          <h1>The roadbook.</h1>
          <p>{itinerary.headline}</p>
          <div className="roadbook-meta"><span>{itinerary.dates}</span><span>{itinerary.travellers}</span></div>
          <div className="roadbook-actions">
            <Link href="/trips/epirus-athens-crete-2026/edit" className="primary-button"><Pencil size={17} /> Edit this journey</Link>
            {usingDraft && <span className="draft-indicator">Showing your latest saved plan</span>}
          </div>
        </div>
      </section>

      <section className="roadbook-layout">
        <aside>
          <p className="eyebrow dark">TRIP CHAPTERS</p>
          {itinerary.chapters.map((chapter, chapterIndex) => (
            <a className="chapter-nav-item" href={`#chapter-${chapterIndex}`} key={`chapter-nav-${chapterIndex}`}>
              <span>{chapter.number}</span>
              <div><strong>{chapter.title}</strong><small>{chapter.region}</small></div>
              {chapter.status === "confirmed" ? <CheckCircle2 size={17} /> : <Circle size={17} />}
            </a>
          ))}
        </aside>

        <div className="roadbook-main">
          {itinerary.chapters.map((chapter, chapterIndex) => (
            <section className="roadbook-chapter" id={`chapter-${chapterIndex}`} key={`chapter-${chapterIndex}`}>
              <div className="roadbook-heading">
                <p className="eyebrow dark">CHAPTER {chapter.number}</p>
                <h2>{chapter.title}</h2>
                <p>{chapter.region}</p>
              </div>

              {chapter.days.length === 0 ? (
                <article className="roadbook-day-card empty-day-card"><h3>Details coming next.</h3><p>This chapter is ready for plans, bookings and notes.</p></article>
              ) : chapter.days.map((day, dayIndex) => (
                <article className="roadbook-day-card" key={`day-${chapterIndex}-${dayIndex}`}>
                  <div className="roadbook-date">
                    <span>{String(dayIndex + 1).padStart(2, "0")}</span>
                    <div><strong>{day.date}</strong><small>Journey day</small></div>
                  </div>
                  <h3>{day.title}</h3>
                  <p className="roadbook-summary">{day.summary}</p>
                  {day.stops.length > 0 && (
                    <div className="roadbook-stops">
                      {day.stops.map((stop, stopIndex) => {
                        const Icon = icons[stop.type as keyof typeof icons] ?? Circle;
                        return <div className="roadbook-stop" key={`stop-${chapterIndex}-${dayIndex}-${stopIndex}`}><span className="stop-icon"><Icon size={18} /></span><div><small>{stop.time}</small><h4>{stop.title}</h4><p>{stop.detail}</p></div></div>;
                      })}
                    </div>
                  )}
                </article>
              ))}
            </section>
          ))}

          <section className="pending-panel">
            <p className="eyebrow dark">PRIVATE WORKSPACE</p>
            <h3>Your roadbook and planner now use the same saved data.</h3>
            <p>Changes autosave in the editor and appear here when you return to the journey.</p>
            <Link href="/trips/epirus-athens-crete-2026/edit" className="text-link">Open edit mode <Pencil size={17} /></Link>
          </section>
        </div>
      </section>
    </main>
  );
}
