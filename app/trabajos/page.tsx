import type { Metadata } from "next";
import { getJobs } from "@/lib/jobs";
import TrabajosClient from "./trabajos-client";

export const metadata: Metadata = {
  title: "Trabajos disponibles — Oficiando",
  description:
    "Explorá trabajos de plomería, electricidad, limpieza, albañilería y más en tu zona. Gratis, sin intermediarios.",
  openGraph: {
    title: "Trabajos disponibles — Oficiando",
    description:
      "Explorá trabajos de plomería, electricidad, limpieza, albañilería y más en tu zona.",
  },
};

export default async function TrabajosPage({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string }>;
}) {
  const { categoria } = await searchParams;

  // Fetch all open jobs server-side. Client filters in-memory for instant UX.
  const jobs = await getJobs({ category: categoria });

  return <TrabajosClient jobs={jobs} initialCategory={categoria ?? null} />;
}
