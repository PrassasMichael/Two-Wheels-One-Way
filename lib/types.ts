export type TripStatus = "planning" | "upcoming" | "travelling" | "completed";

export interface Trip {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  year: number;
  status: TripStatus;
  startDate?: string;
  endDate?: string;
  origin: string;
  destination: string;
  countries: string[];
  travellers: number;
  transport: string;
  distanceKm?: number;
  heroImage?: string;
  summary: string;
  tags: string[];
}
