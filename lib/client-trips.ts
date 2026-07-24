import type { Trip } from "@/lib/types";

export const CUSTOM_TRIPS_KEY = "two-wheels-one-way:custom-trips";

export function slugifyTrip(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || `journey-${Date.now()}`;
}

export function readCustomTrips(): Trip[] {
  if (typeof window === "undefined") return [];
  try {
    const value = JSON.parse(localStorage.getItem(CUSTOM_TRIPS_KEY) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

export function saveCustomTrips(trips: Trip[]): void {
  localStorage.setItem(CUSTOM_TRIPS_KEY, JSON.stringify(trips));
  window.dispatchEvent(new Event("trip-registry-updated"));
}

export function findCustomTrip(slug: string): Trip | undefined {
  return readCustomTrips().find((trip) => trip.slug === slug || trip.id === slug);
}

export function upsertCustomTrip(trip: Trip): void {
  const trips = readCustomTrips();
  const index = trips.findIndex((item) => item.id === trip.id || item.slug === trip.slug);
  if (index >= 0) trips[index] = trip;
  else trips.unshift(trip);
  saveCustomTrips(trips);
}
