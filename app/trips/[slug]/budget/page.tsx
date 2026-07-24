"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { ArrowLeft, CircleDollarSign, Plus, Receipt, Trash2, WalletCards } from "lucide-react";
import "../../../packing/packing.css";

type Expense = {
  id: string;
  title: string;
  category: string;
  planned: number;
  actual: number;
};

const categories = ["Transport", "Accommodation", "Food", "Activities", "Fuel", "Other"];

function makeId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return `expense-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function isExpense(value: unknown): value is Expense {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<Expense>;
  return typeof item.id === "string" && typeof item.title === "string" && typeof item.category === "string" && typeof item.planned === "number" && typeof item.actual === "number";
}

export default function TripBudgetPage() {
  const { slug } = useParams<{ slug: string }>();
  const storageKey = `two-wheels-one-way:trip:${slug}:budget`;
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(categories[0]);
  const [planned, setPlanned] = useState("");
  const [actual, setActual] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved: unknown = JSON.parse(localStorage.getItem(storageKey) || "[]");
      if (Array.isArray(saved)) setExpenses(saved.filter(isExpense));
    } catch {}
    setLoaded(true);
  }, [storageKey]);

  useEffect(() => {
    if (!loaded) return;
    try { localStorage.setItem(storageKey, JSON.stringify(expenses)); } catch {}
  }, [expenses, loaded, storageKey]);

  const totals = useMemo(() => expenses.reduce((sum, item) => ({ planned: sum.planned + item.planned, actual: sum.actual + item.actual }), { planned: 0, actual: 0 }), [expenses]);
  const remaining = totals.planned - totals.actual;

  function addExpense(event: FormEvent) {
    event.preventDefault();
    if (!title.trim()) return;
    setExpenses((current) => [...current, {
      id: makeId(),
      title: title.trim(),
      category,
      planned: Number(planned) || 0,
      actual: Number(actual) || 0,
    }]);
    setTitle("");
    setPlanned("");
    setActual("");
  }

  return (
    <main className="archive-page workspace-page">
      <header className="archive-page-header">
        <Link href={`/trips/${slug}`}><ArrowLeft size={17} /> Back to trip</Link>
        <div className="archive-header-links"><Link href={`/trips/${slug}/documents`}>Documents</Link><Link href="/trips">Change trip</Link></div>
      </header>

      <section className="archive-page-hero compact-archive-hero">
        <p className="eyebrow dark">BUDGET · {slug.replaceAll("-", " ").toUpperCase()}</p>
        <h1>Know the cost<br />before the road.</h1>
        <p>Track planned and actual costs without mixing this journey with any other trip.</p>
      </section>

      <section className="packing-overview">
        <div className="packing-progress-copy"><p className="eyebrow dark">TRIP TOTAL</p><h2>{totals.actual.toLocaleString()} DKK spent</h2><p>{remaining >= 0 ? `${remaining.toLocaleString()} DKK remains inside the current plan.` : `${Math.abs(remaining).toLocaleString()} DKK over the current plan.`}</p></div>
        <div className="packing-progress"><div className="packing-progress-ring" style={{ "--progress": `${totals.planned ? Math.min(360, totals.actual / totals.planned * 360) : 0}deg` } as React.CSSProperties}><strong>{totals.planned ? Math.round(totals.actual / totals.planned * 100) : 0}%</strong></div></div>
      </section>

      <section className="packing-workspace">
        <form className="packing-add-form" onSubmit={addExpense}>
          <div className="workspace-heading"><CircleDollarSign size={23} /><div><p className="eyebrow dark">ADD COST</p><h2>Budget item</h2></div></div>
          <label>Item<input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Hotel, ferry, fuel..." /></label>
          <label>Category<select value={category} onChange={(event) => setCategory(event.target.value)}>{categories.map((name) => <option value={name} key={name}>{name}</option>)}</select></label>
          <label>Planned DKK<input type="number" min="0" step="1" value={planned} onChange={(event) => setPlanned(event.target.value)} placeholder="0" /></label>
          <label>Actual DKK<input type="number" min="0" step="1" value={actual} onChange={(event) => setActual(event.target.value)} placeholder="0" /></label>
          <button className="primary-button" type="submit" disabled={!title.trim()}><Plus size={17} /> Add cost</button>
          <small>Saved automatically under this trip.</small>
        </form>

        <div className="packing-lists">
          <div className="workspace-heading"><WalletCards size={23} /><div><p className="eyebrow dark">COST BREAKDOWN</p><h2>{expenses.length} budget items</h2></div></div>
          {expenses.map((expense) => (
            <article className="packing-category" key={expense.id}>
              <header><h3>{expense.title}</h3><span>{expense.category}</span></header>
              <div className="budget-values"><span><small>Planned</small><strong>{expense.planned.toLocaleString()} DKK</strong></span><span><small>Actual</small><strong>{expense.actual.toLocaleString()} DKK</strong></span></div>
              <button type="button" className="packing-delete" onClick={() => setExpenses((current) => current.filter((item) => item.id !== expense.id))} aria-label={`Delete ${expense.title}`}><Trash2 size={16} /></button>
            </article>
          ))}
          {!expenses.length && <div className="empty-workspace"><Receipt size={24} /><p>No costs have been added to this journey yet.</p></div>}
        </div>
      </section>
    </main>
  );
}
