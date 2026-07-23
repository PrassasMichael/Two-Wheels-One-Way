import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, BookOpen, CalendarDays, FileText, Map, PackageCheck, Receipt, Users } from "lucide-react";
import { getTrip, getTrips } from "@/lib/trips";

export function generateStaticParams() {
  return getTrips().map((trip) => ({ slug: trip.slug }));
}

export default async function TripDashboard({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const trip = getTrip(slug);
  if (!trip) notFound();

  const modules = [
    { href: "map", icon: Map, title: "Route & saved places", text: "Build this journey's route without affecting any other trip." },
    { href: "packing", icon: PackageCheck, title: "Packing", text: "A checklist saved only for this journey." },
    { href: "journal", icon: BookOpen, title: "Journal", text: "Planning notes and memories belonging to this trip." },
    { href: "budget", icon: Receipt, title: "Budget", text: "Planned and actual costs for this journey." },
    { href: "documents", icon: FileText, title: "Documents", text: "Bookings, confirmations and travel references." },
  ];

  return (
    <main className="archive-page">
      <header className="archive-page-header">
        <Link href="/trips"><ArrowLeft size={17} /> All journeys</Link>
        <div className="archive-header-links"><Link href="/">Home</Link></div>
      </header>

      <section className="archive-page-hero compact-archive-hero">
        <p className="eyebrow dark">{trip.status.toUpperCase()} · {trip.year}</p>
        <h1>{trip.title}</h1>
        <p>{trip.summary}</p>
        <div className="trip-meta-line">
          <span><CalendarDays size={17} /> {trip.year}</span>
          <span><Users size={17} /> {trip.travellers} travellers</span>
        </div>
      </section>

      <section className="chapter-section">
        <div className="section-heading">
          <p className="eyebrow dark">TRIP WORKSPACE</p>
          <h2>Everything here belongs only to this journey.</h2>
        </div>
        <div className="chapter-grid archive-feature-grid">
          {modules.map(({ href, icon: Icon, title, text }, index) => (
            <Link className="archive-feature-card" href={`/trips/${trip.slug}/${href}`} key={href}>
              <div className="chapter-top"><span>0{index + 1}</span><Icon size={24} /></div>
              <h3>{title}</h3>
              <p>{text}</p>
              <span className="feature-open">Open <ArrowRight size={16} /></span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
