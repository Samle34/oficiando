import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getProfileById,
  getPortfolioByWorkerId,
  getRatingsByWorkerId,
} from "@/lib/profiles";
import TrabajadorClient from "./trabajador-client";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const profile = await getProfileById(id);
  if (!profile || profile.role !== "worker") return {};
  return {
    title: profile.full_name ?? "Trabajador",
    description: profile.bio ?? `Trabajador en Oficiando.`,
  };
}

export default async function TrabajadorPage({ params }: Props) {
  const { id } = await params;

  const profile = await getProfileById(id);
  if (!profile || profile.role !== "worker") notFound();

  const [portfolioItems, ratings] = await Promise.all([
    getPortfolioByWorkerId(id),
    getRatingsByWorkerId(id),
  ]);

  return (
    <TrabajadorClient
      profile={profile}
      portfolioItems={portfolioItems}
      ratings={ratings}
    />
  );
}
