"use client";

import { useRef, useState } from "react";
import { uploadFile, generateFileName, type StorageBucket } from "@/lib/storage";
import { createBrowserSupabaseClient } from "@/lib/supabase";

interface PhotoUploadProps {
  bucket: StorageBucket;
  pathPrefix: string; // e.g. "{userId}/" or "{userId}/pending/"
  maxPhotos?: number;
  onPhotosChange: (urls: string[]) => void;
  initialUrls?: string[];
}

export default function PhotoUpload({
  bucket,
  pathPrefix,
  maxPhotos = 3,
  onPhotosChange,
  initialUrls = [],
}: PhotoUploadProps) {
  const [urls, setUrls] = useState<string[]>(initialUrls);
  const [loading, setLoading] = useState<boolean[]>(
    new Array(maxPhotos).fill(false)
  );
  const inputRef = useRef<HTMLInputElement>(null);

  async function getUserId(): Promise<string | null> {
    const supabase = createBrowserSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id ?? null;
  }

  async function handleFiles(files: FileList | null) {
    if (!files) return;

    const userId = await getUserId();
    if (!userId) return;

    const available = maxPhotos - urls.length;
    const toUpload = Array.from(files).slice(0, available);

    const newLoadingIdx = urls.length;
    setLoading((prev) => {
      const next = [...prev];
      toUpload.forEach((_, i) => { next[newLoadingIdx + i] = true; });
      return next;
    });

    const newUrls = [...urls];
    for (let i = 0; i < toUpload.length; i++) {
      const file = toUpload[i];
      const fileName = generateFileName(userId, file);
      const path = `${pathPrefix}${fileName}`;
      try {
        const url = await uploadFile(bucket, path, file);
        newUrls.push(url);
      } catch {
        // skip failed uploads silently
      } finally {
        setLoading((prev) => {
          const next = [...prev];
          next[newLoadingIdx + i] = false;
          return next;
        });
      }
    }

    setUrls(newUrls);
    onPhotosChange(newUrls);
  }

  function removePhoto(idx: number) {
    const next = urls.filter((_, i) => i !== idx);
    setUrls(next);
    onPhotosChange(next);
  }

  const slots = Array.from({ length: maxPhotos });

  return (
    <div className="flex gap-3 flex-wrap">
      {slots.map((_, slotIdx) => {
        const url = urls[slotIdx];
        const isLoading = loading[slotIdx];

        if (url) {
          return (
            <div
              key={slotIdx}
              className="relative w-24 h-24 rounded-lg overflow-hidden border border-border"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt={`Foto ${slotIdx + 1}`} className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removePhoto(slotIdx)}
                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white text-xs flex items-center justify-center"
                aria-label="Eliminar foto"
              >
                ×
              </button>
            </div>
          );
        }

        if (isLoading) {
          return (
            <div
              key={slotIdx}
              className="w-24 h-24 rounded-lg border border-border flex items-center justify-center bg-surface"
            >
              <span className="text-tertiary text-xs">...</span>
            </div>
          );
        }

        if (slotIdx === urls.length) {
          return (
            <button
              key={slotIdx}
              type="button"
              onClick={() => inputRef.current?.click()}
              className="w-24 h-24 rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 text-tertiary hover:border-brand hover:text-brand transition-colors"
              aria-label="Agregar foto"
            >
              <span className="text-2xl leading-none">+</span>
              <span className="text-xs">Foto</span>
            </button>
          );
        }

        return (
          <div
            key={slotIdx}
            className="w-24 h-24 rounded-lg border-2 border-dashed border-border bg-surface"
          />
        );
      })}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
}
