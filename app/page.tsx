import Link from "next/link";
import {
  ArrowRight,
  Bike,
  CalendarDays,
  Car,
  MapPin,
  Mountain,
  Plane,
  Users,
  Waves,
} from "lucide-react";
import tripsData from "@/content/trips.json";
import itinerary from "@/content/epirus-2026.json";
import type { Trip } from "@/lib/types";

const trip = (tripsData as Trip[])[0];
const firstDay = itinerary.chapters[0].days[0];

const chapters = [
  { number: "01", title: "Epirus", note: "One week on the road", icon: Mountain },
  { number: "02", title: "Athens", note: "The city chapter", icon: MapPin },
  { number: "03", title: "Crete", note: "Island finale", icon: Waves },
];

export default function HomePage() {
  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Two Wheels, One Way home">
          <span className="brand-mark"><Bike size={19} /></span>
          <span>Two Wheels, One Way</span>
        </a>
        <nav aria-label="Primary navigation">
          <a href="#journey">Journey</a>
          <a href="#day-one">Day one</a>
          <a href="#chapters">Chapters</a>
        </nav>
      </header>

      <section className="hero greece-hero" id="top">
        <div className="hero-noise" />
        <div className="sun-disc" aria-hidden="true" />
        <div className="hero-content">
          <p className="eyebrow">SEPTEMBER 2026 · GREECE</p>
          <h1>Four friends.<br /><em>One long way south.</em></h1>
          <p className="hero-copy">
            Denmark to Thessaloniki. Across the mountains to Ioannina. A week through Epirus, then Athens, Crete and home.
          </p>
          <a className="primary-button" href="#journey">
            Enter the journey <ArrowRight size={18} />
          </a>
        </div>
        <div className="hero-route" aria-label="Journey route">
          <span>Copenhagen</span><i />
          <span>Thessaloniki</span><i />
          <span>Ioannina</span><i />
          <span>Athens</span><i />
          <span>Crete</span>
        </div>
      </section>

      <section className="journey-overview" id="journey">
        <div className="section-kicker">
          <p className="eyebrow dark">THE 2026 JOURNEY</p>
          <span className="status">{trip.status}</span>
        </div>
        <div className="journey-title-grid">
          <h2>{trip.title}</h2>
          <p>{trip.summary}</p>
        </div>
        <div className="facts-grid">
          <article><CalendarDays /><span>Date</span><strong>5 September 2026</strong></article>
          <article><Users /><span>Travellers</span><strong>Two couples · four people</strong></article>
          <article><Plane /><span>Arrival</span><strong>Thessaloniki Airport</strong></article>
          <article><Car /><span>Road trip</span><strong>Rental car through Epirus</strong></article>
        </div>
      </section>

      <section className="day-one" id="day-one">
        <div className="day-one-poster">
          <span className="poster-index">DAY 01</span>
          <div>
            <p>5 SEPTEMBER 2026</p>
            <h2>{firstDay.title}</h2>
            <span>Denmark → Thessaloniki → Ioannina</span>
          </div>
        </div>

        <div className="day-one-content">
          <p className="eyebrow dark">THE FIRST CHAPTER</p>
          <h3>{firstDay.summary}</h3>
          <div className="timeline">
            {firstDay.stops.map((stop, index) => (
              <article key={stop.title}>
                <div className="timeline-marker"><span>{String(index + 1).padStart(2, "0")}</span></div>
                <div>
                  <small>{stop.time}</small>
                  <h4>{stop.title}</h4>
                  <p>{stop.detail}</p>
                </div>
              </article>
            ))}
          </div>
          <Link className="text-link" href="/trips/epirus-athens-crete-2026">
            Open the full roadbook <ArrowRight size={17} />
          </Link>
        </div>
      </section>

      <section className="chapter-section" id="chapters">
        <div className="section-heading">
          <p className="eyebrow dark">THREE LANDSCAPES · ONE STORY</p>
          <h2>The chapters ahead.</h2>
        </div>
        <div className="chapter-grid">
          {chapters.map(({ number, title, note, icon: Icon }) => (
            <article key={title}>
              <div className="chapter-top"><span>{number}</span><Icon size={24} /></div>
              <h3>{title}</h3>
              <p>{note}</p>
              <span className="chapter-state">Planning</span>
            </article>
          ))}
        </div>
      </section>

      <section className="quote">
        <p>“The trip starts long before the wheels begin to move.”</p>
        <span>GREECE · SEPTEMBER 2026</span>
      </section>

      <footer>
        <div className="brand"><span className="brand-mark"><Bike size={19} /></span><span>Two Wheels, One Way</span></div>
        <p>Our private travel archive · Chapter one in progress</p>
      </footer>
    </main>
  );
}
