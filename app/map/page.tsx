import { redirect } from "next/navigation";
import { getDefaultTrip } from "@/lib/trips";

export default function LegacyMapPage() {
  redirect(`/trips/${getDefaultTrip().slug}/map`);
}
