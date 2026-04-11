"use client";

import { useEffect, useState, useTransition } from "react";
import { closeJob, rateWorker, getAcceptedWorkersForJob, type AcceptedWorkerForRating } from "@/app/actions";
import Avatar from "@/components/ui/Avatar";
import StarRating from "@/components/ui/StarRating";

type CloseState = "idle" | "confirming" | "closing" | "loading" | "rating" | "done";

interface WorkerRatingState {
  score: number;
  comment: string;
  submitting: boolean;
  submitted: boolean;
  error: string | null;
}

export default function CloseJobButton({ jobId }: { jobId: number }) {
  const [state, setState] = useState<CloseState>("idle");
  const [isPending, startTransition] = useTransition();
  const [workers, setWorkers] = useState<AcceptedWorkerForRating[]>([]);
  const [workerStates, setWorkerStates] = useState<Record<string, WorkerRatingState>>({});

  // When entering rating state, load accepted workers
  useEffect(() => {
    if (state !== "loading") return;
    startTransition(async () => {
      const list = await getAcceptedWorkersForJob(jobId);
      if (list.length === 0) {
        setState("done");
        return;
      }
      const initial: Record<string, WorkerRatingState> = {};
      list.forEach((w) => {
        initial[w.id] = { score: 0, comment: "", submitting: false, submitted: w.alreadyRated, error: null };
      });
      setWorkers(list);
      setWorkerStates(initial);
      setState("rating");
    });
  }, [state, jobId]);

  function handleClose() {
    startTransition(async () => {
      setState("closing");
      const result = await closeJob(jobId);
      if (result.status === "success") {
        setState("loading");
      } else {
        setState("idle");
      }
    });
  }

  function setWorkerScore(workerId: string, score: number) {
    setWorkerStates((prev) => ({ ...prev, [workerId]: { ...prev[workerId], score } }));
  }

  function setWorkerComment(workerId: string, comment: string) {
    setWorkerStates((prev) => ({ ...prev, [workerId]: { ...prev[workerId], comment } }));
  }

  async function handleRateWorker(worker: AcceptedWorkerForRating) {
    const ws = workerStates[worker.id];
    if (!ws || ws.score === 0 || ws.submitted) return;
    setWorkerStates((prev) => ({ ...prev, [worker.id]: { ...prev[worker.id], submitting: true, error: null } }));
    const result = await rateWorker({ jobId, workerId: worker.id, score: ws.score, comment: ws.comment });
    if (result.status === "error") {
      setWorkerStates((prev) => ({ ...prev, [worker.id]: { ...prev[worker.id], submitting: false, error: result.message } }));
    } else {
      setWorkerStates((prev) => ({ ...prev, [worker.id]: { ...prev[worker.id], submitting: false, submitted: true } }));
    }
  }

  // ── done ──
  if (state === "done") {
    return (
      <p className="text-xs text-emerald-600 font-medium mt-1 text-center">
        ✓ Trabajo cerrado
      </p>
    );
  }

  // ── closing / loading ──
  if (state === "closing" || state === "loading") {
    return <p className="text-xs text-tertiary mt-1 text-center">Cerrando...</p>;
  }

  // ── rating ──
  if (state === "rating") {
    const allDone = workers.every((w) => workerStates[w.id]?.submitted);

    return (
      <div className="mt-2 flex flex-col gap-4 p-4 rounded-xl border border-border bg-card">
        <div className="flex flex-col gap-1">
          <p className="text-sm font-bold text-primary">Trabajo cerrado ✓</p>
          <p className="text-xs text-secondary">
            {workers.length === 1
              ? "¿Querés calificar al trabajador?"
              : `¿Querés calificar a los ${workers.length} trabajadores aceptados?`}
          </p>
        </div>

        <div className="flex flex-col gap-4">
          {workers.map((worker) => {
            const ws = workerStates[worker.id];
            if (!ws) return null;
            return (
              <div key={worker.id} className="flex flex-col gap-3 pb-4 border-b border-border last:border-0 last:pb-0">
                <div className="flex items-center gap-2">
                  <Avatar name={worker.full_name} avatarUrl={worker.avatar_url} size="sm" />
                  <span className="text-sm font-semibold text-primary flex-1">{worker.full_name}</span>
                  {ws.submitted && (
                    <span className="text-xs text-emerald-600 font-semibold">Calificado ✓</span>
                  )}
                </div>

                {!ws.submitted && (
                  <>
                    <div className="flex flex-col gap-1">
                      <p className="text-xs text-secondary">¿Cómo calificás su trabajo?</p>
                      <StarRating value={ws.score} interactive onChange={(s) => setWorkerScore(worker.id, s)} size="md" />
                    </div>
                    <textarea
                      value={ws.comment}
                      onChange={(e) => setWorkerComment(worker.id, e.target.value)}
                      placeholder="Comentario opcional..."
                      rows={2}
                      maxLength={300}
                      className="w-full px-3 py-2 rounded-md border border-border bg-surface text-sm text-primary placeholder:text-tertiary focus:outline-none focus:border-brand resize-none"
                    />
                    {ws.error && <p className="text-xs text-red-600">{ws.error}</p>}
                    <button
                      type="button"
                      disabled={ws.score === 0 || ws.submitting}
                      onClick={() => handleRateWorker(worker)}
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

        <button
          type="button"
          onClick={() => setState("done")}
          className="h-9 rounded-md border border-border text-xs font-semibold text-secondary hover:text-primary transition-colors"
        >
          {allDone ? "Listo" : "Omitir"}
        </button>
      </div>
    );
  }

  // ── confirming ──
  if (state === "confirming") {
    return (
      <div className="mt-1 flex gap-2">
        <button
          onClick={handleClose}
          disabled={isPending}
          className="flex-1 h-9 rounded-md border border-red-200 bg-red-50 text-xs font-semibold text-red-600 transition-colors hover:bg-red-100 disabled:opacity-50"
        >
          {isPending ? "Cerrando..." : "Sí, cerrar"}
        </button>
        <button
          onClick={() => setState("idle")}
          disabled={isPending}
          className="flex-1 h-9 rounded-md border border-border text-xs font-semibold text-secondary transition-colors hover:text-primary"
        >
          Cancelar
        </button>
      </div>
    );
  }

  // ── idle ──
  return (
    <button
      onClick={() => setState("confirming")}
      className="w-full mt-1 h-9 rounded-md border border-border text-xs font-semibold text-secondary transition-colors duration-150 hover:border-red-200 hover:text-red-600"
    >
      Cerrar trabajo
    </button>
  );
}
