import Link from "next/link";
import { ArrowLeft, ArrowRight, CalendarDays, MapPin, Route } from "lucide-react";

export default function RoadbooksPage() {
  return (
    <main className="archive-page">
      <header className="archive-page-header">
        <Link href="/"><ArrowLeft size={17} /> Back home</Link>
      </header>
      <section className="archive-page-hero">
        <p className="eyebrow dark">JOURNEY ROADBOOKS</p>
        <h1>Every plan,<br />stage and route.</h1>
        <p>Open a journey to view its itinerary, daily plan, stops and travel notes.</p>
      </section>
      <section className="archive-page-content">
        <Link className="library-card" href="/trips/epirus-athens-crete-2026">
          <div className="library-card-number">01</div>
          <div>
            <p className="eyebrow dark">GREECE · SEPTEMBER 2026</p>
            <h2>Epirus, Athens and Crete</h2>
            <p>From Thessaloniki to Ioannina, Tzoumerka, Zagorochoria, the Ionian coast, Athens and Crete.</p>
            <div className="library-meta"><span><CalendarDays size={16} /> 5 September 2026</span><span><MapPin size={16} /> Greece</span><span><Route size={16} /> Planning</span></div>
          </div>
          <ArrowRight size={22} />
        </Link>
      </section>
    </main>
  );
}
