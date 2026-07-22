import { ArrowUpRight, Bike, CalendarDays, Camera, Map, Route, WalletCards } from "lucide-react";
import tripsData from "@/content/trips.json";
import type { Trip } from "@/lib/types";

const trips = tripsData as Trip[];
const featuredTrip = trips[0];

const sections = [
  { icon: Route, label: "Roadbook", text: "Daily stages, towns, stops and scenic roads." },
  { icon: Map, label: "Places", text: "Hotels, restaurants, viewpoints and discoveries." },
  { icon: WalletCards, label: "Budget", text: "Planned and actual costs in one clear view." },
  { icon: Camera, label: "Journal", text: "Photos, notes and memories arranged by day." },
];

export default function HomePage() {
  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Two Wheels, One Way home">
          <span className="brand-mark"><Bike size={20} /></span>
          <span>Two Wheels, One Way</span>
        </a>
        <nav aria-label="Primary navigation">
          <a href="#journeys">Journeys</a>
          <a href="#archive">Archive</a>
          <a href="#about">Our story</a>
        </nav>
      </header>

      <section className="hero" id="top">
        <div className="hero-noise" />
        <div className="hero-content">
          <p className="eyebrow">PRIVATE TRAVEL DOCUMENTARY</p>
          <h1>Every road becomes<br /><em>part of our story.</em></h1>
          <p className="hero-copy">
            A living archive of the places we visit, the roads we follow and the moments we never want to lose.
          </p>
          <a className="primary-button" href="#journeys">
            Open the journey <ArrowUpRight size={18} />
          </a>
        </div>
        <div className="route-line" aria-hidden="true"><span /></div>
        <div className="hero-index">
          <span>01</span>
          <span>Roads</span>
          <span>Memories</span>
        </div>
      </section>

      <section className="intro" id="journeys">
        <div>
          <p className="eyebrow dark">THE CURRENT CHAPTER</p>
          <h2>{featuredTrip.title}</h2>
        </div>
        <p>{featuredTrip.summary}</p>
      </section>

      <section className="trip-card">
        <div className="trip-visual">
          <div className="compass-ring">N</div>
          <div className="trip-number">2026</div>
          <div className="road-streak road-streak-one" />
          <div className="road-streak road-streak-two" />
        </div>
        <div className="trip-details">
          <span className="status">{featuredTrip.status}</span>
          <h3>{featuredTrip.subtitle}</h3>
          <div className="trip-meta">
            <div><CalendarDays size={18} /><span>Dates coming soon</span></div>
            <div><Map size={18} /><span>{featuredTrip.origin}</span></div>
            <div><Bike size={18} /><span>{featuredTrip.travellers} travellers</span></div>
          </div>
          <div className="tag-row">
            {featuredTrip.tags.map((tag) => <span key={tag}>{tag}</span>)}
          </div>
          <button className="ghost-button" type="button">View trip workspace <ArrowUpRight size={17} /></button>
        </div>
      </section>

      <section className="system" id="archive">
        <div className="section-heading">
          <p className="eyebrow dark">BUILT FOR THE WHOLE JOURNEY</p>
          <h2>Plan it. Live it. Remember it.</h2>
        </div>
        <div className="feature-grid">
          {sections.map(({ icon: Icon, label, text }, index) => (
            <article key={label}>
              <span className="feature-number">0{index + 1}</span>
              <Icon size={24} />
              <h3>{label}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="quote" id="about">
        <p>“We are not collecting destinations. We are collecting chapters.”</p>
        <span>— Two Wheels, One Way</span>
      </section>

      <footer>
        <div className="brand"><span className="brand-mark"><Bike size={20} /></span><span>Two Wheels, One Way</span></div>
        <p>Private archive · Built for our journeys</p>
      </footer>
    </main>
  );
}
