import { NextResponse } from "next/server";

type ChangeModule = "route" | "packing" | "budget" | "documents" | "journal";
type ProposedChange = {
  module: ChangeModule;
  mode: "append" | "replace";
  label: string;
  items: Array<Record<string, string | number | boolean>>;
};

type Suggestion = {
  priority: "important" | "recommended" | "optional";
  category: "route" | "packing" | "budget" | "documents" | "timing" | "general";
  title: string;
  detail: string;
  action: string;
  change: ProposedChange | null;
};

type AdvisorPayload = { trip: Record<string, unknown>; modules: Record<string, unknown>; focus?: string };

function asArray(value: unknown): unknown[] { return Array.isArray(value) ? value : []; }

function localSuggestions(payload: AdvisorPayload): Suggestion[] {
  const trip = payload.trip;
  const route = asArray(payload.modules.route || payload.modules.map) as Array<{ name?: string; notes?: string }>;
  const packing = asArray(payload.modules.packing) as Array<{ packed?: boolean; label?: string }>;
  const budget = asArray(payload.modules.budget) as Array<{ planned?: number; actual?: number }>;
  const documents = asArray(payload.modules.documents);
  const journal = asArray(payload.modules.journal);
  const suggestions: Suggestion[] = [];

  if (route.length < 2) suggestions.push({ priority: "important", category: "route", title: "Build a usable route", detail: "The journey has fewer than two saved stops, so distance, overnight rhythm and daily riding load cannot be assessed yet.", action: "Add the departure point and final destination to the live route.", change: { module: "route", mode: "append", label: "Add route foundations", items: [{ name: String(trip.origin || "Departure point"), notes: "Journey starting point" }, { name: String(trip.destination || "Final destination"), notes: "Journey destination" }] } });
  if (route.length > 8) suggestions.push({ priority: "recommended", category: "route", title: "Add a lighter riding day", detail: `You have ${route.length} route stops. A recovery or flexible day can protect the trip from fatigue and weather delays.`, action: "Add a flexible rest day to the itinerary.", change: { module: "route", mode: "append", label: "Add flexible rest day", items: [{ name: "Flexible rest day", notes: "Recovery, maintenance or weather buffer. Place this at the most demanding part of the route." }] } });

  const unpacked = packing.filter((item) => !item.packed);
  if (!packing.length) suggestions.push({ priority: "important", category: "packing", title: "Start the motorcycle packing list", detail: "No packing data is saved for this trip yet.", action: "Import a practical starter checklist.", change: { module: "packing", mode: "append", label: "Import essential motorcycle gear", items: [{ label: "Waterproof riding layers", category: "Travel gear", packed: false }, { label: "Tyre repair kit and compact inflator", category: "Motorcycle", packed: false }, { label: "First-aid kit and medication", category: "Health", packed: false }, { label: "Chargers, cables and power bank", category: "Technology", packed: false }] } });
  else if (unpacked.length) suggestions.push({ priority: unpacked.length > 5 ? "important" : "recommended", category: "packing", title: `${unpacked.length} packing items remain`, detail: "The remaining items may become last-minute blockers, especially documents, riding gear and charging equipment.", action: "Open the packing checklist and complete critical items first.", change: null });

  const planned = budget.reduce((sum, item) => sum + (Number(item.planned) || 0), 0);
  const actual = budget.reduce((sum, item) => sum + (Number(item.actual) || 0), 0);
  if (!budget.length) suggestions.push({ priority: "recommended", category: "budget", title: "Create a basic trip budget", detail: "There are no planned costs, so fuel, accommodation, ferries, tolls and emergency margin are not visible.", action: "Import the essential budget categories and enter your estimates.", change: { module: "budget", mode: "append", label: "Import budget structure", items: [{ title: "Fuel", category: "Fuel", planned: 0, actual: 0 }, { title: "Accommodation", category: "Accommodation", planned: 0, actual: 0 }, { title: "Ferries and tolls", category: "Transport", planned: 0, actual: 0 }, { title: "Emergency reserve", category: "Other", planned: 0, actual: 0 }] } });
  else if (planned > 0 && actual > planned) suggestions.push({ priority: "important", category: "budget", title: "Budget is already over plan", detail: `Actual costs are ${Math.round(((actual - planned) / planned) * 100)}% above the current plan.`, action: "Review accommodation, transport and optional activity costs before adding more bookings.", change: null });

  if (!documents.length) suggestions.push({ priority: "important", category: "documents", title: "Add essential travel references", detail: "No booking or document references are stored for this journey.", action: "Open Documents and add insurance, accommodation, ferry and roadside-assistance references. Do not store passport or payment-card numbers.", change: null });
  if (!journal.length) suggestions.push({ priority: "optional", category: "general", title: "Write a trip intention note", detail: "A short note about what matters most helps future route and activity decisions stay aligned.", action: "Add a planning note to the journal.", change: { module: "journal", mode: "append", label: "Add trip intention prompt", items: [{ title: "Trip intention", body: "What pace, experiences and places matter most on this journey?", date: "" }] } });

  const destination = String(trip.destination || "your destination");
  const transport = String(trip.transport || "motorcycle");
  suggestions.push({ priority: "recommended", category: "timing", title: "Check conditions close to departure", detail: `Weather, road closures, ferry schedules and local requirements for ${destination} can change after the initial plan is created.`, action: `Recheck current conditions and ${transport} requirements one week before departure and again the evening before.`, change: null });
  return suggestions.slice(0, 8);
}

