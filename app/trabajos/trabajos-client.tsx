"use client";

import { useState, useMemo } from "react";
import JobCard from "@/components/ui/JobCard";
import { JobCardSkeleton } from "@/components/ui/Skeleton";
import { CATEGORIES } from "@/lib/categories";
import type { Job } from "@/lib/jobs";

export default function TrabajosClient({
  jobs,
  initialCategory,
}: {
  jobs: Job[];
  initialCategory: string | null;
}) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(initialCategory);

  // Client-side filter over server-fetched data — instant, no extra requests
  const filtered = useMemo(() => {
    return jobs.filter((job) => {
      const matchesCat = !activeCategory || job.category_id === activeCategory;
      const matchesSearch =
        !search ||
        job.title.toLowerCase().includes(search.toLowerCase()) ||
        job.city.toLowerCase().includes(search.toLowerCase());
      return matchesCat && matchesSearch;
    });
  }, [jobs, search, activeCategory]);

  return (
    <main className="flex-1 max-w-lg mx-auto w-full pb-24">

        <div className="sticky top-14 z-30 bg-surface px-4 pt-4 pb-3 flex flex-col gap-3 border-b border-border">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar trabajos..."
            className={[
              "w-full h-10 px-4 rounded-md",
              "border border-border bg-card",
              "text-sm text-primary placeholder:text-tertiary",
              "focus:outline-none focus:border-brand",
              "transition-colors duration-150",
            ].join(" ")}
          />

          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1">
            <button
              onClick={() => setActiveCategory(null)}
              className={[
                "shrink-0 h-8 px-3 rounded-full text-xs font-semibold transition-colors duration-150",
                !activeCategory
                  ? "bg-primary text-white"
                  : "bg-card border border-border text-secondary hover:text-primary",
              ].join(" ")}
            >
              Todos
            </button>
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() =>
                  setActiveCategory(activeCategory === cat.id ? null : cat.id)
                }
                className={[
                  "shrink-0 h-8 px-3 rounded-full text-xs font-semibold transition-colors duration-150",
                  activeCategory === cat.id
                    ? "text-white"
                    : "bg-card border border-border text-secondary hover:text-primary",
                ].join(" ")}
                style={
                  activeCategory === cat.id ? { backgroundColor: cat.color } : {}
                }
              >
                {cat.icon} {cat.label}
              </button>
            ))}
          </div>
        </div>

        <div className="px-4 pt-4 flex flex-col gap-3">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-16 text-center">
              <span className="text-4xl">🔍</span>
              <p className="text-base font-semibold text-primary">
                No hay trabajos para esa búsqueda
              </p>
              <p className="text-sm text-secondary">
                Probá con otra categoría o buscá en otra ciudad
              </p>
            </div>
          ) : (
            filtered.map((job) => <JobCard key={job.id} job={job} />)
          )}
        </div>
    </main>
  );
}
