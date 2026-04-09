"use client";

import { useState, useTransition } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase";
import PhotoUpload from "@/components/ui/PhotoUpload";
import { addPortfolioItem, deletePortfolioItem } from "@/app/actions";
import type { PortfolioItem } from "@/lib/profiles";

interface PortfolioManagerProps {
  initialItems: PortfolioItem[];
}

export default function PortfolioManager({ initialItems }: PortfolioManagerProps) {
  const [items, setItems] = useState<PortfolioItem[]>(initialItems);
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newPhotos, setNewPhotos] = useState<string[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function openForm() {
    if (!userId) {
      const supabase = createBrowserSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id ?? null);
    }
    setAdding(true);
    setError(null);
    setNewTitle("");
    setNewDesc("");
    setNewPhotos([]);
  }

  function handleAdd() {
    setError(null);
    startTransition(async () => {
      const result = await addPortfolioItem({
        title: newTitle,
        description: newDesc,
        photos: newPhotos,
      });
      if (result.error) {
        setError(result.error);
      } else if (result.item) {
        setItems((prev) => [result.item!, ...prev]);
        setAdding(false);
      }
    });
  }

  function handleDelete(itemId: number) {
    startTransition(async () => {
      const result = await deletePortfolioItem(itemId);
      if (!result.error) {
        setItems((prev) => prev.filter((i) => i.id !== itemId));
      }
    });
  }

  const atLimit = items.length >= 10;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-primary">Portfolio ({items.length}/10)</h3>
        {!atLimit && !adding && (
          <button
            type="button"
            onClick={openForm}
            className="text-sm text-brand font-medium"
          >
            + Agregar trabajo
          </button>
        )}
      </div>

      {/* Add form */}
      {adding && (
        <div className="flex flex-col gap-4 p-4 rounded-xl border border-border bg-card">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Título del trabajo"
            maxLength={80}
            className="w-full h-11 px-4 rounded-md border border-border bg-surface text-sm text-primary placeholder:text-tertiary focus:outline-none focus:border-brand"
          />
          <textarea
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            placeholder="Descripción (opcional)"
            rows={3}
            maxLength={300}
            className="w-full px-4 py-3 rounded-md border border-border bg-surface text-sm text-primary placeholder:text-tertiary focus:outline-none focus:border-brand resize-none"
          />
          {userId && (
            <PhotoUpload
              bucket="portfolio"
              pathPrefix={`${userId}/`}
              maxPhotos={3}
              onPhotosChange={setNewPhotos}
            />
          )}
          {error && <p className="text-sm text-red-600 font-medium">{error}</p>}
          <div className="flex gap-3">
            <button
              type="button"
              disabled={!newTitle.trim() || isPending}
              onClick={handleAdd}
              className="flex-1 h-10 rounded-md text-sm font-semibold text-white disabled:opacity-50"
              style={{ backgroundColor: "#e8622a" }}
            >
              {isPending ? "Guardando..." : "Guardar"}
            </button>
            <button
              type="button"
              onClick={() => setAdding(false)}
              className="flex-1 h-10 rounded-md border border-border text-sm font-semibold text-secondary"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Items list */}
      {items.length === 0 && !adding && (
        <p className="text-sm text-tertiary">
          Todavía no tenés trabajos en tu portfolio. Agregá uno para mostrárselo a los clientes.
        </p>
      )}

      {items.map((item) => (
        <div key={item.id} className="flex flex-col gap-3 p-4 rounded-xl border border-border bg-card">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-semibold text-primary">{item.title}</p>
            <button
              type="button"
              disabled={isPending}
              onClick={() => handleDelete(item.id)}
              className="text-xs text-tertiary hover:text-red-500 shrink-0"
            >
              Eliminar
            </button>
          </div>
          {item.description && (
            <p className="text-xs text-secondary leading-relaxed">{item.description}</p>
          )}
          {item.photos.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {item.photos.map((url, i) => (
                <div key={i} className="w-20 h-20 shrink-0 rounded-lg overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
