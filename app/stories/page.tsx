import Link from "next/link";
import { ArrowLeft, Camera, NotebookPen } from "lucide-react";

export default function StoriesPage() {
  return (
    <main className="archive-page">
      <header className="archive-page-header">
        <Link href="/"><ArrowLeft size={17} /> Back home</Link>
      </header>
      <section className="archive-page-hero">
        <p className="eyebrow dark">STORIES & PHOTOGRAPHS</p>
        <h1>The journal<br />behind the road.</h1>
        <p>This is where planning notes will become finished travel stories, photographs and memories.</p>
      </section>
      <section className="archive-page-content story-grid">
        <article className="story-placeholder">
          <Camera size={28} />
          <p className="eyebrow dark">PHOTO JOURNAL</p>
          <h2>Greece 2026</h2>
          <p>Photographs can be added before, during and after the journey.</p>
          <span>Waiting for the first photographs</span>
        </article>
        <article className="story-placeholder">
          <NotebookPen size={28} />
          <p className="eyebrow dark">TRAVEL STORIES</p>
          <h2>Notes from the road</h2>
          <p>Daily notes, favourite places and final reflections will live here.</p>
          <span>Ready for the first entry</span>
        </article>
      </section>
    </main>
  );
}
