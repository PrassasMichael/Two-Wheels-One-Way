"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { ArrowLeft, ExternalLink, FileCheck2, FileText, Plus, Trash2 } from "lucide-react";
import "../../../packing/packing.css";

type TripDocument = {
  id: string;
  title: string;
  type: string;
  reference: string;
  url: string;
  notes: string;
};

const documentTypes = ["Booking", "Transport", "Accommodation", "Insurance", "Identity", "Other"];

function makeId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return `document-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function normalizeTripDocument(value: unknown): TripDocument | null {
  if (!value || typeof value !== "object") return null;
  const item = value as Partial<TripDocument>;
  if (typeof item.title !== "string" || !item.title.trim()) return null;
  return {
    id: typeof item.id === "string" && item.id ? item.id : makeId(),
    title: item.title.trim(),
    type: typeof item.type === "string" && item.type ? item.type : "Other",
    reference: typeof item.reference === "string" ? item.reference : "",
    url: typeof item.url === "string" ? item.url : "",
    notes: typeof item.notes === "string" ? item.notes : "Added from AI Trip Advisor",
  };
}

export default function TripDocumentsPage() {
  const { slug } = useParams<{ slug: string }>();
  const storageKey = `two-wheels-one-way:trip:${slug}:documents`;
  const [documents, setDocuments] = useState<TripDocument[]>([]);
  const [title, setTitle] = useState("");
  const [type, setType] = useState(documentTypes[0]);
  const [reference, setReference] = useState("");
  const [url, setUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved: unknown = JSON.parse(localStorage.getItem(storageKey) || "[]");
      if (Array.isArray(saved)) {
        const normalized = saved.map(normalizeTripDocument).filter((item): item is TripDocument => Boolean(item));
        setDocuments(normalized);
        localStorage.setItem(storageKey, JSON.stringify(normalized));
      }
    } catch {}
    setLoaded(true);
  }, [storageKey]);

  useEffect(() => {
    if (!loaded) return;
    try { localStorage.setItem(storageKey, JSON.stringify(documents)); } catch {}
  }, [documents, loaded, storageKey]);

  function addDocument(event: FormEvent) {
    event.preventDefault();
    if (!title.trim()) return;
    setDocuments((current) => [...current, {
      id: makeId(),
      title: title.trim(),
      type,
      reference: reference.trim(),
      url: url.trim(),
      notes: notes.trim(),
    }]);
    setTitle("");
    setReference("");
    setUrl("");
    setNotes("");
  }

  return (
    <main className="archive-page workspace-page">
      <header className="archive-page-header">
        <Link href={`/trips/${slug}`}><ArrowLeft size={17} /> Back to trip</Link>
        <div className="archive-header-links"><Link href={`/trips/${slug}/budget`}>Budget</Link><Link href="/trips">Change trip</Link></div>
      </header>

      <section className="archive-page-hero compact-archive-hero">
        <p className="eyebrow dark">DOCUMENTS · {slug.replaceAll("-", " ").toUpperCase()}</p>
        <h1>Every reference<br />in one place.</h1>
        <p>Keep booking numbers, confirmation links and essential notes attached to the correct journey.</p>
      </section>

      <section className="packing-overview">
        <div className="packing-progress-copy"><p className="eyebrow dark">TRAVEL WALLET</p><h2>{documents.length} saved references</h2><p>Only lightweight metadata and links are stored in this browser. Sensitive identity documents should not be uploaded here.</p></div>
        <FileCheck2 size={54} />
      </section>

      <section className="packing-workspace">
        <form className="packing-add-form" onSubmit={addDocument}>
          <div className="workspace-heading"><FileText size={23} /><div><p className="eyebrow dark">ADD REFERENCE</p><h2>New document</h2></div></div>
          <label>Title<input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Ferry confirmation" /></label>
          <label>Type<select value={type} onChange={(event) => setType(event.target.value)}>{documentTypes.map((name) => <option value={name} key={name}>{name}</option>)}</select></label>
          <label>Reference number<input value={reference} onChange={(event) => setReference(event.target.value)} placeholder="Optional booking code" /></label>
          <label>Confirmation URL<input type="url" value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://..." /></label>
          <label>Notes<textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={4} placeholder="Check-in instructions, address or reminder" /></label>
          <button className="primary-button" type="submit" disabled={!title.trim()}><Plus size={17} /> Save reference</button>
          <small>Do not store passport numbers, card details or private identity scans.</small>
        </form>

        <div className="packing-lists">
          <div className="workspace-heading"><FileCheck2 size={23} /><div><p className="eyebrow dark">SAVED REFERENCES</p><h2>Your travel wallet</h2></div></div>
          {documents.map((document) => (
            <article className="packing-category" key={document.id}>
              <header><h3>{document.title}</h3><span>{document.type}</span></header>
              <div className="document-body">
                {document.reference && <p><strong>Reference:</strong> {document.reference}</p>}
                {document.notes && <p>{document.notes}</p>}
                {document.url && <a className="text-link" href={document.url} target="_blank" rel="noreferrer">Open confirmation <ExternalLink size={15} /></a>}
              </div>
              <button type="button" className="packing-delete" onClick={() => setDocuments((current) => current.filter((item) => item.id !== document.id))} aria-label={`Delete ${document.title}`}><Trash2 size={16} /></button>
            </article>
          ))}
          {!documents.length && <div className="empty-workspace"><FileText size={24} /><p>No booking or document references have been added yet.</p></div>}
        </div>
      </section>
    </main>
  );
}
