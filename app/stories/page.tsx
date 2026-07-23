import { redirect } from "next/navigation";
import { getDefaultTrip } from "@/lib/trips";

export default function LegacyStoriesPage() {
  redirect(`/trips/${getDefaultTrip().slug}/journal`);
}
