import Link from "next/link";
import { ArrowLeft, BedDouble, Car, CheckCircle2, Circle, Plane, Route } from "lucide-react";
import itinerary from "@/content/epirus-2026.json";
import "./roadbook.css";

const icons = {
  flight: Plane,
  car: Car,
  drive: Route,
  stay: BedDouble,
};

export default function GreeceRoadbookPage() {
  const firstChapter = itinerary.chapters[0];
  const firstDay = firstChapter.days[0];

  return (
    <main className="roadbook-page">
      <section className="roadbook-hero">
        <div className="hero-noise" />
        <Link href="/" className="back-link"><ArrowLeft size={17} /> Back to the journey</Link>
        <div className="roadbook-hero-content">
          <p className="eyebrow">GREECE · SEPTEMBER 2026</p>
          <h1>The roadbook.</h1>
          <p>{itinerary.headline}</p>
          <div className="roadbook-meta">
            <span>{itinerary.dates}</span>
            <span>{itinerary.travellers}</span>
          </div>
        </div>
      </section>

      <section className="roadbook-layout">
        <aside>
          <p className="eyebrow dark">TRIP CHAPTERS</p>
          {itinerary.chapters.map((chapter) => (
            <div className="chapter-nav-item" key={chapter.number}>
              <span>{chapter.number}</span>
              <div><strong>{chapter.title}</strong><small>{chapter.region}</small></div>
              {chapter.status === "confirmed" ? <CheckCircle2 size={17} /> : <Circle size={17} />}
            </div>
          ))}
        </aside>

        <div className="roadbook-main">
          <div className="roadbook-heading">
            <p className="eyebrow dark">CHAPTER {firstChapter.number}</p>
            <h2>{firstChapter.title}</h2>
            <p>{firstChapter.region}</p>
          </div>

          <article className="roadbook-day-card">
            <div className="roadbook-date">
              <span>05</span>
              <div><strong>September</strong><small>2026 · Day one</small></div>
            </div>
            <h3>{firstDay.title}</h3>
            <p className="roadbook-summary">{firstDay.summary}</p>

            <div className="roadbook-stops">
              {firstDay.stops.map((stop) => {
                const Icon = icons[stop.type as keyof typeof icons] ?? Circle;
                return (
                  <div className="roadbook-stop" key={stop.title}>
                    <span className="stop-icon"><Icon size={18} /></span>
                    <div><small>{stop.time}</small><h4>{stop.title}</h4><p>{stop.detail}</p></div>
                  </div>
                );
              })}
            </div>
          </article>

          <section className="pending-panel">
            <p className="eyebrow dark">STILL TO ADD</p>
            <h3>Details waiting for the next planning session.</h3>
            <div className="pending-grid">
              <span>Flight time and number</span><span>Rental company</span><span>Ioannina Airbnb</span><span>First-night dinner</span>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
