import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import TripEditor from "@/components/trip-editor";
import { getTrip } from "@/lib/trips";

export default async function EditTripPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const trip = getTrip(slug) || null;
  return (
    <main className="archive-page workspace-page">
      <header className="archive-page-header"><Link href={`/trips/${slug}`}><ArrowLeft size={17} /> Back to journey</Link></header>
      <section className="archive-page-hero compact-archive-hero"><p className="eyebrow dark">EDIT JOURNEY</p><h1>Keep the plan<br />accurate.</h1><p>Update the journey overview without affecting route notes, packing, expenses, documents or journal entries.</p></section>
      <section className="trip-editor-shell"><TripEditor mode="edit" slug={slug} initialTrip={trip} /></section>
    </main>
  );
}
