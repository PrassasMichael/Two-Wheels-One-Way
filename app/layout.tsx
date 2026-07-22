import type { Metadata } from "next";
import "./globals.css";

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
