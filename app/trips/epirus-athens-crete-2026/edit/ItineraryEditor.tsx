"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, Download, GripVertical, Plus, Trash2 } from "lucide-react";
import initialItinerary from "@/content/epirus-2026.json";

export const STORAGE_KEY = "two-wheels-one-way:epirus-2026";

type Stop = { type: string; time: string; title: string; detail: string };
type Day = { date: string; title: string; summary: string; stops: Stop[] };
type Chapter = { number: string; title: string; region: string; status: string; days: Day[] };
type Itinerary = typeof initialItinerary;
type Selection = { chapterIndex: number; dayIndex: number };

export default function ItineraryEditor() {
  const [data, setData] = useState<Itinerary>(initialItinerary);
  const [selection, setSelection] = useState<Selection>({ chapterIndex: 0, dayIndex: 0 });
  const [hydrated, setHydrated] = useState(false);
  const [savedAt, setSavedAt] = useState<string>("");

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try { setData(JSON.parse(stored)); } catch { /* use repository data */ }
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const timer = window.setTimeout(() => {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      window.dispatchEvent(new Event("trip-itinerary-updated"));
      setSavedAt(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    }, 350);
    return () => window.clearTimeout(timer);
  }, [data, hydrated]);

  const selectedDay = data.chapters[selection.chapterIndex]?.days[selection.dayIndex];
  const dayCount = useMemo(() => data.chapters.reduce((sum, chapter) => sum + chapter.days.length, 0), [data]);

  function updateChapter(index: number, patch: Partial<Chapter>) {
    setData((current) => ({ ...current, chapters: current.chapters.map((chapter, i) => i === index ? { ...chapter, ...patch } : chapter) }));
  }

  function updateDay(patch: Partial<Day>) {
    setData((current) => ({
      ...current,
      chapters: current.chapters.map((chapter, ci) => ci !== selection.chapterIndex ? chapter : {
        ...chapter,
        days: chapter.days.map((day, di) => di === selection.dayIndex ? { ...day, ...patch } : day),
      }),
    }));
  }

  function updateStop(stopIndex: number, patch: Partial<Stop>) {
    if (!selectedDay) return;
    updateDay({ stops: selectedDay.stops.map((stop, index) => index === stopIndex ? { ...stop, ...patch } : stop) });
  }

  function addDay(chapterIndex: number) {
    setData((current) => {
      const next = current.chapters.map((chapter, index) => index === chapterIndex ? {
        ...chapter,
        days: [...chapter.days, { date: "Date pending", title: "New day", summary: "Add the plan for this day.", stops: [] }],
      } : chapter);
      setSelection({ chapterIndex, dayIndex: next[chapterIndex].days.length - 1 });
      return { ...current, chapters: next };
    });
  }

  function removeDay() {
    const chapter = data.chapters[selection.chapterIndex];
    if (!chapter || !selectedDay) return;
    setData((current) => ({ ...current, chapters: current.chapters.map((item, index) => index === selection.chapterIndex ? { ...item, days: item.days.filter((_, dayIndex) => dayIndex !== selection.dayIndex) } : item) }));
    setSelection({ chapterIndex: selection.chapterIndex, dayIndex: Math.max(0, selection.dayIndex - 1) });
  }

  function moveDay(fromChapter: number, fromDay: number, toChapter: number, toDay: number) {
    if (fromChapter !== toChapter || fromDay === toDay) return;
    setData((current) => {
      const chapters = current.chapters.map((chapter) => ({ ...chapter, days: [...chapter.days] }));
      const [moved] = chapters[fromChapter].days.splice(fromDay, 1);
      chapters[toChapter].days.splice(toDay, 0, moved);
      return { ...current, chapters };
    });
    setSelection({ chapterIndex: toChapter, dayIndex: toDay });
  }

  function addStop() {
    if (!selectedDay) return;
    updateDay({ stops: [...selectedDay.stops, { type: "visit", time: "Time pending", title: "New stop", detail: "Add details" }] });
  }

  function removeStop(stopIndex: number) {
    if (!selectedDay) return;
    updateDay({ stops: selectedDay.stops.filter((_, index) => index !== stopIndex) });
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
    <main className="planner-page">
      <header className="planner-header">
        <Link href="/trips/epirus-athens-crete-2026"><ArrowLeft size={17} /> View journey</Link>
        <div className="planner-actions">
          <span className="autosave-state"><Check size={15} /> {savedAt ? `Saved ${savedAt}` : "Autosave on"}</span>
          <button type="button" onClick={download}><Download size={17} /> Export</button>
        </div>
      </header>

      <div className="planner-layout">
        <aside className="planner-sidebar">
          <div className="sidebar-title"><p>Greece 2026</p><span>{dayCount} days</span></div>
          {data.chapters.map((chapter, chapterIndex) => (
            <section className="sidebar-chapter" key={`chapter-nav-${chapterIndex}`}>
              <div className="sidebar-chapter-heading"><span>{chapter.number}</span><strong>{chapter.title}</strong></div>
              {chapter.days.map((day, dayIndex) => (
                <button
                  type="button"
                  draggable
                  onDragStart={(event) => event.dataTransfer.setData("text/plain", `${chapterIndex}:${dayIndex}`)}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => {
                    event.preventDefault();
                    const [fromChapter, fromDay] = event.dataTransfer.getData("text/plain").split(":").map(Number);
                    moveDay(fromChapter, fromDay, chapterIndex, dayIndex);
                  }}
                  className={selection.chapterIndex === chapterIndex && selection.dayIndex === dayIndex ? "day-nav active" : "day-nav"}
                  onClick={() => setSelection({ chapterIndex, dayIndex })}
                  key={`day-nav-${chapterIndex}-${dayIndex}`}
                >
                  <GripVertical size={15} /><span><small>{day.date}</small><strong>{day.title}</strong></span>
                </button>
              ))}
              <button type="button" className="sidebar-add" onClick={() => addDay(chapterIndex)}><Plus size={15} /> Add day</button>
            </section>
          ))}
        </aside>

        <section className="planner-workspace">
          <div className="trip-settings">
            <label>Journey headline<input value={data.headline} onChange={(event) => setData((current) => ({ ...current, headline: event.target.value }))} /></label>
            <div className="field-grid">
              <label>Dates<input value={data.dates} onChange={(event) => setData((current) => ({ ...current, dates: event.target.value }))} /></label>
              <label>Travellers<input value={data.travellers} onChange={(event) => setData((current) => ({ ...current, travellers: event.target.value }))} /></label>
            </div>
          </div>

          {selectedDay ? (
            <article className="day-editor">
              <div className="day-editor-top">
                <div>
                  <p className="eyebrow dark">DAY {String(selection.dayIndex + 1).padStart(2, "0")}</p>
                  <h1>{selectedDay.title || "Untitled day"}</h1>
                </div>
                <button type="button" className="danger-button" onClick={removeDay}><Trash2 size={17} /> Delete day</button>
              </div>

              <div className="field-grid">
                <label>Date<input value={selectedDay.date} onChange={(event) => updateDay({ date: event.target.value })} /></label>
                <label>Day title<input value={selectedDay.title} onChange={(event) => updateDay({ title: event.target.value })} /></label>
              </div>
              <label>Summary<textarea rows={4} value={selectedDay.summary} onChange={(event) => updateDay({ summary: event.target.value })} /></label>

              <section className="stops-editor">
                <div className="section-row"><div><p className="eyebrow dark">DAY PLAN</p><h2>Stops and details</h2></div><button type="button" onClick={addStop}><Plus size={16} /> Add stop</button></div>
                {selectedDay.stops.length === 0 && <p className="empty-message">No stops yet. Add a hotel, drive, restaurant, activity or note.</p>}
                {selectedDay.stops.map((stop, stopIndex) => (
                  <div className="stop-editor" key={`stop-${selection.chapterIndex}-${selection.dayIndex}-${stopIndex}`}>
                    <div className="field-grid stop-grid">
                      <label>Type<input value={stop.type} onChange={(event) => updateStop(stopIndex, { type: event.target.value })} /></label>
                      <label>Time<input value={stop.time} onChange={(event) => updateStop(stopIndex, { time: event.target.value })} /></label>
                    </div>
                    <label>Title<input value={stop.title} onChange={(event) => updateStop(stopIndex, { title: event.target.value })} /></label>
                    <label>Details<textarea rows={2} value={stop.detail} onChange={(event) => updateStop(stopIndex, { detail: event.target.value })} /></label>
                    <button type="button" className="remove-stop" onClick={() => removeStop(stopIndex)}><Trash2 size={15} /> Remove stop</button>
                  </div>
                ))}
              </section>
            </article>
          ) : <div className="empty-workspace">Choose or add a day from the sidebar.</div>}

          <section className="chapter-settings">
            <p className="eyebrow dark">CURRENT CHAPTER</p>
            <div className="field-grid">
              <label>Chapter title<input value={data.chapters[selection.chapterIndex]?.title ?? ""} onChange={(event) => updateChapter(selection.chapterIndex, { title: event.target.value })} /></label>
              <label>Region<input value={data.chapters[selection.chapterIndex]?.region ?? ""} onChange={(event) => updateChapter(selection.chapterIndex, { region: event.target.value })} /></label>
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}
