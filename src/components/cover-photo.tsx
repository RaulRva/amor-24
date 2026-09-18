"use client";

import { useRef, useState } from "react";
import { useCouple } from "@/components/couple-context";
import { albumPublicUrl, uploadCoupleCover } from "@/lib/cover";

export function CoverPhoto({ compact = false }: { compact?: boolean }) {
  const { couple, setCouple, profile, partner } = useCouple();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const src = albumPublicUrl(couple.cover_path);
  const names = partner ? `${profile.display_name} y ${partner.display_name}` : profile.display_name;

  async function onFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const path = await uploadCoupleCover(couple.id, file, couple.cover_path);
      setCouple({ ...couple, cover_path: path });
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se ha podido subir.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div>
      <label className={`relative block overflow-hidden rounded-[1.25rem] border border-[var(--line)] bg-paper-2 ${compact ? "" : "shadow-[var(--shadow)]"}`}>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="absolute inset-0 z-10 cursor-pointer opacity-0"
          disabled={busy}
          onChange={(event) => onFile(event.target.files?.[0])}
        />
        {src ? (
          <img src={src} alt={names} className={compact ? "aspect-[4/5] w-full object-cover" : "home-cover"} />
        ) : (
          <div className={`grid place-items-center px-6 text-center ${compact ? "aspect-[4/5]" : "home-cover"}`}>
            <div>
              <p className="font-serif text-2xl">Vuestra foto</p>
              <p className="mt-2 text-sm text-ink-soft">Subid una imagen de los dos para la portada.</p>
            </div>
          </div>
        )}
        <span className="pointer-events-none absolute bottom-3 left-3 rounded-full bg-ink/80 px-3 py-1.5 text-xs text-paper">
          {busy ? "Subiendo…" : src ? "Cambiar foto" : "Subir foto"}
        </span>
      </label>
      {error ? <p className="mt-2 text-sm text-rose">{error}</p> : null}
    </div>
  );
}
