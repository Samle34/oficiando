import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getJobById } from "@/lib/jobs";
import DetalleClient from "./detalle-client";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const job = await getJobById(id);
  if (!job) return {};
  return {
    title: job.title,
    description: `${job.category_id} en ${job.city}, ${job.province}.`,
  };
}

export default async function TrabajoDetallePage({ params }: Props) {
  const { id } = await params;
  const job = await getJobById(id);
  if (!job) notFound();
  return <DetalleClient job={job} />;
}
