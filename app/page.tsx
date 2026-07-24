import Link from "next/link";
import { ArrowRight, Bike, BookOpen, CalendarDays, FileText, Map, MapPin, PackageCheck, Receipt, Route } from "lucide-react";
import tripsData from "@/content/trips.json";
import type { Trip } from "@/lib/types";

const trips = tripsData as Trip[];
const featuredTrip = trips[0];

const features = [
  { icon: Route, title: "Shape the road", text: "Build the route, save meaningful stops and keep each journey independent." },
  { icon: PackageCheck, title: "Leave prepared", text: "A trip-specific packing system that remembers what is ready and what is missing." },
  { icon: Receipt, title: "Know the cost", text: "Keep the budget, bookings and practical details beside the route they belong to." },
  { icon: BookOpen, title: "Keep the story", text: "Turn early notes into a journal of the places, people and moments you bring home." },
];

export default function HomePage() {
  return (
    <main className="v2-shell">
      <header className="v2-topbar">
        <Link className="v2-brand" href="/" aria-label="Two Wheels, One Way home">
          <span className="v2-brand-mark"><Bike size={19} /></span>
          <span>Two Wheels, One Way</span>
        </Link>
        <nav className="v2-nav" aria-label="Primary navigation">
          <a href="#journey">Current journey</a>
          <a href="#system">The system</a>
          <Link href="/trips">All journeys</Link>
        </nav>
      </header>

      <section className="v2-hero">
        <div className="v2-hero-inner">
          <div>
            <p className="v2-kicker">Private travel archive</p>
            <h1>Every road becomes<br /><em>part of our story.</em></h1>
            <p className="v2-hero-copy">One place for the route before departure, the practical details along the way and the memories that remain when the journey is over.</p>
            <div className="v2-actions">
              <Link className="v2-primary" href={`/trips/${featuredTrip.slug}`}>Continue planning <ArrowRight size={18} /></Link>
              <Link className="v2-secondary" href="/trips">Explore journeys</Link>
            </div>
          </div>

          <aside className="v2-hero-card">
            <small>Current journey</small>
            <strong>{featuredTrip.title}</strong>
            <span>{featuredTrip.month} {featuredTrip.year} · {featuredTrip.status}</span>
            <div className="v2-progress"><span /></div>
            <small>Planning foundation · 64%</small>
            <Link className="v2-card-link" href={`/trips/${featuredTrip.slug}`}><span>Open journey</span><ArrowRight size={17} /></Link>
          </aside>
        </div>
      </section>

      <section className="v2-trip-stage" id="journey">
        <Link className="v2-trip-card" href={`/trips/${featuredTrip.slug}`}>
          <div className="v2-trip-art">
            <span className="v2-trip-year">{featuredTrip.year}</span>
            <span className="v2-trip-route"><MapPin size={17} /> {featuredTrip.origin} <ArrowRight size={15} /> {featuredTrip.destination}</span>
          </div>
          <div className="v2-trip-copy">
            <p className="v2-kicker">Latest journey</p>
            <h2>{featuredTrip.title}</h2>
            <p>{featuredTrip.summary}</p>
            <div className="v2-meta">
              <span className="v2-chip"><CalendarDays size={15} /> {featuredTrip.month} {featuredTrip.year}</span>
              <span className="v2-chip"><Bike size={15} /> {featuredTrip.transport}</span>
            </div>
            <span className="v2-primary">Enter the journey <ArrowRight size={17} /></span>
          </div>
        </Link>
      </section>

      <section className="v2-section" id="system">
        <div className="v2-section-head">
          <div><p className="v2-kicker">The travel system</p><h2>Useful before the trip. Meaningful after it.</h2></div>
          <p>The same workspace moves with a journey from the first rough idea to the final photograph, without mixing one trip with another.</p>
        </div>
        <div className="v2-feature-grid">
          {features.map(({ icon: Icon, title, text }) => (
            <Link className="v2-feature" href={`/trips/${featuredTrip.slug}`} key={title}>
              <span className="v2-feature-icon"><Icon size={21} /></span>
              <h3>{title}</h3>
              <p>{text}</p>
              <span className="v2-feature-footer"><span>Open workspace</span><ArrowRight size={16} /></span>
            </Link>
          ))}
        </div>
      </section>

      <section className="v2-section" style={{ paddingTop: 0 }}>
        <div className="v2-feature" style={{ minHeight: 240, background: "var(--v2-night)", color: "white" }}>
          <span className="v2-feature-icon" style={{ background: "var(--v2-orange)" }}><FileText size={21} /></span>
          <h3 style={{ marginTop: 34 }}>The roadbook is never finished.</h3>
          <p style={{ color: "rgba(255,255,255,.62)", maxWidth: 720 }}>Plans change, roads surprise us and memories arrive later. The archive is designed to keep growing with every journey.</p>
        </div>
      </section>
    </main>
  );
}
