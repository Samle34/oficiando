"use client";

import { useEffect } from "react";
import Button from "@/components/ui/Button";

export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex-1 max-w-lg mx-auto w-full px-4 pb-24 pt-20 flex flex-col items-center gap-4 text-center">
        <span className="text-5xl">⚠️</span>
        <div className="flex flex-col gap-2">
          <h1 className="text-xl font-bold text-primary">Algo salió mal</h1>
          <p className="text-sm text-secondary max-w-xs leading-relaxed">
            Ocurrió un error inesperado. Podés intentar de nuevo o volver al inicio.
          </p>
        </div>
        <div className="flex flex-col gap-3 w-full max-w-xs mt-2">
          <Button variant="brand" fullWidth onClick={unstable_retry}>
            Intentar de nuevo
          </Button>
          <Button variant="outline" fullWidth>
            <a href="/" className="contents">Volver al inicio</a>
          </Button>
        </div>
    </main>
  );
}
