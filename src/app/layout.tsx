import type { Metadata, Viewport } from "next";
import { Geist, Manrope } from "next/font/google";
import "./globals.css";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: "BrunoWeb",
  description: "CRM de visitas comerciales",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={`${geist.variable} ${manrope.variable} h-full`}>
      <body className="min-h-full bg-zinc-50 text-zinc-900 antialiased">{children}</body>
    </html>
  );
}
