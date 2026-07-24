"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, FileText, LayoutDashboard, Map, PackageCheck, Pencil, Receipt } from "lucide-react";

const items = [
  { href: "", label: "Overview", icon: LayoutDashboard },
  { href: "map", label: "Route", icon: Map },
  { href: "packing", label: "Packing", icon: PackageCheck },
  { href: "budget", label: "Budget", icon: Receipt },
  { href: "documents", label: "Documents", icon: FileText },
  { href: "journal", label: "Journal", icon: BookOpen },
];

export default function TripWorkspaceNav({ slug }: { slug: string }) {
  const pathname = usePathname();
  return (
    <nav className="trip-workspace-nav" aria-label="Trip workspace">
      <div className="trip-workspace-nav-inner">
        {items.map(({ href, label, icon: Icon }) => {
          const target = `/trips/${slug}${href ? `/${href}` : ""}`;
          const active = href ? pathname.startsWith(target) : pathname === target;
          return <Link className={active ? "active" : ""} href={target} key={label}><Icon size={17} /><span>{label}</span></Link>;
        })}
        <Link className={pathname.endsWith("/edit") ? "active edit-link" : "edit-link"} href={`/trips/${slug}/edit`}><Pencil size={16} /><span>Edit</span></Link>
      </div>
    </nav>
  );
}
