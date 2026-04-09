"use client";

import { useRef, useState } from "react";
import Avatar from "@/components/ui/Avatar";
import { uploadFile } from "@/lib/storage";
import { createBrowserSupabaseClient } from "@/lib/supabase";
import { updateProfile } from "@/app/auth/actions";

interface AvatarUploadProps {
  name: string;
  avatarUrl: string | null;
}

export default function AvatarUpload({ name, avatarUrl }: AvatarUploadProps) {
  const [currentUrl, setCurrentUrl] = useState(avatarUrl);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setUploading(true);
    try {
      const supabase = createBrowserSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fixed path per user — upsert overwrites previous avatar
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
      const path = `${user.id}/avatar.${ext}`;
      const url = await uploadFile("avatars", path, file, true);

      setCurrentUrl(url);
      await updateProfile({ avatar_url: url });
    } catch {
      // silent — user can retry
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        <Avatar name={name} avatarUrl={currentUrl} size="lg" />
        {uploading && (
          <span className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
            <span className="text-white text-xs">...</span>
          </span>
        )}
      </div>
      <button
        type="button"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
        className="text-xs text-brand font-medium disabled:opacity-50"
      >
        {uploading ? "Subiendo..." : "Cambiar foto"}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
    </div>
  );
}
