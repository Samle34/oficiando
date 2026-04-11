import Link from "next/link";
import { getCategory } from "@/lib/categories";
import CategoryTag from "./CategoryTag";
import type { Job } from "@/lib/jobs";

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "ahora";
  if (mins < 60) return `hace ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `hace ${hrs} h`;
  const days = Math.floor(hrs / 24);
  return `hace ${days} d`;
}

export default function JobCard({
  job,
  applicationStatus,
}: {
  job: Job;
  applicationStatus?: "pending" | "accepted";
}) {
  const cat = getCategory(job.category_id);

  return (
    <Link
      href={`/trabajos/${job.id}`}
      className={[
        "group flex flex-col gap-3 bg-card rounded-lg border border-border px-4 py-4",
        "transition-colors duration-150",
        "hover:border-[rgba(232,98,42,0.25)]",
        "border-l-[3px]",
      ].join(" ")}
      style={{ borderLeftColor: cat.color }}
    >
      {job.photos?.[0] && (
        <div className="w-full h-32 rounded-md overflow-hidden -mx-0 mb-1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={job.photos[0]}
            alt={job.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <p className="text-base font-semibold text-primary leading-snug group-hover:text-brand transition-colors">
        {job.title}
      </p>

      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <CategoryTag categoryId={job.category_id} size="sm" />
          <span className="text-xs text-secondary">{job.city}</span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={[
              "inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full",
              job.status === "abierto"
                ? "bg-emerald-50 text-emerald-700"
                : "bg-red-50 text-red-600",
            ].join(" ")}
          >
            <span
              className={[
                "w-1.5 h-1.5 rounded-full",
                job.status === "abierto" ? "bg-emerald-500" : "bg-red-500",
              ].join(" ")}
            />
            {job.status === "abierto" ? "Abierto" : "Cerrado"}
          </span>
          {applicationStatus ? (
            applicationStatus === "accepted" ? (
              <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Aceptado ✓
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-600">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                Pendiente
              </span>
            )
          ) : (
            <span className="text-xs text-tertiary">{relativeTime(job.posted_at)}</span>
          )}
        </div>
      </div>

      {job.applicants !== undefined && (
        <p className="text-xs text-tertiary">
          {job.applicants === 0
            ? "Sin postulantes aún"
            : `${job.applicants} postulante${job.applicants === 1 ? "" : "s"}`}
        </p>
      )}
    </Link>
  );
}
