"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Download, Plus, Save, Trash2 } from "lucide-react";
import initialItinerary from "@/content/epirus-2026.json";

type Stop = { type: string; time: string; title: string; detail: string };
type Day = { date: string; title: string; summary: string; stops: Stop[] };
type Chapter = { number: string; title: string; region: string; status: string; days: Day[] };
type Itinerary = typeof initialItinerary;

const STORAGE_KEY = "two-wheels-one-way:epirus-2026";

export default function ItineraryEditor() {
  const [data, setData] = useState<Itinerary>(initialItinerary);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try { setData(JSON.parse(stored)); } catch { /* keep repository version */ }
    }
  }, []);

  function updateChapter(index: number, patch: Partial<Chapter>) {
    setData((current) => ({
      ...current,
      chapters: current.chapters.map((chapter, i) =>
        i === index ? { ...chapter, ...patch } : chapter
      ),
    }));
  }

  function updateDay(chapterIndex: number, dayIndex: number, patch: Partial<Day>) {
    setData((current) => ({
      ...current,
      chapters: current.chapters.map((chapter, ci) => ci !== chapterIndex ? chapter : {
        ...chapter,
        days: chapter.days.map((day, di) => di === dayIndex ? { ...day, ...patch } : day),
      }),
    }));
  }

  function addDay(chapterIndex: number) {
    setData((current) => ({
      ...current,
      chapters: current.chapters.map((chapter, index) =>
        index === chapterIndex
          ? {
              ...chapter,
              days: [
                ...chapter.days,
                {
                  date: "Date pending",
                  title: "New day",
                  summary: "Add the plan for this day.",
                  stops: [],
                },
              ],
            }
          : chapter
      ),
    }));
  }

  function removeDay(chapterIndex: number, dayIndex: number) {
    setData((current) => ({
      ...current,
      chapters: current.chapters.map((chapter, index) =>
        index === chapterIndex
          ? { ...chapter, days: chapter.days.filter((_, i) => i !== dayIndex) }
          : chapter
      ),
    }));
  }

  function save() {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1800);
  }

  function download() {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "epirus-2026.json";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="editor-page">
      <header className="editor-header">
        <Link href="/trips/epirus-athens-crete-2026"><ArrowLeft size={17} /> Back to journey</Link>
        <div>
          <button type="button" onClick={download} className="editor-secondary"><Download size={17} /> Export JSON</button>
          <button type="button" onClick={save} className="editor-save"><Save size={17} /> {saved ? "Saved" : "Save changes"}</button>
        </div>
      </header>

      <section className="editor-intro">
        <p className="eyebrow dark">PRIVATE EDIT MODE</p>
        <h1>Edit Greece 2026.</h1>
        <p>Changes are saved privately in this browser. Export the JSON when you want the repository version updated permanently.</p>
      </section>

      <section className="editor-shell">
        <label>Journey headline<input value={data.headline} onChange={(e) => setData((current) => ({ ...current, headline: e.target.value }))} /></label>
        <div className="editor-two-column">
          <label>Dates<input value={data.dates} onChange={(e) => setData((current) => ({ ...current, dates: e.target.value }))} /></label>
          <label>Travellers<input value={data.travellers} onChange={(e) => setData((current) => ({ ...current, travellers: e.target.value }))} /></label>
        </div>

        {data.chapters.map((chapter, chapterIndex) => (
          <section className="editor-chapter" key={`chapter-${chapterIndex}`}>
            <div className="editor-two-column">
              <label>Chapter title<input value={chapter.title} onChange={(e) => updateChapter(chapterIndex, { title: e.target.value })} /></label>
              <label>Region<input value={chapter.region} onChange={(e) => updateChapter(chapterIndex, { region: e.target.value })} /></label>
            </div>

            {chapter.days.map((day, dayIndex) => (
              <article className="editor-day" key={`day-${chapterIndex}-${dayIndex}`}>
                <button type="button" className="delete-day" onClick={() => removeDay(chapterIndex, dayIndex)} aria-label="Delete day"><Trash2 size={17} /></button>
                <div className="editor-two-column">
                  <label>Date<input value={day.date} onChange={(e) => updateDay(chapterIndex, dayIndex, { date: e.target.value })} /></label>
                  <label>Day title<input value={day.title} onChange={(e) => updateDay(chapterIndex, dayIndex, { title: e.target.value })} /></label>
                </div>
                <label>Summary<textarea rows={3} value={day.summary} onChange={(e) => updateDay(chapterIndex, dayIndex, { summary: e.target.value })} /></label>
              </article>
            ))}

            <button type="button" className="add-day" onClick={() => addDay(chapterIndex)}><Plus size={17} /> Add day</button>
          </section>
        ))}
      </section>
    </main>
  );
}
