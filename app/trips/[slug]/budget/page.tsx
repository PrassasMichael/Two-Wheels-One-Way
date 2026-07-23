import Link from "next/link";
import { ArrowLeft, Receipt } from "lucide-react";

export default async function TripBudgetPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return (
    <main className="archive-page workspace-page">
      <header className="archive-page-header"><Link href={`/trips/${slug}`}><ArrowLeft size={17} /> Back to trip</Link><div className="archive-header-links"><Link href="/trips">Change trip</Link></div></header>
      <section className="archive-page-hero compact-archive-hero"><p className="eyebrow dark">BUDGET · {slug.replaceAll("-", " ").toUpperCase()}</p><h1>One journey,<br />one clean budget.</h1><p>This workspace is now routed and isolated by trip. Expense tracking and settlements can be added without mixing journeys.</p></section>
      <section className="pending-panel"><Receipt size={28} /><p className="eyebrow dark">FOUNDATION READY</p><h3>Budget data will be stored under this trip only.</h3><p>The next implementation can add planned costs, actual expenses, currency conversion and traveller settlements.</p></section>
    </main>
  );
}
