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

function starterChange(module: ChangeModule): ProposedChange {
  if (module === "packing") return { module, mode: "append", label: "Import essential motorcycle gear", items: [
    { name: "", notes: "", label: "Waterproof riding layers", category: "Travel gear", packed: false, title: "", planned: 0, actual: 0, body: "", date: "", type: "", reference: "", url: "" },
    { name: "", notes: "", label: "Tyre repair kit and compact inflator", category: "Motorcycle", packed: false, title: "", planned: 0, actual: 0, body: "", date: "", type: "", reference: "", url: "" },
    { name: "", notes: "", label: "First-aid kit and medication", category: "Health", packed: false, title: "", planned: 0, actual: 0, body: "", date: "", type: "", reference: "", url: "" },
    { name: "", notes: "", label: "Chargers, cables and power bank", category: "Technology", packed: false, title: "", planned: 0, actual: 0, body: "", date: "", type: "", reference: "", url: "" },
  ] };
  if (module === "budget") return { module, mode: "append", label: "Import budget structure", items: [
    { name: "", notes: "", label: "", category: "Fuel", packed: false, title: "Fuel", planned: 0, actual: 0, body: "", date: "", type: "", reference: "", url: "" },
    { name: "", notes: "", label: "", category: "Accommodation", packed: false, title: "Accommodation", planned: 0, actual: 0, body: "", date: "", type: "", reference: "", url: "" },
    { name: "", notes: "", label: "", category: "Transport", packed: false, title: "Ferries and tolls", planned: 0, actual: 0, body: "", date: "", type: "", reference: "", url: "" },
    { name: "", notes: "", label: "", category: "Other", packed: false, title: "Emergency reserve", planned: 0, actual: 0, body: "", date: "", type: "", reference: "", url: "" },
  ] };
  if (module === "documents") return { module, mode: "append", label: "Import essential travel references", items: [
    { name: "", notes: "Add the policy or assistance details before departure.", label: "", category: "", packed: false, title: "Motorcycle insurance", planned: 0, actual: 0, body: "", date: "", type: "Insurance", reference: "", url: "" },
    { name: "", notes: "Add the membership or telephone details.", label: "", category: "", packed: false, title: "Roadside assistance", planned: 0, actual: 0, body: "", date: "", type: "Insurance", reference: "", url: "" },
    { name: "", notes: "Add confirmation details when booked.", label: "", category: "", packed: false, title: "Accommodation confirmations", planned: 0, actual: 0, body: "", date: "", type: "Accommodation", reference: "", url: "" },
  ] };
  if (module === "journal") return { module, mode: "append", label: "Add trip planning note", items: [
    { name: "", notes: "", label: "", category: "", packed: false, title: "AI trip planning notes", planned: 0, actual: 0, body: "Review the route, daily pace, important bookings and the experiences you do not want to miss.", date: "", type: "", reference: "", url: "" },
  ] };
  return { module: "route", mode: "append", label: "Add route foundations", items: [] };
}

function specificTripPlace(value: unknown): string | null {
  const text = String(value || "").trim();
  if (!text) return null;
  const lower = text.toLowerCase();
  const vague = ["departure point", "final destination", "rest day", "flexible rest day", "fuel stop", "coffee stop", "meal stop", "overnight stop", "scenic stop", "day 1", "day 2", "day 3", "start", "finish"];
  if (vague.some((label) => lower === label || lower.startsWith(`${label} `))) return null;
  return text;
}

function sanitizeRouteChanges(suggestions: Suggestion[]): Suggestion[] {
  return suggestions.map((suggestion) => {
    if (suggestion.change?.module !== "route") return suggestion;
    const validItems = suggestion.change.items.filter((item) => specificTripPlace(item.name));
    if (validItems.length < 2 && suggestion.change.mode === "replace") return { ...suggestion, change: null, action: `${suggestion.action} Add or confirm specific map locations before importing.` };
    if (!validItems.length) return { ...suggestion, change: null, action: `${suggestion.action} Add or confirm a specific city, landmark, address and country before importing.` };
    return { ...suggestion, change: { ...suggestion.change, items: validItems } };
  });
}

