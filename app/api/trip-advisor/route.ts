import { NextResponse } from "next/server";

type Suggestion = {
  priority: "important" | "recommended" | "optional";
  category: "route" | "packing" | "budget" | "documents" | "timing" | "general";
  title: string;
  detail: string;
  action: string;
};

type AdvisorPayload = {
  trip: Record<string, unknown>;
  modules: Record<string, unknown>;
  focus?: string;
};

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function localSuggestions(payload: AdvisorPayload): Suggestion[] {
  const trip = payload.trip;
  const route = asArray(payload.modules.map);
  const packing = asArray(payload.modules.packing) as Array<{ packed?: boolean; label?: string }>;
  const budget = asArray(payload.modules.budget) as Array<{ planned?: number; actual?: number }>;
  const documents = asArray(payload.modules.documents);
  const journal = asArray(payload.modules.journal);
  const suggestions: Suggestion[] = [];

  if (route.length < 2) suggestions.push({ priority: "important", category: "route", title: "Build a usable route", detail: "The journey has fewer than two saved stops, so distance, overnight rhythm and daily riding load cannot be assessed yet.", action: "Add the departure point, overnight stops and final destination." });
  if (route.length > 8) suggestions.push({ priority: "recommended", category: "route", title: "Review daily riding load", detail: `You have ${route.length} route stops. Check that transfers leave time for fuel, meals, weather delays and scenic detours.`, action: "Group stops into realistic riding days and add at least one lighter day." });

  const unpacked = packing.filter((item) => !item.packed);
  if (!packing.length) suggestions.push({ priority: "important", category: "packing", title: "Start the motorcycle packing list", detail: "No packing data is saved for this trip yet.", action: "Add riding layers, rain protection, tools, chargers, medicine and luggage covers." });
  else if (unpacked.length) suggestions.push({ priority: unpacked.length > 5 ? "important" : "recommended", category: "packing", title: `${unpacked.length} packing items remain`, detail: "The remaining items may become last-minute blockers, especially documents, riding gear and charging equipment.", action: "Pack critical items first and leave clothing or comfort items for the final pass." });

  const planned = budget.reduce((sum, item) => sum + (Number(item.planned) || 0), 0);
  const actual = budget.reduce((sum, item) => sum + (Number(item.actual) || 0), 0);
  if (!budget.length) suggestions.push({ priority: "recommended", category: "budget", title: "Create a basic trip budget", detail: "There are no planned costs, so fuel, accommodation, ferries, tolls and emergency margin are not visible.", action: "Add the major fixed costs and a 10–15% contingency." });
  else if (planned > 0 && actual > planned) suggestions.push({ priority: "important", category: "budget", title: "Budget is already over plan", detail: `Actual costs are ${Math.round(((actual - planned) / planned) * 100)}% above the current plan.`, action: "Review accommodation, transport and optional activity costs before adding more bookings." });

  if (!documents.length) suggestions.push({ priority: "important", category: "documents", title: "Add essential travel references", detail: "No booking or document references are stored for this journey.", action: "Add insurance, accommodation, ferry, roadside assistance and emergency contact references. Do not store passport or payment-card numbers." });
  if (!journal.length) suggestions.push({ priority: "optional", category: "general", title: "Write a trip intention note", detail: "A short note about what matters most helps future route and activity decisions stay aligned.", action: "Add the experiences, pace and places you do not want to miss." });

  const destination = String(trip.destination || "your destination");
  const transport = String(trip.transport || "motorcycle");
  suggestions.push({ priority: "recommended", category: "timing", title: "Check conditions close to departure", detail: `Weather, road closures, ferry schedules and local requirements for ${destination} can change after the initial plan is created.`, action: `Recheck current conditions and ${transport} requirements one week before departure and again the evening before.` });

  return suggestions.slice(0, 8);
}

function extractOutputText(data: any): string {
  if (typeof data?.output_text === "string") return data.output_text;
  const parts = Array.isArray(data?.output) ? data.output.flatMap((item: any) => Array.isArray(item?.content) ? item.content : []) : [];
  return parts.map((part: any) => part?.text).filter((text: unknown) => typeof text === "string").join("\n");
}

export async function POST(request: Request) {
  let payload: AdvisorPayload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const fallback = localSuggestions(payload);
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return NextResponse.json({ suggestions: fallback, source: "local" });

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-5",
        instructions: "You are a cautious motorcycle trip-planning advisor. Analyse only the supplied trip. Do not invent precise legal, weather, road, price or schedule facts. Flag anything requiring a current external check. Return concise, practical suggestions prioritised by safety and trip readiness.",
        input: JSON.stringify(payload),
        text: {
          format: {
            type: "json_schema",
            name: "trip_advice",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              required: ["suggestions"],
              properties: {
                suggestions: {
                  type: "array",
                  maxItems: 8,
                  items: {
                    type: "object",
                    additionalProperties: false,
                    required: ["priority", "category", "title", "detail", "action"],
                    properties: {
                      priority: { type: "string", enum: ["important", "recommended", "optional"] },
                      category: { type: "string", enum: ["route", "packing", "budget", "documents", "timing", "general"] },
                      title: { type: "string" }, detail: { type: "string" }, action: { type: "string" }
                    }
                  }
                }
              }
            }
          }
        }
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
