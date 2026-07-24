import TripWorkspaceNav from "@/components/trip-workspace-nav";

export default async function TripLayout({ children, params }: { children: React.ReactNode; params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <><TripWorkspaceNav slug={slug} />{children}</>;
}
