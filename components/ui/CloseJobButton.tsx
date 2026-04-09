"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { closeJob, searchWorkers, rateWorker, type WorkerCandidate } from "@/app/actions";
import Avatar from "@/components/ui/Avatar";
import StarRating from "@/components/ui/StarRating";

type CloseState = "idle" | "confirming" | "closing" | "rating" | "done";

export default function CloseJobButton({ jobId }: { jobId: number }) {
  const [state, setState] = useState<CloseState>("idle");
  const [isPending, startTransition] = useTransition();

  // Rating state
  const [workerQuery, setWorkerQuery] = useState("");
  const [candidates, setCandidates] = useState<WorkerCandidate[]>([]);
  const [selectedWorker, setSelectedWorker] = useState<WorkerCandidate | null>(null);
  const [score, setScore] = useState(0);
  const [comment, setComment] = useState("");
  const [ratingError, setRatingError] = useState<string | null>(null);
  const [isSearching, startSearch] = useTransition();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced worker search
  useEffect(() => {
    if (workerQuery.length < 2) {
      setCandidates([]);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      startSearch(async () => {
        const results = await searchWorkers(workerQuery);
        setCandidates(results);
      });
    }, 400);
  }, [workerQuery]);

  function handleClose() {
    startTransition(async () => {
      setState("closing");
      const result = await closeJob(jobId);
      if (result.status === "success") {
        setState("rating");
      } else {
        setState("idle");
      }
    });
  }

  function handleRate() {
    if (!selectedWorker || score === 0) return;
    setRatingError(null);
    startTransition(async () => {
      const result = await rateWorker({
        jobId,
        workerId: selectedWorker.id,
        score,
        comment,
      });
      if (result.status === "error") {
        setRatingError(result.message);
      } else {
        setState("done");
      }
    });
  }

  if (state === "done") {
    return (
      <p className="text-xs text-emerald-600 font-medium mt-1 text-center">
        ✓ Trabajo cerrado y calificación enviada
      </p>
    );
  }

  if (state === "closing") {
    return <p className="text-xs text-tertiary mt-1 text-center">Cerrando...</p>;
  }

  if (state === "rating") {
    return (
      <div className="mt-2 flex flex-col gap-4 p-4 rounded-xl border border-border bg-card">
        <div className="flex flex-col gap-1">
          <p className="text-sm font-bold text-primary">Trabajo cerrado ✓</p>
          <p className="text-xs text-secondary">¿Querés calificar al trabajador que lo realizó?</p>
        </div>

        {/* Worker search */}
        {!selectedWorker ? (
          <div className="flex flex-col gap-2">
            <input
              type="text"
              value={workerQuery}
              onChange={(e) => {
                setWorkerQuery(e.target.value);
                setSelectedWorker(null);
              }}
              placeholder="Buscá al trabajador por nombre..."
              className="w-full h-10 px-3 rounded-md border border-border bg-surface text-sm text-primary placeholder:text-tertiary focus:outline-none focus:border-brand"
            />
            {isSearching && <p className="text-xs text-tertiary">Buscando...</p>}
            {candidates.length > 0 && (
              <div className="flex flex-col gap-1">
                {candidates.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setSelectedWorker(c);
                      setCandidates([]);
                      setWorkerQuery(c.full_name);
                    }}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-card text-left hover:border-brand transition-colors"
                  >
                    <Avatar name={c.full_name} avatarUrl={c.avatar_url} size="sm" />
                    <span className="text-sm text-primary">{c.full_name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Avatar name={selectedWorker.full_name} avatarUrl={selectedWorker.avatar_url} size="sm" />
              <span className="text-sm font-semibold text-primary">{selectedWorker.full_name}</span>
              <button
                type="button"
                onClick={() => { setSelectedWorker(null); setWorkerQuery(""); setScore(0); }}
                className="ml-auto text-xs text-tertiary"
              >
                Cambiar
              </button>
            </div>

            <div className="flex flex-col gap-1">
              <p className="text-xs text-secondary">¿Cómo calificás su trabajo?</p>
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
          </div>
        )}

        {ratingError && <p className="text-xs text-red-600">{ratingError}</p>}

        <div className="flex gap-2">
          {selectedWorker && score > 0 && (
            <button
              type="button"
              disabled={isPending}
              onClick={handleRate}
              className="flex-1 h-9 rounded-md text-xs font-semibold text-white disabled:opacity-50"
              style={{ backgroundColor: "#e8622a" }}
            >
              {isPending ? "Enviando..." : "Calificar"}
            </button>
          )}
          <button
            type="button"
            disabled={isPending}
            onClick={() => setState("done")}
            className="flex-1 h-9 rounded-md border border-border text-xs font-semibold text-secondary hover:text-primary transition-colors"
          >
            Omitir
          </button>
        </div>
      </div>
    );
  }

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

  return (
    <button
      onClick={() => setState("confirming")}
      className="w-full mt-1 h-9 rounded-md border border-border text-xs font-semibold text-secondary transition-colors duration-150 hover:border-red-200 hover:text-red-600"
    >
      Cerrar trabajo
    </button>
  );
}
