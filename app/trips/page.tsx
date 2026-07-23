import Link from "next/link";
import { ArrowLeft, ArrowRight, CalendarDays, MapPin, Plus } from "lucide-react";
import { getTrips } from "@/lib/trips";

export default function TripsPage() {
  const trips = getTrips();

  return (
    <main className="archive-page">
      <header className="archive-page-header">
        <Link href="/"><ArrowLeft size={17} /> Back home</Link>
      </header>

      <section className="archive-page-hero compact-archive-hero">
        <p className="eyebrow dark">JOURNEY ARCHIVE</p>
        <h1>Every trip gets<br />its own world.</h1>
        <p>Plans, routes, packing, budgets and memories remain separate while living inside one shared travel archive.</p>
      </section>

      <section className="journey-overview">
        <div className="section-kicker">
          <p className="eyebrow dark">ALL JOURNEYS</p>
          <span className="status">{trips.length} total</span>
        </div>
        <div className="chapter-grid archive-feature-grid">
          {trips.map((trip) => (
            <Link className="archive-feature-card" href={`/trips/${trip.slug}`} key={trip.id}>
              <div className="chapter-top"><span>{trip.year}</span><ArrowRight size={22} /></div>
              <p className="eyebrow dark">{trip.status}</p>
              <h3>{trip.title}</h3>
              <p>{trip.summary}</p>
              <div className="trip-meta-line">
                <span><CalendarDays size={16} /> {trip.year}</span>
                <span><MapPin size={16} /> {trip.destination}</span>
              </div>
            </Link>
          ))}
          <article className="archive-feature-card">
            <div className="chapter-top"><span>NEW</span><Plus size={22} /></div>
            <h3>Create another journey</h3>
            <p>The universal structure is ready. A trip-creation form will be the next management layer.</p>
          </article>
        </div>
      </section>
    </main>
  );
}