function localSuggestions(payload: AdvisorPayload): Suggestion[] {
  const trip = payload.trip;
  const route = asArray(payload.modules.route || payload.modules.map) as Array<{ name?: string; notes?: string }>;
  const packing = asArray(payload.modules.packing) as Array<{ packed?: boolean; label?: string }>;
  const budget = asArray(payload.modules.budget) as Array<{ planned?: number; actual?: number }>;
  const documents = asArray(payload.modules.documents);
  const journal = asArray(payload.modules.journal);
  const suggestions: Suggestion[] = [];

  if (route.length < 2) {
    const origin = specificTripPlace(trip.origin);
    const destination = specificTripPlace(trip.destination);
    suggestions.push({
      priority: "important", category: "route", title: "Build a usable route",
      detail: "The journey has fewer than two saved map locations, so road distance and riding time cannot be calculated yet.",
      action: origin && destination ? "Import the confirmed origin and destination." : "Set a specific origin and destination using city and country names.",
      change: origin && destination ? { module: "route", mode: "append", label: "Add confirmed route foundations", items: [
        { name: origin, notes: "Journey starting location" },
        { name: destination, notes: "Journey destination" },
      ] } : null,
    });
  }
  if (route.length > 8) suggestions.push({ priority: "recommended", category: "route", title: "Plan a lighter riding day", detail: `You have ${route.length} route stops. A recovery or flexible day can protect the trip from fatigue and weather delays.`, action: "Choose a real town already on or close to the route for the lighter overnight stop.", change: null });

  const unpacked = packing.filter((item) => !item.packed);
  if (!packing.length) suggestions.push({ priority: "important", category: "packing", title: "Start the motorcycle packing list", detail: "No packing data is saved for this trip yet.", action: "Import a practical starter checklist.", change: starterChange("packing") });
  else if (unpacked.length) suggestions.push({ priority: unpacked.length > 5 ? "important" : "recommended", category: "packing", title: `${unpacked.length} packing items remain`, detail: "The remaining items may become last-minute blockers, especially documents, riding gear and charging equipment.", action: "Open the packing checklist and complete critical items first.", change: null });

  const planned = budget.reduce((sum, item) => sum + (Number(item.planned) || 0), 0);
  const actual = budget.reduce((sum, item) => sum + (Number(item.actual) || 0), 0);
  if (!budget.length) suggestions.push({ priority: "recommended", category: "budget", title: "Create a basic trip budget", detail: "There are no planned costs, so fuel, accommodation, ferries, tolls and emergency margin are not visible.", action: "Import the essential budget categories and enter your estimates.", change: starterChange("budget") });
  else if (planned > 0 && actual > planned) suggestions.push({ priority: "important", category: "budget", title: "Budget is already over plan", detail: `Actual costs are ${Math.round(((actual - planned) / planned) * 100)}% above the current plan.`, action: "Review accommodation, transport and optional activity costs before adding more bookings.", change: null });

  if (!documents.length) suggestions.push({ priority: "important", category: "documents", title: "Add essential travel references", detail: "No booking or document references are stored for this journey.", action: "Import safe placeholders for insurance, roadside assistance and accommodation confirmations.", change: starterChange("documents") });
  if (!journal.length) suggestions.push({ priority: "optional", category: "general", title: "Write a trip intention note", detail: "A short note about what matters most helps future route and activity decisions stay aligned.", action: "Add a planning note to the journal.", change: starterChange("journal") });

  const destination = String(trip.destination || "your destination");
  const transport = String(trip.transport || "motorcycle");
  suggestions.push({ priority: "recommended", category: "timing", title: "Check conditions close to departure", detail: `Weather, road closures, ferry schedules and local requirements for ${destination} can change after the initial plan is created.`, action: `Recheck current conditions and ${transport} requirements one week before departure and again the evening before.`, change: null });
  return sanitizeRouteChanges(suggestions.slice(0, 8));
}

function ensureFocusedChange(suggestions: Suggestion[], payload: AdvisorPayload): Suggestion[] {
  const focus = String(payload.focus || "").toLowerCase();
  const target: ChangeModule | null = focus.includes("packing") ? "packing" : focus.includes("budget") ? "budget" : focus.includes("document") ? "documents" : null;
  if (!target || suggestions.some((item) => item.change?.module === target)) return suggestions;
  const labels = { packing: ["Prepare a practical packing checklist", "Import useful packing items"], budget: ["Build the trip budget", "Import the main cost categories"], documents: ["Prepare the travel wallet", "Import essential reference placeholders"] } as const;
  const [title, action] = labels[target];
  const fallbackSuggestion: Suggestion = { priority: "recommended", category: target, title, detail: "The advisor did not return a safely importable change, so a validated starter structure is available instead.", action, change: starterChange(target) };
  return [fallbackSuggestion, ...suggestions].slice(0, 8);
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
  if (!apiKey) return NextResponse.json({ suggestions: ensureFocusedChange(fallback, payload), source: "local" });

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-5",
        instructions: `You are a cautious motorcycle trip-planning advisor. Analyse only the supplied trip. Suggestions may include an optional structured change that the traveller can explicitly review and apply. Never overwrite data silently. ROUTE IMPORT RULES: every route item name must be a real location that Google Maps can search directly. Write it as "Specific place or city, region if useful, country". For a hotel, landmark, ferry terminal or mountain pass, include the nearest city/region and country. Never use schedule labels such as Day 1, rest day, flexible day, scenic stop, fuel stop, coffee stop, overnight stop, start or finish as the name. Put the purpose, day number, overnight status and riding notes only in the notes field. Preserve confirmed existing locations. Do not invent an exact hotel, address or landmark when the trip data does not support it; use a real city and country instead. For route improvements, use replace only when returning a complete ordered itinerary with at least two specific locations. For packing, budget, documents and journal, provide append changes whenever a concrete safe import is possible. Every change item must contain all schema fields, including url. Fill unused strings with an empty string, unused numbers with 0 and packed with false. Set change to null when changing saved data would be unsafe. Do not invent precise legal, weather, road, price or schedule facts.`,
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
                    required: ["name", "notes", "label", "category", "packed", "title", "planned", "actual", "body", "date", "type", "reference", "url"],
                    properties: { name: { type: "string" }, notes: { type: "string" }, label: { type: "string" }, category: { type: "string" }, packed: { type: "boolean" }, title: { type: "string" }, planned: { type: "number" }, actual: { type: "number" }, body: { type: "string" }, date: { type: "string" }, type: { type: "string" }, reference: { type: "string" }, url: { type: "string" } }
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
    const safeSuggestions = sanitizeRouteChanges(Array.isArray(parsed.suggestions) ? parsed.suggestions : []);
    return NextResponse.json({ suggestions: ensureFocusedChange(safeSuggestions, payload), source: "openai" });
  } catch (error) {
    console.error("Trip advisor fallback:", error);
    return NextResponse.json({ suggestions: ensureFocusedChange(fallback, payload), source: "local", warning: "AI service was unavailable, so the built-in advisor was used." });
  }
}
