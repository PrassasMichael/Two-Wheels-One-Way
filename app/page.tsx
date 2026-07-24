import Link from "next/link";
import { ArrowRight, Bike, BookOpen, CalendarDays, ChevronDown, FileText, MapPin, Mountain, PackageCheck, Receipt, Route, ShieldCheck } from "lucide-react";
import tripsData from "@/content/trips.json";
import type { Trip } from "@/lib/types";

const trips = tripsData as Trip[];
const featuredTrip = trips[0];

const features = [
  { icon: Route, title: "Route", text: "Shape every road, stop and overnight before the engine starts.", href: "map", image: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=900&q=85" },
  { icon: PackageCheck, title: "Packing", text: "Keep riding gear, documents and essentials ready for departure.", href: "packing", image: "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=900&q=85" },
  { icon: Receipt, title: "Budget", text: "Know what the journey will cost before the kilometres begin.", href: "budget", image: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=900&q=85" },
  { icon: BookOpen, title: "Journal", text: "Turn the route into a permanent record of the adventure.", href: "journal", image: "https://images.unsplash.com/photo-1519682337058-a94d519337bc?auto=format&fit=crop&w=900&q=85" },
];

export default function HomePage() {
  return (
    <main className="landing-adventure">
      <header className="landing-nav">
        <Link className="landing-brand" href="/" aria-label="Two Wheels, One Way home">
          <Mountain />
          <span><strong>TWO WHEELS</strong><small>ONE WAY</small></span>
        </Link>
        <nav aria-label="Primary navigation">
          <a href="#journey">The journey</a>
          <a href="#tools">Planning tools</a>
          <Link href="/trips">All trips</Link>
        </nav>
        <Link className="landing-nav-action" href={`/trips/${featuredTrip.slug}`}>Open dashboard <ArrowRight /></Link>
      </header>

      <section className="landing-hero">
        <div className="landing-hero-overlay" />
        <div className="landing-hero-content">
          <p className="landing-eyebrow"><Bike /> Motorcycle travel, planned properly</p>
          <h1>The road begins<br />before departure.</h1>
          <p className="landing-lead">Plan the route, prepare the bike, control the budget and preserve every memory in one private adventure workspace.</p>
          <div className="landing-actions">
            <Link className="landing-primary" href={`/trips/${featuredTrip.slug}`}>Continue the journey <ArrowRight /></Link>
            <Link className="landing-secondary" href="/trips">Explore all trips</Link>
          </div>
          <div className="landing-proof">
            <span><ShieldCheck /> Private trip archive</span>
            <span><MapPin /> Route-first planning</span>
            <span><BookOpen /> Built for the memories</span>
          </div>
        </div>
        <aside className="landing-current-card">
          <div className="landing-current-top"><span>Current expedition</span><Bike /></div>
          <h2>{featuredTrip.title}</h2>
          <p>{featuredTrip.origin} → {featuredTrip.destination}</p>
          <div className="landing-current-meta">
            <span><CalendarDays /> {featuredTrip.month} {featuredTrip.year}</span>
            <span><Mountain /> {featuredTrip.status}</span>
          </div>
          <div className="landing-current-progress"><i><b /></i><span>Planning in progress</span><strong>64%</strong></div>
          <Link href={`/trips/${featuredTrip.slug}`}>Enter trip workspace <ArrowRight /></Link>
        </aside>
        <a className="landing-scroll" href="#journey"><ChevronDown /> Discover the system</a>
      </section>

      <section className="landing-trip" id="journey">
        <div className="landing-section-heading">
          <div><p className="landing-eyebrow">Featured journey</p><h2>One trip.<br />One complete world.</h2></div>
          <p>Every journey receives its own route, packing list, budget, documents and journal. Nothing gets mixed with the trip before it.</p>
        </div>
        <Link className="landing-trip-card" href={`/trips/${featuredTrip.slug}`}>
          <div className="landing-trip-image"><span>{featuredTrip.year}</span></div>
          <div className="landing-trip-copy">
            <span className="landing-trip-label">Next adventure</span>
            <h3>{featuredTrip.title}</h3>
            <p>{featuredTrip.summary}</p>
            <div><span><MapPin /> {featuredTrip.destination}</span><span><Bike /> {featuredTrip.transport}</span></div>
            <strong>Open the journey <ArrowRight /></strong>
          </div>
        </Link>
      </section>

      <section className="landing-tools" id="tools">
        <div className="landing-section-heading">
          <div><p className="landing-eyebrow">Adventure command centre</p><h2>Everything the road demands.</h2></div>
          <p>Practical enough before departure, simple enough while travelling and meaningful once the ride becomes a memory.</p>
        </div>
        <div className="landing-tool-grid">
          {features.map(({ icon: Icon, title, text, href, image }) => (
            <Link className="landing-tool" href={`/trips/${featuredTrip.slug}/${href}`} key={title}>
              <div className="landing-tool-image" style={{ backgroundImage: `linear-gradient(180deg,transparent 25%,rgba(6,9,12,.92)),url('${image}')` }} />
              <div className="landing-tool-copy"><span><Icon /></span><h3>{title}</h3><p>{text}</p><strong>Open tool <ArrowRight /></strong></div>
            </Link>
          ))}
        </div>
      </section>

      <section className="landing-final">
        <div>
          <FileText />
          <p className="landing-eyebrow">Two Wheels, One Way</p>
          <h2>Build the roadbook.<br />Then live the story.</h2>
          <p>The plans will change. The route will surprise you. The archive is made to hold both.</p>
          <Link className="landing-primary" href="/trips/new">Create a new journey <ArrowRight /></Link>
        </div>
      </section>
    </main>
  );
}
