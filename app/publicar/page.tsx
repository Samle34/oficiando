"use client";

import { useState, useTransition } from "react";
import Button from "@/components/ui/Button";
import PhotoUpload from "@/components/ui/PhotoUpload";
import { CATEGORIES, type CategoryId } from "@/lib/categories";
import { publicarTrabajo } from "@/app/actions";
import { createBrowserSupabaseClient } from "@/lib/supabase";

type Step = "categoria" | "detalle" | "fotos" | "exito";

export default function PublicarPage() {
  const [step, setStep] = useState<Step>("categoria");
  const [categoryId, setCategoryId] = useState<CategoryId | null>(null);
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [provincia, setProvincia] = useState("");
  const [ciudad, setCiudad] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const selectedCat = categoryId
    ? CATEGORIES.find((c) => c.id === categoryId)
    : null;

  const canSubmit = titulo.trim() && provincia.trim() && ciudad.trim();

  async function goToFotos() {
    if (!canSubmit || !categoryId) return;
    // Fetch userId for storage path (lazy)
    if (!userId) {
      const supabase = createBrowserSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserId(user.id);
    }
    setError(null);
    setStep("fotos");
  }

  function handlePublicar(photosToSave: string[]) {
    if (!canSubmit || !categoryId) return;
    setError(null);

    startTransition(async () => {
      const result = await publicarTrabajo({
        title: titulo,
        description: descripcion || undefined,
        category_id: categoryId,
        province: provincia,
        city: ciudad,
        photos: photosToSave,
      });

      if (result.status === "error") {
        setError(result.message);
        setStep("detalle");
      } else {
        setStep("exito");
      }
    });
  }

  function resetForm() {
    setCategoryId(null);
    setTitulo("");
    setDescripcion("");
    setProvincia("");
    setCiudad("");
    setPhotos([]);
    setError(null);
    setStep("categoria");
  }

  const inputClass = [
    "w-full h-11 px-4 rounded-md",
    "border border-border bg-card",
    "text-sm text-primary placeholder:text-tertiary",
    "focus:outline-none focus:border-brand",
    "transition-colors duration-150",
  ].join(" ");

  return (
    <>
      <main className="flex-1 max-w-lg mx-auto w-full px-4 pb-32 pt-6 flex flex-col gap-6">

        {/* ── Paso 1: Categoría ─── */}
        {step === "categoria" && (
          <>
            <div className="flex flex-col gap-1">
              <h1 className="text-xl font-bold text-primary">¿Qué tipo de trabajo es?</h1>
              <p className="text-sm text-secondary">Elegí la categoría</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setCategoryId(cat.id);
                    setStep("detalle");
                  }}
                  className={[
                    "flex items-center gap-3 rounded-lg border px-4 py-4",
                    "text-left transition-all duration-150",
                    "active:scale-[0.97]",
                    "border-border bg-card hover:border-[rgba(232,98,42,0.3)]",
                  ].join(" ")}
                  style={{ borderLeftWidth: "3px", borderLeftColor: cat.color }}
                >
                  <span className="text-2xl" aria-hidden="true">{cat.icon}</span>
                  <span className="text-sm font-semibold text-primary">{cat.label}</span>
                </button>
              ))}
            </div>
          </>
        )}

        {/* ── Paso 2: Detalle ─── */}
        {step === "detalle" && selectedCat && (
          <>
            <div className="flex flex-col gap-1">
              <button
                onClick={() => setStep("categoria")}
                className="text-sm text-brand font-medium mb-1 text-left w-fit"
              >
                ← Cambiar categoría
              </button>
              <div className="flex items-center gap-2">
                <span className="text-2xl">{selectedCat.icon}</span>
                <h1 className="text-xl font-bold text-primary">{selectedCat.label}</h1>
              </div>
              <p className="text-sm text-secondary">Contanos qué necesitás</p>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label htmlFor="titulo" className="text-sm font-semibold text-primary">
                  ¿Qué necesitás?
                </label>
                <input
                  id="titulo"
                  type="text"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Ej: Arreglar canilla que gotea en el baño"
                  maxLength={120}
                  className={inputClass}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="descripcion" className="text-sm font-semibold text-primary">
                  Descripción{" "}
                  <span className="text-tertiary font-normal">(opcional)</span>
                </label>
                <textarea
                  id="descripcion"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Más detalles sobre el trabajo: materiales, urgencia, acceso, etc."
                  rows={3}
                  maxLength={500}
                  className={[
                    "w-full px-4 py-3 rounded-md resize-none",
                    "border border-border bg-card",
                    "text-sm text-primary placeholder:text-tertiary",
                    "focus:outline-none focus:border-brand",
                    "transition-colors duration-150",
                  ].join(" ")}
                />
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-sm font-semibold text-primary">¿Dónde es el trabajo?</span>
                <div className="flex gap-3">
                  <div className="flex flex-col gap-1 flex-1">
                    <label htmlFor="provincia" className="text-xs text-secondary">Provincia</label>
                    <input
                      id="provincia"
                      type="text"
                      value={provincia}
                      onChange={(e) => setProvincia(e.target.value)}
                      placeholder="Ej: Buenos Aires"
                      className={inputClass}
                    />
                  </div>
                  <div className="flex flex-col gap-1 flex-1">
                    <label htmlFor="ciudad" className="text-xs text-secondary">Ciudad / Localidad</label>
                    <input
                      id="ciudad"
                      type="text"
                      value={ciudad}
                      onChange={(e) => setCiudad(e.target.value)}
                      placeholder="Ej: Palermo"
                      className={inputClass}
                    />
                  </div>
                </div>
              </div>

              {error && <p className="text-sm text-red-600 font-medium">{error}</p>}
            </div>
          </>
        )}

        {/* ── Paso 3: Fotos (opcional) ─── */}
        {step === "fotos" && (
          <>
            <div className="flex flex-col gap-1">
              <button
                onClick={() => setStep("detalle")}
                className="text-sm text-brand font-medium mb-1 text-left w-fit"
              >
                ← Volver
              </button>
              <h1 className="text-xl font-bold text-primary">¿Tenés fotos del trabajo?</h1>
              <p className="text-sm text-secondary leading-relaxed">
                Agregar fotos ayuda a los trabajadores a entender mejor qué necesitás. Es opcional.
              </p>
            </div>

            {userId ? (
              <PhotoUpload
                bucket="job-photos"
                pathPrefix={`${userId}/pending/`}
                maxPhotos={3}
                onPhotosChange={setPhotos}
              />
            ) : (
              <p className="text-sm text-tertiary">
                Iniciá sesión para subir fotos.
              </p>
            )}

            <div className="flex flex-col gap-3 pt-2">
              <Button
                variant="brand"
                fullWidth
                disabled={isPending}
                onClick={() => handlePublicar(photos)}
              >
                {isPending ? "Publicando..." : photos.length > 0 ? "Publicar con fotos" : "Publicar sin fotos"}
              </Button>
              <Button
                variant="outline"
                fullWidth
                disabled={isPending}
                onClick={() => handlePublicar([])}
              >
                Omitir fotos
              </Button>
            </div>
          </>
        )}

        {/* ── Paso 4: Éxito ─── */}
        {step === "exito" && (
          <div className="flex flex-col items-center gap-6 text-center py-10">
            <span className="text-5xl">✅</span>
            <div className="flex flex-col gap-2">
              <h1 className="text-xl font-bold text-primary">¡Trabajo publicado!</h1>
              <p className="text-sm text-secondary leading-relaxed max-w-xs">
                Los trabajadores de tu zona van a poder ver tu publicación y contactarte.
              </p>
            </div>
            <Button variant="outline" onClick={resetForm}>
              Publicar otro trabajo
            </Button>
          </div>
        )}
      </main>

      {step === "detalle" && (
        <div className="fixed bottom-16 inset-x-0 px-4 pb-4 pt-3 bg-gradient-to-t from-surface to-transparent">
          <div className="max-w-lg mx-auto">
            <Button
              variant="brand"
              fullWidth
              disabled={!canSubmit || isPending}
              onClick={goToFotos}
            >
              Continuar
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
