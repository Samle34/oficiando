import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProfileById, getClientRatingsByClientId } from "@/lib/profiles";
import { getJobsByUserId } from "@/lib/jobs";
import ClienteClient from "./cliente-client";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const profile = await getProfileById(id);
  if (!profile) return {};
  return {
    title: `${profile.full_name ?? "Cliente"} — Oficiando`,
    description: profile.bio ?? `Perfil de cliente en Oficiando.`,
  };
}

export default async function ClientePage({ params }: Props) {
  const { id } = await params;

  const profile = await getProfileById(id);
  if (!profile) notFound();

  const [jobs, ratings] = await Promise.all([
    getJobsByUserId(id),
    getClientRatingsByClientId(id),
  ]);

  return <ClienteClient profile={profile} jobs={jobs} ratings={ratings} />;
}
