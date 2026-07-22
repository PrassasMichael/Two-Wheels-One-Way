"use client";

import Link from "next/link";
import { ChangeEvent, useEffect, useState } from "react";
import { ArrowLeft, Camera, NotebookPen, Plus, Trash2, Upload } from "lucide-react";

type Note = { id: string; title: string; date: string; body: string };
type Photo = { id: string; src: string; caption: string; date: string };

const NOTES_KEY = "two-wheels-one-way:stories:notes";
const PHOTOS_KEY = "two-wheels-one-way:stories:photos";

export default function StoriesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);

  useEffect(() => {
    try { setNotes(JSON.parse(localStorage.getItem(NOTES_KEY) || "[]")); } catch {}
    try { setPhotos(JSON.parse(localStorage.getItem(PHOTOS_KEY) || "[]")); } catch {}
  }, []);

  useEffect(() => { localStorage.setItem(NOTES_KEY, JSON.stringify(notes)); }, [notes]);
  useEffect(() => { localStorage.setItem(PHOTOS_KEY, JSON.stringify(photos)); }, [photos]);

  function addNote() {
    setNotes((current) => [{ id: crypto.randomUUID(), title: "New story", date: new Date().toISOString().slice(0, 10), body: "" }, ...current]);
  }

  function updateNote(id: string, patch: Partial<Note>) {
    setNotes((current) => current.map((note) => note.id === id ? { ...note, ...patch } : note));
  }

  function uploadPhotos(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files || []);
    files.forEach((file) => {
      if (!file.type.startsWith("image/")) return;
      const reader = new FileReader();
      reader.onload = () => setPhotos((current) => [{ id: crypto.randomUUID(), src: String(reader.result), caption: file.name, date: new Date().toISOString().slice(0, 10) }, ...current]);
      reader.readAsDataURL(file);
    });
    event.target.value = "";
  }

  return (
    <main className="archive-page workspace-page">
      <header className="archive-page-header">
        <Link href="/"><ArrowLeft size={17} /> Back home</Link>
        <Link href="/trips/epirus-athens-crete-2026">Open Greece roadbook</Link>
      </header>

      <section className="archive-page-hero compact-archive-hero">
        <p className="eyebrow dark">STORIES & PHOTOGRAPHS</p>
        <h1>The journal<br />behind the road.</h1>
        <p>Write notes, keep daily memories and build the photo archive for every journey.</p>
      </section>

      <section className="journal-toolbar">
        <button type="button" className="primary-button" onClick={addNote}><Plus size={17} /> New story</button>
        <label className="upload-button"><Upload size={17} /> Upload photographs<input type="file" accept="image/*" multiple onChange={uploadPhotos} /></label>
      </section>

      <section className="journal-workspace">
        <div className="journal-column">
          <div className="workspace-heading"><NotebookPen size={23} /><div><p className="eyebrow dark">TRAVEL NOTES</p><h2>Stories</h2></div></div>
          {notes.length === 0 && <div className="empty-workspace"><p>No notes yet.</p><button type="button" onClick={addNote}>Write the first story</button></div>}
          <div className="notes-list">
            {notes.map((note) => (
              <article className="note-editor" key={note.id}>
                <button type="button" className="workspace-delete" onClick={() => setNotes((current) => current.filter((item) => item.id !== note.id))} aria-label="Delete story"><Trash2 size={16} /></button>
                <input className="note-title" value={note.title} onChange={(e) => updateNote(note.id, { title: e.target.value })} aria-label="Story title" />
                <input className="note-date" type="date" value={note.date} onChange={(e) => updateNote(note.id, { date: e.target.value })} aria-label="Story date" />
                <textarea value={note.body} onChange={(e) => updateNote(note.id, { body: e.target.value })} placeholder="Write what happened, places you loved, food, people, thoughts and details you want to remember..." rows={8} />
                <small>Saved automatically in this browser</small>
              </article>
            ))}
          </div>
        </div>

        <div className="journal-column">
          <div className="workspace-heading"><Camera size={23} /><div><p className="eyebrow dark">PHOTO JOURNAL</p><h2>Photographs</h2></div></div>
          {photos.length === 0 && <div className="empty-workspace"><p>No photographs yet.</p><label className="inline-upload">Choose photographs<input type="file" accept="image/*" multiple onChange={uploadPhotos} /></label></div>}
          <div className="photo-library">
            {photos.map((photo) => (
              <figure className="photo-card" key={photo.id}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photo.src} alt={photo.caption || "Travel photograph"} />
                <button type="button" className="photo-delete" onClick={() => setPhotos((current) => current.filter((item) => item.id !== photo.id))} aria-label="Delete photograph"><Trash2 size={16} /></button>
                <figcaption>
                  <input value={photo.caption} onChange={(e) => setPhotos((current) => current.map((item) => item.id === photo.id ? { ...item, caption: e.target.value } : item))} placeholder="Caption" />
                  <input type="date" value={photo.date} onChange={(e) => setPhotos((current) => current.map((item) => item.id === photo.id ? { ...item, date: e.target.value } : item))} />
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
