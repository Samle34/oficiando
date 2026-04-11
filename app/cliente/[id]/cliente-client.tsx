"use client";

import Link from "next/link";
import Avatar from "@/components/ui/Avatar";
import StarRating from "@/components/ui/StarRating";
import JobCard from "@/components/ui/JobCard";
import type { Profile, ClientRating } from "@/lib/profiles";
import type { Job } from "@/lib/jobs";

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days < 1) return "hoy";
  if (days < 30) return `hace ${days} día${days !== 1 ? "s" : ""}`;
  const months = Math.floor(days / 30);
  return `hace ${months} mes${months !== 1 ? "es" : ""}`;
}

interface ClienteClientProps {
  profile: Profile;
  jobs: Job[];
  ratings: ClientRating[];
}

export default function ClienteClient({ profile, jobs, ratings }: ClienteClientProps) {
  const displayName = profile.full_name ?? "Cliente";

  return (
    <main className="flex-1 max-w-lg mx-auto w-full px-4 pt-6 pb-24 flex flex-col gap-8">

      <Link href="/trabajos" className="text-sm text-brand font-medium w-fit">
        ← Volver
      </Link>

      {/* ── Header ── */}
      <div className="flex flex-col items-center gap-4 text-center">
        <Avatar name={displayName} avatarUrl={profile.avatar_url} size="lg" />
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-black text-primary">{displayName}</h1>
          {profile.province && (
            <p className="text-sm text-secondary">{profile.province}</p>
          )}
          {profile.client_rating_count > 0 ? (
            <div className="flex items-center justify-center gap-1.5">
              <StarRating value={profile.client_rating} size="sm" />
              <span className="text-sm text-secondary">
                {profile.client_rating.toFixed(1)} ({profile.client_rating_count} reseña{profile.client_rating_count !== 1 ? "s" : ""})
              </span>
            </div>
          ) : (
            <p className="text-sm text-tertiary">Sin reseñas aún</p>
          )}
        </div>
      </div>

      {/* ── Bio ── */}
      {profile.bio && (
        <div className="flex flex-col gap-2">
          <h2 className="text-sm font-bold text-primary">Sobre mí</h2>
          <p className="text-sm text-secondary leading-relaxed">{profile.bio}</p>
        </div>
      )}

      {/* ── Trabajos publicados ── */}
      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-bold text-primary">Trabajos publicados</h2>
        {jobs.length === 0 ? (
          <p className="text-sm text-tertiary">No tiene trabajos abiertos en este momento.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        )}
      </div>

      {/* ── Reseñas ── */}
      <div className="flex flex-col gap-4">
        <h2 className="text-sm font-bold text-primary">Reseñas de trabajadores</h2>
        {ratings.length === 0 ? (
          <p className="text-sm text-tertiary">Todavía no tiene calificaciones.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {ratings.map((r) => (
              <div
                key={r.id}
                className="flex flex-col gap-2 p-4 rounded-xl border border-border bg-card"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <StarRating value={r.score} size="sm" />
                    {r.reviewer_name && (
                      <span className="text-xs text-secondary font-medium">{r.reviewer_name}</span>
                    )}
                  </div>
                  <span className="text-xs text-tertiary">{relativeTime(r.created_at)}</span>
                </div>
                {r.comment && (
                  <p className="text-sm text-secondary leading-relaxed">{r.comment}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

    </main>
  );
}
