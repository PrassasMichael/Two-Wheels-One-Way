import { redirect } from "next/navigation";
import { getDefaultTrip } from "@/lib/trips";

export default function LegacyPackingPage() {
  redirect(`/trips/${getDefaultTrip().slug}/packing`);
}
