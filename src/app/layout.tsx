import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Johnson Tile Installation | Expert Tile Setting in Knoxville, TN",
  description:
    "Professional tile installation services in Knoxville, TN. Custom showers, floor tile, backsplash, waterproofing, and more. Licensed, insured, and Schluter Systems certified. Call (865) 282-0348 for a free estimate.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
