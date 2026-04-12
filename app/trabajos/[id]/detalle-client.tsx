"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import CategoryTag from "@/components/ui/CategoryTag";
import Avatar from "@/components/ui/Avatar";
import StarRating from "@/components/ui/StarRating";
import { getCategory } from "@/lib/categories";
import { applyToJob, acceptApplication } from "@/app/actions";
import type { Job } from "@/lib/jobs";
import { waUrl as buildWaUrl } from "@/lib/whatsapp";
import type { Applicant } from "./page";

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "ahora";
  if (mins < 60) return `hace ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `hace ${hrs} h`;
  return `hace ${Math.floor(hrs / 24)} d`;
}

function AcceptButton({ jobId, workerId }: { jobId: number; workerId: string }) {
  const [done, setDone] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (done) {
    return (
      <span className="text-xs font-semibold text-green-600 px-3 py-1.5 rounded-md bg-green-50 border border-green-200">
        Aceptado ✓
      </span>
    );
  }

  return (
    <button
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          await acceptApplication(jobId, workerId);
          setDone(true);
        })
      }
      className={[
        "text-xs font-semibold px-3 py-1.5 rounded-md border transition-colors duration-150",
        isPending
          ? "border-border text-tertiary"
          : "border-brand text-brand hover:bg-orange-50",
      ].join(" ")}
    >
      {isPending ? "Aceptando..." : "Aceptar"}
    </button>
  );
}

interface Props {
  job: Job;
  isWorker: boolean;
  applicationStatus: "pending" | "accepted" | null;
  applicationMessage: string | null;
  isOwner: boolean;
  applicants: Applicant[];
}

export default function DetalleClient({
  job,
  isWorker,
  applicationStatus,
  applicationMessage,
  isOwner,
  applicants,
}: Props) {
  const defaultMsg = job.client_name
    ? `Hola ${job.client_name.split(" ")[0]}, vi tu publicación en Oficiando sobre "${job.title}". ¿Seguís buscando a alguien?`
    : `Hola, vi tu publicación en Oficiando sobre "${job.title}". ¿Seguís buscando a alguien?`;

  const [mensaje, setMensaje] = useState(applicationMessage ?? defaultMsg);
  const [aplicado, setAplicado] = useState(applicationStatus !== null);
  const [isPending, startTransition] = useTransition();

  const cat = getCategory(job.category_id);
  const isClosed = job.status === "cerrado";

  // WhatsApp URL uses stored message (if accepted) or current textarea value
  const waMsg = applicationStatus === "accepted" ? (applicationMessage ?? defaultMsg) : mensaje;
  const waUrl = buildWaUrl(job.client_phone, waMsg);

  function handleApply() {
    startTransition(async () => {
      await applyToJob(job.id, mensaje !== defaultMsg ? mensaje : undefined);
      setAplicado(true);
    });
  }

  const showFixedBar = !isClosed && (isWorker || (!isWorker && !isOwner));

  return (
    <>
      <main className={[
        "flex-1 max-w-lg mx-auto w-full px-4 pt-6 flex flex-col gap-6",
        showFixedBar && !isOwner ? "pb-36" : "pb-8",
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

        {/* ── Owner: postulantes ── */}
        {isOwner && (
          <div className="flex flex-col gap-3">
            <h2 className="text-sm font-semibold text-secondary uppercase tracking-wide">
              Postulaciones ({applicants.length})
            </h2>

            {applicants.length === 0 ? (
              <p className="text-sm text-tertiary py-4 text-center">
                Aún no hay postulaciones
              </p>
            ) : (
              applicants.map((a) => (
                <div
                  key={a.worker_id}
                  className="bg-card border border-border rounded-lg px-4 py-4 flex flex-col gap-3"
                >
                  <div className="flex items-center gap-3">
                    <Avatar name={a.full_name} avatarUrl={a.avatar_url} size="md" />
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="text-sm font-semibold text-primary truncate">{a.full_name}</span>
                      {a.rating !== null && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <StarRating value={a.rating} size="sm" />
                          <span className="text-xs text-tertiary">{a.rating.toFixed(1)}</span>
                        </div>
                      )}
                    </div>
                    {a.status === "accepted" ? (
                      <span className="text-xs font-semibold text-green-600 px-3 py-1.5 rounded-md bg-green-50 border border-green-200 shrink-0">
                        Aceptado ✓
                      </span>
                    ) : (
                      <AcceptButton jobId={job.id} workerId={a.worker_id} />
                    )}
                  </div>

                  {a.categories.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {a.categories.slice(0, 3).map((c) => (
                        <CategoryTag key={c} categoryId={c} />
                      ))}
                    </div>
                  )}

                  <Link
                    href={`/trabajador/${a.worker_id}`}
                    className="text-xs font-semibold text-brand w-fit"
                  >
                    Ver perfil →
                  </Link>
                </div>
              ))
            )}
          </div>
        )}

        {/* ── Worker: estado de postulación ── */}
        {!isClosed && isWorker && (
          !aplicado ? (
            <div className="flex flex-col gap-2">
              <label htmlFor="mensaje" className="text-sm font-semibold text-primary">
                Tu mensaje <span className="text-tertiary font-normal">(opcional)</span>
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
                Si te aceptan, este mensaje se usará para contactar al cliente por WhatsApp
              </p>
            </div>
          ) : applicationStatus === "accepted" ? (
            <div className="bg-green-50 border border-green-200 rounded-lg px-5 py-4 flex flex-col gap-1">
              <p className="text-sm font-semibold text-green-700">¡Te aceptaron!</p>
              <p className="text-sm text-green-600">
                El cliente aceptó tu postulación. Contactalo por WhatsApp.
              </p>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-lg px-5 py-4 flex flex-col gap-1">
              <p className="text-sm font-semibold text-primary">¡Postulación enviada!</p>
              <p className="text-sm text-secondary">
                Esperá a que el cliente acepte tu postulación.
              </p>
            </div>
          )
        )}
      </main>

      {/* ── Barra fija worker ── */}
      {!isClosed && isWorker && (
        <div className="fixed bottom-16 inset-x-0 px-4 pb-4 pt-3 bg-gradient-to-t from-surface to-transparent">
          <div className="max-w-lg mx-auto">
            {!aplicado ? (
              <Button variant="brand" fullWidth disabled={isPending} onClick={handleApply}>
                {isPending ? "Guardando..." : "Quiero este trabajo"}
              </Button>
            ) : applicationStatus === "accepted" && waUrl ? (
              <a href={waUrl} target="_blank" rel="noopener noreferrer" className="block">
                <Button variant="whatsapp" fullWidth>
                  <span>💬</span> Contactar por WhatsApp
                </Button>
              </a>
            ) : applicationStatus === "accepted" && !waUrl ? (
              <Button variant="outline" fullWidth disabled>
                El cliente no agregó su número de WhatsApp
              </Button>
            ) : null}
          </div>
        </div>
      )}

      {/* ── Barra fija guest/client ── */}
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
