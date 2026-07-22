import Link from "next/link";
import { ArrowLeft, BedDouble, Car, CheckCircle2, Circle, Pencil, Plane, Route } from "lucide-react";
import itinerary from "@/content/epirus-2026.json";
import "./roadbook.css";

const icons = { flight: Plane, car: Car, drive: Route, stay: BedDouble };

export default function GreeceRoadbookPage() {
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
          <Link href="/trips/epirus-athens-crete-2026/edit" className="primary-button"><Pencil size={17} /> Edit this journey</Link>
        </div>
      </section>

      <section className="roadbook-layout">
        <aside>
          <p className="eyebrow dark">TRIP CHAPTERS</p>
          {itinerary.chapters.map((chapter) => (
            <a className="chapter-nav-item" href={`#chapter-${chapter.number}`} key={chapter.number}>
              <span>{chapter.number}</span>
              <div><strong>{chapter.title}</strong><small>{chapter.region}</small></div>
              {chapter.status === "confirmed" ? <CheckCircle2 size={17} /> : <Circle size={17} />}
            </a>
          ))}
        </aside>

        <div className="roadbook-main">
          {itinerary.chapters.map((chapter) => (
            <section className="roadbook-chapter" id={`chapter-${chapter.number}`} key={chapter.number}>
              <div className="roadbook-heading">
                <p className="eyebrow dark">CHAPTER {chapter.number}</p>
                <h2>{chapter.title}</h2>
                <p>{chapter.region}</p>
              </div>

              {chapter.days.length === 0 ? (
                <article className="roadbook-day-card empty-day-card"><h3>Details coming next.</h3><p>This chapter is part of the journey and ready for plans, bookings and notes.</p></article>
              ) : chapter.days.map((day, dayIndex) => (
                <article className="roadbook-day-card" key={`${day.date}-${dayIndex}`}>
                  <div className="roadbook-date">
                    <span>{String(dayIndex + 1).padStart(2, "0")}</span>
                    <div><strong>{day.date}</strong><small>Journey day</small></div>
                  </div>
                  <h3>{day.title}</h3>
                  <p className="roadbook-summary">{day.summary}</p>
                  {day.stops.length > 0 && (
                    <div className="roadbook-stops">
                      {day.stops.map((stop) => {
                        const Icon = icons[stop.type as keyof typeof icons] ?? Circle;
                        return <div className="roadbook-stop" key={`${stop.title}-${stop.time}`}><span className="stop-icon"><Icon size={18} /></span><div><small>{stop.time}</small><h4>{stop.title}</h4><p>{stop.detail}</p></div></div>;
                      })}
                    </div>
                  )}
                </article>
              ))}
            </section>
          ))}

          <section className="pending-panel">
            <p className="eyebrow dark">PRIVATE WORKSPACE</p>
            <h3>The roadbook can now be changed without editing code.</h3>
            <p>Open Edit mode to change dates, titles and summaries, add days, remove days and export a permanent itinerary file.</p>
            <Link href="/trips/epirus-athens-crete-2026/edit" className="text-link">Open edit mode <Pencil size={17} /></Link>
          </section>
        </div>
      </section>
    </main>
  );
}
