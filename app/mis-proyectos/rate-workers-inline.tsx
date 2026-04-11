"use client";

import { useState } from "react";
import { rateWorker } from "@/app/actions";
import Avatar from "@/components/ui/Avatar";
import StarRating from "@/components/ui/StarRating";

interface WorkerEntry {
  workerId: string;
  full_name: string;
  avatar_url: string | null;
}

interface Props {
  jobId: number;
  workers: WorkerEntry[];
}

interface WorkerState {
  score: number;
  comment: string;
  submitting: boolean;
  submitted: boolean;
  error: string | null;
}

export default function RateWorkersInline({ jobId, workers }: Props) {
  const [open, setOpen] = useState(false);
  const [states, setStates] = useState<Record<string, WorkerState>>(() => {
    const init: Record<string, WorkerState> = {};
    workers.forEach((w) => {
      init[w.workerId] = { score: 0, comment: "", submitting: false, submitted: false, error: null };
    });
    return init;
  });

  function setScore(id: string, score: number) {
    setStates((prev) => ({ ...prev, [id]: { ...prev[id], score } }));
  }
  function setComment(id: string, comment: string) {
    setStates((prev) => ({ ...prev, [id]: { ...prev[id], comment } }));
  }

  async function handleRate(worker: WorkerEntry) {
    const ws = states[worker.workerId];
    if (!ws || ws.score === 0 || ws.submitted) return;
    setStates((prev) => ({ ...prev, [worker.workerId]: { ...prev[worker.workerId], submitting: true, error: null } }));
    const result = await rateWorker({ jobId, workerId: worker.workerId, score: ws.score, comment: ws.comment });
    if (result.status === "error") {
      setStates((prev) => ({ ...prev, [worker.workerId]: { ...prev[worker.workerId], submitting: false, error: result.message } }));
    } else {
      setStates((prev) => ({ ...prev, [worker.workerId]: { ...prev[worker.workerId], submitting: false, submitted: true } }));
    }
  }

  const allSubmitted = workers.every((w) => states[w.workerId]?.submitted);

  if (allSubmitted) {
    return (
      <p className="text-xs text-emerald-600 font-medium px-1">Calificaciones enviadas ✓</p>
    );
  }

  if (!open) {
    const pendingCount = workers.filter((w) => !states[w.workerId]?.submitted).length;
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full flex items-center justify-center gap-2 h-10 rounded-md border-2 border-amber-400 bg-amber-50 text-sm font-bold text-amber-700 hover:bg-amber-100 transition-colors"
      >
        ⭐ Calificar trabajador{pendingCount > 1 ? "es" : ""} ({pendingCount} pendiente{pendingCount > 1 ? "s" : ""})
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4 rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-primary">Calificar trabajadores</p>
        <button type="button" onClick={() => setOpen(false)} className="text-xs text-tertiary">Cerrar</button>
      </div>

      {workers.map((worker) => {
        const ws = states[worker.workerId];
        if (!ws) return null;
        return (
          <div key={worker.workerId} className="flex flex-col gap-3 pb-4 border-b border-border last:border-0 last:pb-0">
            <div className="flex items-center gap-2">
              <Avatar name={worker.full_name} avatarUrl={worker.avatar_url} size="sm" />
              <span className="text-sm font-semibold text-primary flex-1">{worker.full_name}</span>
              {ws.submitted && <span className="text-xs text-emerald-600 font-semibold">Calificado ✓</span>}
            </div>

            {!ws.submitted && (
              <>
                <div className="flex flex-col gap-1">
                  <p className="text-xs text-secondary">¿Cómo calificás su trabajo?</p>
                  <StarRating value={ws.score} interactive onChange={(s) => setScore(worker.workerId, s)} size="md" />
                </div>
                <textarea
                  value={ws.comment}
                  onChange={(e) => setComment(worker.workerId, e.target.value)}
                  placeholder="Comentario opcional..."
                  rows={2}
                  maxLength={300}
                  className="w-full px-3 py-2 rounded-md border border-border bg-surface text-sm text-primary placeholder:text-tertiary focus:outline-none focus:border-brand resize-none"
                />
                {ws.error && <p className="text-xs text-red-600">{ws.error}</p>}
                <button
                  type="button"
                  disabled={ws.score === 0 || ws.submitting}
                  onClick={() => handleRate(worker)}
                  className="h-9 rounded-md text-xs font-semibold text-white disabled:opacity-50 transition-opacity"
                  style={{ backgroundColor: "#e8622a" }}
                >
                  {ws.submitting ? "Enviando..." : "Calificar"}
                </button>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
