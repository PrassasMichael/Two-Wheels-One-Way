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
    { href: "map", icon: Map, title: "Route", text: "Build the road and keep every meaningful stop in order." },
    { href: "packing", icon: PackageCheck, title: "Packing", text: "Prepare the luggage with a checklist made only for this journey." },
    { href: "journal", icon: BookOpen, title: "Journal", text: "Capture plans before departure and memories from the road." },
    { href: "budget", icon: Receipt, title: "Budget", text: "Keep planned and actual costs beside the journey they belong to." },
    { href: "documents", icon: FileText, title: "Documents", text: "Store bookings, insurance and practical travel references." },
  ];

  const focusItems = trip.planningNeeded?.slice(0, 5) ?? ["Confirm exact dates", "Finish the route", "Review the packing list"];

  return (
    <main className="v2-page">
      <header className="v2-page-header">
        <Link href="/trips"><ArrowLeft size={17} /> All journeys</Link>
        <Link href="/">Two Wheels, One Way</Link>
      </header>

      <section className="v2-dashboard-hero">
        <p className="v2-kicker">{trip.status} · {trip.month} {trip.year}</p>
        <h1>{trip.title}</h1>
        <p>{trip.summary}</p>
        <div className="v2-meta">
          <span className="v2-chip"><CalendarDays size={15} /> {trip.month} {trip.year}</span>
          <span className="v2-chip"><Users size={15} /> {trip.travellers} travellers</span>
        </div>
      </section>

      <section className="v2-dashboard-grid">
        <div className="v2-module-grid">
          {modules.map(({ href, icon: Icon, title, text }) => (
            <Link className="v2-module" href={`/trips/${trip.slug}/${href}`} key={href}>
              <span className="v2-feature-icon"><Icon size={21} /></span>
              <h3>{title}</h3>
              <p>{text}</p>
              <span>Open module <ArrowRight size={16} /></span>
            </Link>
          ))}
        </div>

        <aside className="v2-focus">
          <p className="v2-kicker">Planning focus</p>
          <h2>What needs attention next.</h2>
          <div className="v2-focus-list">
            {focusItems.map((item) => <div className="v2-focus-item" key={item}><i /> <span>{item}</span></div>)}
          </div>
          <Link className="v2-card-link" href={`/trips/${trip.slug}/journal`}><span>Add a planning note</span><ArrowRight size={17} /></Link>
        </aside>
      </section>
    </main>
  );
}
