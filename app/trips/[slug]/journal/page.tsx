"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { ArrowLeft, BookOpen, Plus, Trash2 } from "lucide-react";

type Entry = { id: string; title: string; date: string; body: string };

export default function TripJournalPage() {
  const { slug } = useParams<{ slug: string }>();
  const storageKey = `two-wheels-one-way:trip:${slug}:journal`;
  const [entries, setEntries] = useState<Entry[]>([]);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [body, setBody] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || "[]");
      if (Array.isArray(saved)) setEntries(saved);
    } catch {}
    setLoaded(true);
  }, [storageKey]);

  useEffect(() => {
    if (loaded) localStorage.setItem(storageKey, JSON.stringify(entries));
  }, [entries, loaded, storageKey]);

  function addEntry(event: FormEvent) {
    event.preventDefault();
    if (!title.trim() || !body.trim()) return;
    setEntries((current) => [{ id: crypto.randomUUID(), title: title.trim(), date, body: body.trim() }, ...current]);
    setTitle(""); setDate(""); setBody("");
  }

  return (
    <main className="archive-page workspace-page">
      <header className="archive-page-header"><Link href={`/trips/${slug}`}><ArrowLeft size={17} /> Back to trip</Link><div className="archive-header-links"><Link href={`/trips/${slug}/map`}>Route</Link><Link href="/trips">Change trip</Link></div></header>
      <section className="archive-page-hero compact-archive-hero"><p className="eyebrow dark">JOURNAL · {slug.replaceAll("-", " ").toUpperCase()}</p><h1>Keep the story<br />with the journey.</h1><p>Notes written here belong only to this trip, from early planning through the memories brought home.</p></section>
      <section className="packing-workspace">
        <form className="packing-add-form" onSubmit={addEntry}>
          <div className="workspace-heading"><BookOpen size={23} /><div><p className="eyebrow dark">NEW ENTRY</p><h2>Add to the journal</h2></div></div>
          <label>Title<input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="A day, idea or memory" /></label>
          <label>Date<input type="date" value={date} onChange={(event) => setDate(event.target.value)} /></label>
          <label>Entry<textarea value={body} onChange={(event) => setBody(event.target.value)} rows={7} placeholder="Write what happened, what is planned, or what should not be forgotten." /></label>
          <button className="primary-button" type="submit" disabled={!title.trim() || !body.trim()}><Plus size={17} /> Save entry</button>
        </form>
        <div className="packing-lists">
          <div className="workspace-heading"><BookOpen size={23} /><div><p className="eyebrow dark">TRIP STORY</p><h2>{entries.length} entries</h2></div></div>
          {entries.map((entry) => <article className="packing-category" key={entry.id}><header><h3>{entry.title}</h3><span>{entry.date || "Undated"}</span></header><p style={{ whiteSpace: "pre-wrap" }}>{entry.body}</p><button type="button" className="packing-delete" onClick={() => setEntries((current) => current.filter((item) => item.id !== entry.id))}><Trash2 size={16} /> Remove</button></article>)}
          {!entries.length && <div className="empty-workspace"><p>This journey does not have any journal entries yet.</p></div>}
        </div>
      </section>
    </main>
  );
}
