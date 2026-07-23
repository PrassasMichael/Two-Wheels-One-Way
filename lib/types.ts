export type TripStatus = "planning" | "upcoming" | "travelling" | "completed";

export interface TripChapter {
  order: number;
  title: string;
  location: string;
  duration: string;
  description: string;
}

export interface Trip {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  year: number;
  month?: string;
  status: TripStatus;
  startDate?: string;
  endDate?: string;
  origin: string;
  destination: string;
  countries: string[];
  travellers: number;
  travelParty?: string;
  transport: string;
  distanceKm?: number;
  heroImage?: string;
  summary: string;
  chapters?: TripChapter[];
  knownPlan?: string[];
  planningNeeded?: string[];
  tags: string[];
}
