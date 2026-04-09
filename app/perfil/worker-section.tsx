"use client";

import { useState, useTransition } from "react";
import { CATEGORIES } from "@/lib/categories";
import { PROVINCES_BY_COUNTRY } from "@/lib/provinces";
import { updateWorkerProfile } from "@/app/auth/actions";

const PROVINCES = PROVINCES_BY_COUNTRY["Argentina"] ?? [];

interface WorkerSectionProps {
  bio: string | null;
  categories: string[];
  workZones: string[];
}

export default function WorkerSection({
  bio: initialBio,
  categories: initialCategories,
  workZones: initialZones,
}: WorkerSectionProps) {
  const [bio, setBio] = useState(initialBio ?? "");
  const [selectedCategories, setSelectedCategories] = useState<string[]>(initialCategories);
  const [selectedZones, setSelectedZones] = useState<string[]>(initialZones);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function toggleCategory(id: string) {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  }

  function toggleZone(zone: string) {
    setSelectedZones((prev) =>
      prev.includes(zone) ? prev.filter((z) => z !== zone) : [...prev, zone]
    );
  }

  function handleSave() {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await updateWorkerProfile({
        bio,
        categories: selectedCategories,
        work_zones: selectedZones,
      });
      if (result.error) {
        setError(result.error);
      } else {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="h-px bg-border" />
      <h2 className="text-base font-bold text-primary">Perfil de trabajador</h2>

      {/* Bio */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-primary">
          Descripción
        </label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          maxLength={500}
          rows={4}
          placeholder="Contá quién sos, qué servicios ofrecés, tu experiencia..."
          className="w-full px-4 py-3 rounded-md border border-border bg-card text-sm text-primary placeholder:text-tertiary focus:outline-none focus:border-brand transition-colors resize-none"
        />
        <p className="text-xs text-tertiary text-right">{bio.length}/500</p>
      </div>

      {/* Categorías */}
      <div className="flex flex-col gap-3">
        <label className="text-sm font-semibold text-primary">
          Servicios que ofrecés
        </label>
        <div className="grid grid-cols-2 gap-2">
          {CATEGORIES.map((cat) => {
            const selected = selectedCategories.includes(cat.id);
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => toggleCategory(cat.id)}
                className={[
                  "flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium text-left transition-colors",
                  selected
                    ? "border-brand text-brand bg-orange-50"
                    : "border-border text-secondary bg-card",
                ].join(" ")}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Zonas de trabajo */}
      <div className="flex flex-col gap-3">
        <label className="text-sm font-semibold text-primary">
          Zonas donde trabajás
        </label>
        <div className="flex flex-wrap gap-2">
          {PROVINCES.map((province) => {
            const selected = selectedZones.includes(province);
            return (
              <button
                key={province}
                type="button"
                onClick={() => toggleZone(province)}
                className={[
                  "px-3 py-1.5 rounded-full border text-xs font-medium transition-colors",
                  selected
                    ? "border-brand text-brand bg-orange-50"
                    : "border-border text-secondary bg-card",
                ].join(" ")}
              >
                {province}
              </button>
            );
          })}
        </div>
      </div>

      {error && <p className="text-sm text-red-600 font-medium">{error}</p>}
      {saved && <p className="text-sm text-green-600 font-medium">Perfil guardado.</p>}

      <button
        type="button"
        disabled={isPending}
        onClick={handleSave}
        className="h-11 rounded-md bg-brand text-white text-sm font-semibold disabled:opacity-60 transition-opacity"
        style={{ backgroundColor: "#e8622a" }}
      >
        {isPending ? "Guardando..." : "Guardar perfil de trabajador"}
      </button>
    </div>
  );
}
