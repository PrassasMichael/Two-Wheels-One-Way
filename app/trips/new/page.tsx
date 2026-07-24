import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import TripEditor from "@/components/trip-editor";

export default function NewTripPage() {
  return (
    <main className="archive-page workspace-page">
      <header className="archive-page-header"><Link href="/trips"><ArrowLeft size={17} /> Journey archive</Link></header>
      <section className="archive-page-hero compact-archive-hero"><p className="eyebrow dark">NEW JOURNEY</p><h1>Create the next<br />chapter.</h1><p>Set the foundation once. Route, packing, budget, documents and journal will then receive their own isolated workspace.</p></section>
      <section className="trip-editor-shell"><TripEditor mode="create" /></section>
    </main>
  );
}
