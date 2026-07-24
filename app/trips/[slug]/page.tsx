import TripDashboardClient from "@/components/trip-dashboard-client";
import { getTrip, getTrips } from "@/lib/trips";

export function generateStaticParams() {
  return getTrips().map((trip) => ({ slug: trip.slug }));
}

export default async function TripDashboard({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <TripDashboardClient slug={slug} initialTrip={getTrip(slug) || null} />;
}
