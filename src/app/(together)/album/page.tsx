"use client";

import { useEffect, useState } from "react";
import { useCouple } from "@/components/couple-context";
import { Button, Card, Empty, Field, Input, PageHeader, Textarea } from "@/components/ui";
import { formatDay } from "@/lib/dates";
import { createClient } from "@/lib/supabase/client";
import type { Memory } from "@/lib/types";

export default function AlbumPage() {
  const { couple, profile } = useCouple();
  const [items, setItems] = useState<Memory[]>([]);
  const [title, setTitle] = useState("");
  const [happenedOn, setHappenedOn] = useState("");
  const [note, setNote] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function load() {
    const supabase = createClient();
    const { data } = await supabase
      .from("memories")
      .select("*")
      .eq("couple_id", couple.id)
      .order("happened_on", { ascending: false });
    setItems((data as Memory[]) ?? []);
  }

  useEffect(() => {
    load();
  }, [couple.id]);

  function photoUrl(path: string | null) {
    if (!path) return null;
    const supabase = createClient();
    return supabase.storage.from("album").getPublicUrl(path).data.publicUrl;
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    const supabase = createClient();
    let photo_path: string | null = null;
    if (file) {
      photo_path = `${couple.id}/${crypto.randomUUID()}-${file.name}`;
      const { error } = await supabase.storage.from("album").upload(photo_path, file);
      if (error) {
        setBusy(false);
        return;
      }
    }
    await supabase.from("memories").insert({
      couple_id: couple.id,
      created_by: profile.id,
      title,
      happened_on: happenedOn,
      note: note || null,
      photo_path,
    });
    setTitle("");
    setHappenedOn("");
    setNote("");
    setFile(null);
    setOpen(false);
    setBusy(false);
    load();
  }

  async function remove(item: Memory) {
    if (!window.confirm("¿Borrar este recuerdo y su foto?")) return;
    setBusy(true);
    const supabase = createClient();
    if (item.photo_path) {
      await supabase.storage.from("album").remove([item.photo_path]);
    }
    await supabase.from("memories").delete().eq("id", item.id);
    setBusy(false);
    load();
  }

  return (
    <div>
      <PageHeader kicker="fechas vuestras" title="Álbum" copy="No todas las fotos. Solo las que marcan un día." />
      <Button className="mb-5" onClick={() => setOpen((v) => !v)}>
        {open ? "Cerrar" : "Añadir fecha"}
      </Button>
      {open ? (
        <Card className="mb-5">
          <form onSubmit={save} className="grid gap-4">
            <Field label="Título">
              <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
            </Field>
            <Field label="Fecha">
              <Input type="date" value={happenedOn} onChange={(e) => setHappenedOn(e.target.value)} required />
            </Field>
            <Field label="Nota">
              <Textarea value={note} onChange={(e) => setNote(e.target.value)} />
            </Field>
            <Field label="Foto">
              <Input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            </Field>
            <Button type="submit" disabled={busy}>
              {busy ? "Guardando…" : "Guardar"}
            </Button>
          </form>
        </Card>
      ) : null}
      <div className="grid gap-4">
        {items.length === 0 ? <Empty>El álbum está en blanco. El primer día puede ser cualquiera.</Empty> : null}
        {items.map((item) => {
          const src = photoUrl(item.photo_path);
          return (
            <Card key={item.id} className="overflow-hidden" padded={false}>
              {src ? (
                <img src={src} alt={item.title} className="aspect-[4/5] w-full object-cover" />
              ) : null}
              <div className="p-5">
                <p className="text-xs text-ink-soft">{formatDay(item.happened_on)}</p>
                <p className="font-serif text-2xl">{item.title}</p>
                {item.note ? <p className="mt-2 text-ink-soft">{item.note}</p> : null}
                <button
                  className="mt-4 text-sm text-rose"
                  onClick={() => remove(item)}
                  disabled={busy}
                >
                  Borrar
                </button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
