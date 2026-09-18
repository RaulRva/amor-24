"use client";

import { useEffect, useState } from "react";
import { CoverPhoto } from "@/components/cover-photo";
import { useCouple } from "@/components/couple-context";
import { Button, Card, PageHeader } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import {
  applyTheme,
  parseTheme,
  THEME_FIELDS,
  THEME_PRESETS,
  type AppTheme,
} from "@/lib/theme";

export default function AjustesPage() {
  const { couple, setCouple } = useCouple();
  const saved = parseTheme(couple.theme);
  const [draft, setDraft] = useState<AppTheme>(saved);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    setDraft(parseTheme(couple.theme));
  }, [couple.theme]);

  useEffect(() => {
    applyTheme(draft);
  }, [draft]);

  useEffect(() => {
    return () => applyTheme(parseTheme(couple.theme));
  }, [couple.theme]);

  async function saveTheme(theme: AppTheme) {
    setBusy(true);
    setNote(null);
    const supabase = createClient();
    const { error } = await supabase.from("couples").update({ theme }).eq("id", couple.id);
    if (error) {
      setNote("No se han podido guardar los colores.");
      setBusy(false);
      return;
    }
    setCouple({ ...couple, theme });
    setNote("Colores guardados.");
    setBusy(false);
  }

  return (
    <div>
      <PageHeader
        kicker="lo vuestro"
        title="Ajustes"
        copy="Una foto para el inicio y los colores de toda la app."
      />

      <Card className="mb-5">
        <p className="text-[11px] tracking-[0.22em] text-rose uppercase">portada</p>
        <p className="mt-1 mb-4 text-sm text-ink-soft">Se ve arriba del todo en Hoy.</p>
        <CoverPhoto compact />
      </Card>

      <Card>
        <p className="text-[11px] tracking-[0.22em] text-rose uppercase">colores</p>
        <p className="mt-1 mb-4 text-sm text-ink-soft">Prueba y, cuando os guste, guardad.</p>
        <div className="mb-5 flex flex-wrap gap-2">
          {THEME_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => setDraft(preset.theme)}
              className="flex items-center gap-2 rounded-full border border-[var(--line)] px-3 py-2 text-sm"
              style={{ background: preset.theme.paper2, color: preset.theme.ink }}
            >
              <span className="h-3.5 w-3.5 rounded-full" style={{ background: preset.theme.rose }} />
              {preset.label}
            </button>
          ))}
        </div>
        <div className="grid gap-3">
          {THEME_FIELDS.map((field) => (
            <label key={field.key} className="flex items-center justify-between gap-3">
              <span className="text-sm text-ink-soft">{field.label}</span>
              <span className="flex items-center gap-2">
                <span className="text-xs text-ink-soft">{draft[field.key]}</span>
                <input
                  type="color"
                  className="color-swatch"
                  value={draft[field.key]}
                  onChange={(event) => setDraft({ ...draft, [field.key]: event.target.value })}
                  aria-label={field.label}
                />
              </span>
            </label>
          ))}
        </div>
        {note ? <p className="mt-4 text-sm text-ink-soft">{note}</p> : null}
        <div className="mt-5 grid grid-cols-2 gap-2">
          <Button type="button" tone="ghost" disabled={busy} onClick={() => setDraft(parseTheme(couple.theme))}>
            Deshacer
          </Button>
          <Button type="button" disabled={busy} onClick={() => saveTheme(draft)}>
            {busy ? "Guardando…" : "Guardar"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
