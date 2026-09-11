import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Collab — B2B creator partnerships",
  description: "Discover trusted B2B creators and book campaigns without the back-and-forth.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
