"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, CheckCircle2, Circle, ListChecks, Plus, RotateCcw, Trash2 } from "lucide-react";
import "./packing.css";

type PackingItem = {
  id: string;
  label: string;
  category: string;
  packed: boolean;
};

const STORAGE_KEY = "two-wheels-one-way:packing:greece-2026";

const defaultItems: PackingItem[] = [
  { id: "documents-passport", label: "Passports and driving licences", category: "Documents", packed: false },
  { id: "documents-bookings", label: "Flight, hotel and rental confirmations", category: "Documents", packed: false },
  { id: "documents-insurance", label: "Travel and vehicle insurance details", category: "Documents", packed: false },
  { id: "riding-helmets", label: "Helmets and communication headsets", category: "Riding gear", packed: false },
  { id: "riding-jackets", label: "Protective jackets, trousers, gloves and boots", category: "Riding gear", packed: false },
  { id: "riding-rain", label: "Rain layers and waterproof over-gloves", category: "Riding gear", packed: false },
  { id: "tech-phones", label: "Phones, chargers and power bank", category: "Technology", packed: false },
  { id: "tech-navigation", label: "Navigation cables and offline maps", category: "Technology", packed: false },
  { id: "health-medicine", label: "Medication and compact first-aid kit", category: "Health", packed: false },
  { id: "health-sun", label: "Sunscreen, hydration salts and insect repellent", category: "Health", packed: false },
  { id: "clothing-layers", label: "Light layers for mountain and coastal weather", category: "Clothing", packed: false },
  { id: "clothing-swim", label: "Swimwear and quick-dry towels", category: "Clothing", packed: false },
];

function makeId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return `packing-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function isPackingItem(value: unknown): value is PackingItem {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<PackingItem>;
  return typeof item.id === "string" && typeof item.label === "string" && typeof item.category === "string" && typeof item.packed === "boolean";
}

export default function PackingPage() {
  const [items, setItems] = useState<PackingItem[]>(defaultItems);
  const [label, setLabel] = useState("");
  const [category, setCategory] = useState("Other");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if (Array.isArray(saved)) {
        const validItems = saved.filter(isPackingItem);
        if (validItems.length) setItems(validItems);
      }
    } catch {}
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); } catch {}
  }, [items, loaded]);

  const categories = useMemo(() => Array.from(new Set(items.map((item) => item.category))), [items]);
  const packedCount = items.filter((item) => item.packed).length;
  const progress = items.length ? Math.round((packedCount / items.length) * 100) : 0;

  function addItem(event: React.FormEvent) {
    event.preventDefault();
    const cleanLabel = label.trim();
    const cleanCategory = category.trim() || "Other";
    if (!cleanLabel) return;
    setItems((current) => [...current, { id: makeId(), label: cleanLabel, category: cleanCategory, packed: false }]);
    setLabel("");
  }

  function toggleItem(id: string) {
    setItems((current) => current.map((item) => item.id === id ? { ...item, packed: !item.packed } : item));
  }

  function resetList() {
    setItems(defaultItems.map((item) => ({ ...item, packed: false })));
  }

  return (
    <main className="archive-page workspace-page packing-page">
      <header className="archive-page-header">
        <Link href="/"><ArrowLeft size={17} /> Back home</Link>
        <div className="archive-header-links"><Link href="/map">Journey map</Link><Link href="/roadbooks">Roadbooks</Link></div>
      </header>

      <section className="archive-page-hero compact-archive-hero">
        <p className="eyebrow dark">PACKING & PREPARATION</p>
        <h1>Ready before<br />the road begins.</h1>
        <p>A practical shared checklist for documents, riding equipment, clothing and everything needed before departure.</p>
      </section>

      <section className="packing-overview">
        <div className="packing-progress-copy">
          <p className="eyebrow dark">GREECE 2026</p>
          <h2>{packedCount} of {items.length} packed</h2>
          <p>{progress === 100 ? "Everything is ready for departure." : `${items.length - packedCount} items still need attention.`}</p>
        </div>
        <div className="packing-progress" aria-label={`${progress}% packed`}>
          <div className="packing-progress-ring" style={{ "--progress": `${progress * 3.6}deg` } as React.CSSProperties}><strong>{progress}%</strong></div>
          <button type="button" onClick={resetList}><RotateCcw size={16} /> Reset checklist</button>
        </div>
      </section>

      <section className="packing-workspace">
        <form className="packing-add-form" onSubmit={addItem}>
          <div className="workspace-heading"><Plus size={23} /><div><p className="eyebrow dark">ADD SOMETHING</p><h2>New checklist item</h2></div></div>
          <label>Item<input value={label} onChange={(event) => setLabel(event.target.value)} placeholder="e.g. Spare visor and cleaning cloth" /></label>
          <label>Category<input value={category} onChange={(event) => setCategory(event.target.value)} list="packing-categories" /></label>
          <datalist id="packing-categories">{categories.map((name) => <option value={name} key={name} />)}</datalist>
          <button className="primary-button" type="submit" disabled={!label.trim()}><Plus size={17} /> Add item</button>
          <small>Changes are saved automatically in this browser.</small>
        </form>

        <div className="packing-lists">
          <div className="workspace-heading"><ListChecks size={23} /><div><p className="eyebrow dark">DEPARTURE CHECKLIST</p><h2>What remains</h2></div></div>
          {categories.map((categoryName) => {
            const categoryItems = items.filter((item) => item.category === categoryName);
            const complete = categoryItems.every((item) => item.packed);
            return (
              <section className={complete ? "packing-category complete" : "packing-category"} key={categoryName}>
                <header><h3>{categoryName}</h3><span>{categoryItems.filter((item) => item.packed).length}/{categoryItems.length}</span></header>
                {categoryItems.map((item) => (
                  <div className={item.packed ? "packing-item packed" : "packing-item"} key={item.id}>
                    <button type="button" className="packing-toggle" onClick={() => toggleItem(item.id)} aria-label={item.packed ? `Mark ${item.label} unpacked` : `Mark ${item.label} packed`}>
                      {item.packed ? <CheckCircle2 size={21} /> : <Circle size={21} />}<span>{item.label}</span>
                    </button>
                    <button type="button" className="packing-delete" onClick={() => setItems((current) => current.filter((entry) => entry.id !== item.id))} aria-label={`Delete ${item.label}`}><Trash2 size={16} /></button>
                  </div>
                ))}
              </section>
            );
          })}
          {items.length === 0 && <div className="empty-workspace"><p>The checklist is empty.</p><button type="button" onClick={resetList}>Restore starter checklist</button></div>}
        </div>
      </section>
    </main>
  );
}
