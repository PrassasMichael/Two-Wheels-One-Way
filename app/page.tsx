import Link from "next/link";
import { ArrowRight, Bike, CalendarDays, Camera, Map, MapPin, PackageCheck, Route } from "lucide-react";
import tripsData from "@/content/trips.json";
import type { Trip } from "@/lib/types";

const trips = tripsData as Trip[];
const featuredTrip = trips[0];

const archiveFeatures = [
  { icon: Route, title: "Journey roadbooks", text: "The plans, daily stages and routes behind every trip." },
  { icon: Camera, title: "Stories and photographs", text: "A journal that grows from planning notes into finished memories." },
  { icon: Map, title: "Trip-specific maps", text: "Each journey keeps its own roads, stops and saved places." },
  { icon: PackageCheck, title: "Packing and preparation", text: "Independent departure checklists for every journey." },
];

export default function HomePage() {
  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Two Wheels, One Way home"><span className="brand-mark"><Bike size={19} /></span><span>Two Wheels, One Way</span></a>
        <nav aria-label="Primary navigation"><a href="#journeys">Journeys</a><a href="#journal">Archive</a><a href="#story">Our story</a></nav>
      </header>

      <section className="hero archive-hero" id="top">
        <div className="hero-noise" />
        <div className="hero-content"><p className="eyebrow">A PRIVATE TRAVEL BLOG</p><h1>Every journey leaves<br /><em>a story behind.</em></h1><p className="hero-copy">Our plans before departure, our notes from the road and the memories we bring home — collected in one living archive.</p><Link className="primary-button" href="/trips">Explore the journeys <ArrowRight size={18} /></Link></div>
        <div className="hero-route" aria-label="Travel archive themes"><span>Plan</span><i /><span>Travel</span><i /><span>Remember</span></div>
      </section>

      <section className="journey-overview" id="journeys">
        <div className="section-kicker"><p className="eyebrow dark">LATEST JOURNEY</p><span className="status">{featuredTrip.status}</span></div>
        <div className="journey-title-grid"><h2>{featuredTrip.title}</h2><p>{featuredTrip.summary}</p></div>
        <Link className="archive-trip-card" href={`/trips/${featuredTrip.slug}`}>
          <div className="archive-trip-visual"><span>{featuredTrip.year}</span><strong>{featuredTrip.countries.at(-1)?.toUpperCase()}</strong></div>
          <div className="archive-trip-copy"><p className="eyebrow dark">{featuredTrip.tags.slice(0, 4).join(" · ").toUpperCase()}</p><h3>{featuredTrip.subtitle}</h3><div className="trip-meta-line"><span><CalendarDays size={17} /> {featuredTrip.month} {featuredTrip.year}</span><span><MapPin size={17} /> {featuredTrip.destination}</span></div><span className="text-link">Open journey <ArrowRight size={17} /></span></div>
        </Link>
      </section>

      <section className="chapter-section" id="journal">
        <div className="section-heading"><p className="eyebrow dark">THE ARCHIVE</p><h2>Built for every chapter, not only the first one.</h2></div>
        <div className="chapter-grid archive-feature-grid">
          {archiveFeatures.map(({ icon: Icon, title, text }, index) => <Link className="archive-feature-card" href="/trips" key={title}><div className="chapter-top"><span>0{index + 1}</span><Icon size={24} /></div><h3>{title}</h3><p>{text}</p><span className="feature-open">Choose a journey <ArrowRight size={16} /></span></Link>)}
        </div>
      </section>

      <section className="quote" id="story"><p>“We are not collecting destinations. We are collecting chapters.”</p><span>TWO WHEELS, ONE WAY</span></section>
      <footer><div className="brand"><span className="brand-mark"><Bike size={19} /></span><span>Two Wheels, One Way</span></div><p>Private travel blog · Plans, roads and memories</p></footer>
    </main>
  );
}
