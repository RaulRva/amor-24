"use client";

import { useEffect, useState } from "react";
import { useCouple } from "@/components/couple-context";
import { Button, Card, Empty, Field, Input, PageHeader, Textarea } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import type { Dream } from "@/lib/types";

export default function DreamsPage() {
  const { couple, profile } = useCouple();
  const [items, setItems] = useState<Dream[]>([]);
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [open, setOpen] = useState(false);

  async function load() {
    const supabase = createClient();
    const { data } = await supabase.from("dreams").select("*").eq("couple_id", couple.id).order("done").order("created_at", { ascending: false });
    setItems((data as Dream[]) ?? []);
  }

  useEffect(() => {
    load();
  }, [couple.id]);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    const supabase = createClient();
    await supabase.from("dreams").insert({
      couple_id: couple.id,
      created_by: profile.id,
      title,
      note: note || null,
    });
    setTitle("");
    setNote("");
    setOpen(false);
    load();
  }

  async function toggle(item: Dream) {
    const supabase = createClient();
    await supabase
      .from("dreams")
      .update({ done: !item.done, completed_at: item.done ? null : new Date().toISOString() })
      .eq("id", item.id);
    load();
  }

  return (
    <div>
      <PageHeader kicker="la lista de los dos" title="Sueños" copy="Sitios, planes, locuras. Se van tachando." />
      <Button className="mb-5" onClick={() => setOpen((v) => !v)}>
        {open ? "Cerrar" : "Añadir sueño"}
      </Button>
      {open ? (
        <Card className="mb-5">
          <form onSubmit={save} className="grid gap-4">
            <Field label="El sueño">
              <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
            </Field>
            <Field label="Nota">
              <Textarea value={note} onChange={(e) => setNote(e.target.value)} />
            </Field>
            <Button type="submit">Guardar</Button>
          </form>
        </Card>
      ) : null}
      <div className="grid gap-3">
        {items.length === 0 ? <Empty>El primero puede ser pequeño. O absurdo.</Empty> : null}
        {items.map((item) => (
          <button key={item.id} onClick={() => toggle(item)} className="text-left">
            <Card className={item.done ? "opacity-55" : ""}>
              <p className={`font-serif text-2xl ${item.done ? "line-through" : ""}`}>{item.title}</p>
              {item.note ? <p className="mt-2 text-sm text-ink-soft">{item.note}</p> : null}
              <p className="mt-3 text-xs tracking-[0.18em] text-rose uppercase">
                {item.done ? "hecho" : "pendiente"}
              </p>
            </Card>
          </button>
        ))}
      </div>
    </div>
  );
}
