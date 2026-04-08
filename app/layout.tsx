import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#e8622a",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: {
    default: "Oficiando — Encontrá al profesional que necesitás",
    template: "%s — Oficiando",
  },
  description:
    "Marketplace de servicios del hogar en Argentina. Gratis, sin comisiones, directo al trabajador.",
  openGraph: {
    type: "website",
    siteName: "Oficiando",
    title: "Oficiando — Encontrá al profesional que necesitás",
    description:
      "Publicá tu trabajo, recibí postulaciones y cerrá el trato directo por WhatsApp. Sin comisiones.",
  },
  twitter: {
    card: "summary",
    title: "Oficiando — Encontrá al profesional que necesitás",
    description:
      "Publicá tu trabajo, recibí postulaciones y cerrá el trato directo por WhatsApp. Sin comisiones.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={inter.variable}>
      <body className="min-h-svh flex flex-col bg-surface antialiased">
        {children}
      </body>
    </html>
  );
}
