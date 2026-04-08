"use client";

import { useState, useTransition } from "react";
import { closeJob } from "@/app/actions";

export default function CloseJobButton({ jobId }: { jobId: number }) {
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleClose() {
    startTransition(async () => {
      await closeJob(jobId);
      setConfirming(false);
    });
  }

  if (confirming) {
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
          onClick={() => setConfirming(false)}
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
      onClick={() => setConfirming(true)}
      className="w-full mt-1 h-9 rounded-md border border-border text-xs font-semibold text-secondary transition-colors duration-150 hover:border-red-200 hover:text-red-600"
    >
      Cerrar trabajo
    </button>
  );
}
