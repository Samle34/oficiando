"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import CategoryTag from "@/components/ui/CategoryTag";
import Avatar from "@/components/ui/Avatar";
import { getCategory } from "@/lib/categories";
import { applyToJob } from "@/app/actions";
import type { Job } from "@/lib/jobs";

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "ahora";
  if (mins < 60) return `hace ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `hace ${hrs} h`;
  return `hace ${Math.floor(hrs / 24)} d`;
}

interface Props {
  job: Job;
  isWorker: boolean;
  hasApplied: boolean;
  isOwner: boolean;
}

export default function DetalleClient({ job, isWorker, hasApplied: initialHasApplied, isOwner }: Props) {
  const defaultMsg = job.client_name
    ? `Hola ${job.client_name.split(" ")[0]}, vi tu publicación en Oficiando sobre "${job.title}". ¿Seguís buscando a alguien?`
    : `Hola, vi tu publicación en Oficiando sobre "${job.title}". ¿Seguís buscando a alguien?`;

  const [mensaje, setMensaje] = useState(defaultMsg);
  const [aplicado, setAplicado] = useState(initialHasApplied);
  const [isPending, startTransition] = useTransition();

  const cat = getCategory(job.category_id);
  const waUrl = job.client_phone
    ? `https://wa.me/54${job.client_phone}?text=${encodeURIComponent(mensaje)}`
    : null;
  const isClosed = job.status === "cerrado";

  function handleApply() {
    if (isWorker) {
      startTransition(async () => {
        await applyToJob(job.id);
        setAplicado(true);
      });
    } else {
      setAplicado(true);
    }
  }

  return (
    <>
      <main className={[
        "flex-1 max-w-lg mx-auto w-full px-4 pt-6 flex flex-col gap-6",
        !isClosed && !isOwner ? "pb-36" : "pb-8",
      ].join(" ")}>

        <Link href="/trabajos" className="text-sm text-brand font-medium w-fit">
          ← Volver a trabajos
        </Link>

        <div
          className="bg-card rounded-lg border border-border border-l-[3px] px-5 py-5 flex flex-col gap-4"
          style={{ borderLeftColor: cat.color }}
        >
          <h1 className="text-lg font-bold text-primary leading-snug">
            {job.title}
          </h1>

          <div className="flex items-center gap-3 flex-wrap">
            <CategoryTag categoryId={job.category_id} />
            <span className="text-sm text-secondary">{job.city}</span>
            <span className="text-sm text-tertiary">{relativeTime(job.posted_at)}</span>
          </div>

          {job.photos?.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-5 px-5">
              {job.photos.map((url, i) => (
                <div key={i} className="w-32 h-24 shrink-0 rounded-md overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}

          {isClosed && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-red-50 border border-red-100">
              <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
              <p className="text-sm font-semibold text-red-600">
                Este trabajo está cerrado — ya no acepta postulaciones
              </p>
            </div>
          )}

          {job.description && (
            <p className="text-sm text-secondary leading-relaxed">
              {job.description}
            </p>
          )}

          {job.client_name && (
            <div className="flex items-center gap-3 pt-2 border-t border-border">
              <Avatar name={job.client_name} size="md" />
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-primary">{job.client_name}</span>
                <span className="text-xs text-tertiary">Cliente</span>
              </div>
            </div>
          )}
        </div>

        {!isClosed && isOwner && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-orange-50 border border-orange-100">
            <span className="text-sm font-semibold text-brand">Esta es tu publicación</span>
          </div>
        )}

        {!isClosed && isWorker && (
          !aplicado ? (
            <div className="flex flex-col gap-2">
              <label htmlFor="mensaje" className="text-sm font-semibold text-primary">
                Tu mensaje
              </label>
              <textarea
                id="mensaje"
                value={mensaje}
                onChange={(e) => setMensaje(e.target.value)}
                rows={4}
                className={[
                  "w-full px-4 py-3 rounded-md resize-none",
                  "border border-border bg-card",
                  "text-sm text-primary placeholder:text-tertiary",
                  "focus:outline-none focus:border-brand",
                  "transition-colors duration-150",
                ].join(" ")}
              />
              <p className="text-xs text-tertiary">
                Este mensaje se enviará al cliente cuando toque el botón de WhatsApp
              </p>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-lg px-5 py-4 flex flex-col gap-2">
              <p className="text-sm font-semibold text-primary">¡Postulación enviada!</p>
              <p className="text-sm text-secondary">
                Abrí WhatsApp para hablar directamente con el cliente.
              </p>
            </div>
          )
        )}
      </main>

      {!isClosed && isWorker && (
        <div className="fixed bottom-16 inset-x-0 px-4 pb-4 pt-3 bg-gradient-to-t from-surface to-transparent">
          <div className="max-w-lg mx-auto">
            {!aplicado ? (
              <Button variant="brand" fullWidth disabled={isPending} onClick={handleApply}>
                {isPending ? "Guardando..." : "Quiero este trabajo"}
              </Button>
            ) : waUrl ? (
              <a href={waUrl} target="_blank" rel="noopener noreferrer" className="block">
                <Button variant="whatsapp" fullWidth>
                  <span>💬</span> Hablar por WhatsApp
                </Button>
              </a>
            ) : (
              <Button variant="outline" fullWidth disabled>
                El cliente no agregó su número de WhatsApp
              </Button>
            )}
          </div>
        </div>
      )}

      {!isClosed && !isWorker && !isOwner && (
        <div className="fixed bottom-16 inset-x-0 px-4 pb-4 pt-3 bg-gradient-to-t from-surface to-transparent">
          <div className="max-w-lg mx-auto">
            <Button variant="whatsapp" fullWidth disabled>
              Iniciá sesión como trabajador para postularte
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
