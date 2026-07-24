import type { Metadata } from "next";
import "./globals.css";
import "./v2.css";
import "./v2-polish.css";
import "./trip-management.css";
import "./adventure-dashboard.css";
import "./adventure-workspaces.css";
import "./adventure-landing.css";
import "./ai-advisor.css";

export const metadata: Metadata = {
  title: "Two Wheels, One Way",
  description: "A private documentary of our roads, places and memories.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
