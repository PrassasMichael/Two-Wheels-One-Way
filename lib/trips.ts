import tripsData from "@/content/trips.json";
import type { Trip } from "@/lib/types";

const trips = tripsData as Trip[];

export function getTrips(): Trip[] {
  return trips;
}

export function getTrip(slug: string): Trip | undefined {
  return trips.find((trip) => trip.slug === slug || trip.id === slug);
}

export function getDefaultTrip(): Trip {
  const trip = trips[0];
  if (!trip) throw new Error("At least one trip must exist in content/trips.json");
  return trip;
}

export function tripStorageKey(slug: string, module: string): string {
  return `two-wheels-one-way:trip:${slug}:${module}`;
}
