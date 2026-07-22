import Link from "next/link";
import { ArrowLeft, MapPin, Route } from "lucide-react";

const places = ["Thessaloniki", "Ioannina", "Tzoumerka", "Zagorochoria", "Sivota", "Parga", "Lefkada", "Athens", "Crete"];

export default function MapPage() {
  return (
    <main className="archive-page">
      <header className="archive-page-header">
        <Link href="/"><ArrowLeft size={17} /> Back home</Link>
      </header>
      <section className="archive-page-hero">
        <p className="eyebrow dark">ONE CONNECTED MAP</p>
        <h1>Every road,<br />in one place.</h1>
        <p>The map archive will connect every destination, route and return journey across all trips.</p>
      </section>
      <section className="archive-page-content map-shell">
        <div className="route-diagram" aria-label="Greece 2026 route">
          {places.map((place, index) => (
            <div className="route-place" key={place}>
              <span><MapPin size={17} /></span>
              <strong>{place}</strong>
              {index < places.length - 1 && <i />}
            </div>
          ))}
        </div>
        <div className="map-note">
          <Route size={28} />
          <p className="eyebrow dark">CURRENT ROUTE</p>
          <h2>Greece 2026</h2>
          <p>This route is already connected to the active roadbook. A full interactive geographic map can be added next.</p>
          <Link className="text-link" href="/trips/epirus-athens-crete-2026">Open roadbook</Link>
        </div>
      </section>
    </main>
  );
}