function extractOutputText(data: any): string {
  if (typeof data?.output_text === "string") return data.output_text;
  const parts = Array.isArray(data?.output) ? data.output.flatMap((item: any) => Array.isArray(item?.content) ? item.content : []) : [];
  return parts.map((part: any) => part?.text).filter((text: unknown) => typeof text === "string").join("\n");
}

export async function POST(request: Request) {
  let payload: AdvisorPayload;
  try { payload = await request.json(); } catch { return NextResponse.json({ error: "Invalid request body." }, { status: 400 }); }
  const fallback = localSuggestions(payload);
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return NextResponse.json({ suggestions: fallback, source: "local" });

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-5",
        instructions: `You are a cautious motorcycle trip-planning advisor. Analyse only the supplied trip. Suggestions may include an optional structured change that the traveller can explicitly review and apply. Never overwrite data silently. For route improvements, provide a complete replacement route only when the existing stops and trip details support it; preserve useful existing stops and explain additions in notes. For packing and budget, prefer append changes. Every change item must contain all schema fields. Fill unused string fields with an empty string, unused numbers with 0 and packed with false. Set change to null when a concrete safe import is not possible. Do not invent precise legal, weather, road, price or schedule facts. Flag anything requiring a current external check.`,
        input: JSON.stringify({ ...payload, modules: { ...payload.modules, route: payload.modules.route || payload.modules.map } }),
        text: { format: { type: "json_schema", name: "trip_advice", strict: true, schema: {
          type: "object", additionalProperties: false, required: ["suggestions"], properties: { suggestions: {
            type: "array", maxItems: 8, items: { type: "object", additionalProperties: false,
              required: ["priority", "category", "title", "detail", "action", "change"], properties: {
                priority: { type: "string", enum: ["important", "recommended", "optional"] },
                category: { type: "string", enum: ["route", "packing", "budget", "documents", "timing", "general"] },
                title: { type: "string" }, detail: { type: "string" }, action: { type: "string" },
                change: { anyOf: [{ type: "null" }, { type: "object", additionalProperties: false, required: ["module", "mode", "label", "items"], properties: {
                  module: { type: "string", enum: ["route", "packing", "budget", "documents", "journal"] },
                  mode: { type: "string", enum: ["append", "replace"] }, label: { type: "string" },
                  items: { type: "array", maxItems: 20, items: { type: "object", additionalProperties: false,
                    required: ["name", "notes", "label", "category", "packed", "title", "planned", "actual", "body", "date", "type", "reference"],
                    properties: { name: { type: "string" }, notes: { type: "string" }, label: { type: "string" }, category: { type: "string" }, packed: { type: "boolean" }, title: { type: "string" }, planned: { type: "number" }, actual: { type: "number" }, body: { type: "string" }, date: { type: "string" }, type: { type: "string" }, reference: { type: "string" } }
                  } }
                } }] }
              }
            }
          } }
        } } }
      })
    });
    if (!response.ok) throw new Error(`OpenAI request failed: ${response.status}`);
    const data = await response.json();
    const parsed = JSON.parse(extractOutputText(data));
    return NextResponse.json({ suggestions: parsed.suggestions, source: "openai" });
  } catch (error) {
    console.error("Trip advisor fallback:", error);
    return NextResponse.json({ suggestions: fallback, source: "local", warning: "AI service was unavailable, so the built-in advisor was used." });
  }
}
