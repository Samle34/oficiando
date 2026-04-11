"use client";

import { useState } from "react";
import { rateClient } from "@/app/actions";
import StarRating from "@/components/ui/StarRating";

interface Props {
  jobId: number;
  clientId: string;
  clientName: string;
}

export default function RateClientInline({ jobId, clientId, clientName }: Props) {
  const [open, setOpen] = useState(false);
  const [score, setScore] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (score === 0) return;
    setSubmitting(true);
    setError(null);
    const result = await rateClient({ jobId, clientId, score, comment });
    setSubmitting(false);
    if (result.status === "error") {
      setError(result.message);
    } else {
      setSubmitted(true);
    }
  }

  if (submitted) {
    return (
      <p className="text-xs text-emerald-600 font-medium px-1">Calificación enviada ✓</p>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 px-1 py-1 w-fit"
      >
        ⭐ Calificar a {clientName.split(" ")[0]}
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-3 p-4 rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-primary">Calificar al cliente</p>
        <button type="button" onClick={() => setOpen(false)} className="text-xs text-tertiary">Cancelar</button>
      </div>

      <div className="flex flex-col gap-1">
        <p className="text-xs text-secondary">¿Cómo fue trabajar con {clientName.split(" ")[0]}?</p>
        <StarRating value={score} interactive onChange={setScore} size="md" />
      </div>

      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Comentario opcional..."
        rows={2}
        maxLength={300}
        className="w-full px-3 py-2 rounded-md border border-border bg-surface text-sm text-primary placeholder:text-tertiary focus:outline-none focus:border-brand resize-none"
      />

      {error && <p className="text-xs text-red-600">{error}</p>}

      <button
        type="button"
        disabled={score === 0 || submitting}
        onClick={handleSubmit}
        className="h-9 rounded-md text-xs font-semibold text-white disabled:opacity-50 transition-opacity"
        style={{ backgroundColor: "#e8622a" }}
      >
        {submitting ? "Enviando..." : "Enviar calificación"}
      </button>
    </div>
  );
}
