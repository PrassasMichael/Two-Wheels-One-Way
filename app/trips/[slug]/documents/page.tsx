import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";

export default async function TripDocumentsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return (
    <main className="archive-page workspace-page">
      <header className="archive-page-header"><Link href={`/trips/${slug}`}><ArrowLeft size={17} /> Back to trip</Link><div className="archive-header-links"><Link href="/trips">Change trip</Link></div></header>
      <section className="archive-page-hero compact-archive-hero"><p className="eyebrow dark">DOCUMENTS · {slug.replaceAll("-", " ").toUpperCase()}</p><h1>Keep every booking<br />with its journey.</h1><p>This route is isolated by trip and ready for booking references, confirmations and document metadata.</p></section>
      <section className="pending-panel"><FileText size={28} /><p className="eyebrow dark">FOUNDATION READY</p><h3>No documents from another trip can appear here.</h3><p>Private uploads should be introduced only after repository privacy and authentication are enabled.</p></section>
    </main>
  );
}
