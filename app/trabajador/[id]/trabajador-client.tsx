"use client";

import Link from "next/link";
import Avatar from "@/components/ui/Avatar";
import CategoryTag from "@/components/ui/CategoryTag";
import StarRating from "@/components/ui/StarRating";
import type { Profile, PortfolioItem, Rating } from "@/lib/profiles";

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days < 1) return "hoy";
  if (days < 30) return `hace ${days} día${days !== 1 ? "s" : ""}`;
  const months = Math.floor(days / 30);
  return `hace ${months} mes${months !== 1 ? "es" : ""}`;
}

interface TrabajadorClientProps {
  profile: Profile;
  portfolioItems: PortfolioItem[];
  ratings: Rating[];
}

export default function TrabajadorClient({
  profile,
  portfolioItems,
  ratings,
}: TrabajadorClientProps) {
  const displayName = profile.full_name ?? "Trabajador";

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
          {profile.rating_count > 0 ? (
            <div className="flex items-center justify-center gap-1.5">
              <StarRating value={profile.rating} size="sm" />
              <span className="text-sm text-secondary">
                {profile.rating.toFixed(1)} ({profile.rating_count} reseña{profile.rating_count !== 1 ? "s" : ""})
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

      {/* ── Categorías ── */}
      {profile.categories.length > 0 && (
        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-bold text-primary">Servicios que ofrezco</h2>
          <div className="flex flex-wrap gap-2">
            {profile.categories.map((catId) => (
              <CategoryTag key={catId} categoryId={catId} size="md" />
            ))}
          </div>
        </div>
      )}

      {/* ── Zonas ── */}
      {profile.work_zones.length > 0 && (
        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-bold text-primary">Zonas donde trabajo</h2>
          <div className="flex flex-wrap gap-2">
            {profile.work_zones.map((zone) => (
              <span
                key={zone}
                className="px-3 py-1.5 rounded-full border border-border text-xs text-secondary bg-card"
              >
                {zone}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── Portfolio ── */}
      <div className="flex flex-col gap-4">
        <h2 className="text-sm font-bold text-primary">Trabajos realizados</h2>
        {portfolioItems.length === 0 ? (
          <p className="text-sm text-tertiary">Todavía no tiene trabajos en el portfolio.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {portfolioItems.map((item) => (
              <div
                key={item.id}
                className="flex flex-col gap-3 p-4 rounded-xl border border-border bg-card"
              >
                <p className="text-sm font-semibold text-primary">{item.title}</p>
                {item.description && (
                  <p className="text-xs text-secondary leading-relaxed">{item.description}</p>
                )}
                {item.photos.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {item.photos.map((url, i) => (
                      <div key={i} className="w-28 h-20 shrink-0 rounded-lg overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Reseñas ── */}
      <div className="flex flex-col gap-4">
        <h2 className="text-sm font-bold text-primary">Reseñas</h2>
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
                  <StarRating value={r.score} size="sm" />
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
