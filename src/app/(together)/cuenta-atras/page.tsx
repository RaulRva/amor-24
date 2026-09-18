"use client";

import { useEffect, useState } from "react";
import { useCouple } from "@/components/couple-context";
import { Button, Card, Empty, Field, Input, PageHeader, Textarea } from "@/components/ui";
import { remaining } from "@/lib/dates";
import { createClient } from "@/lib/supabase/client";
import type { Countdown } from "@/lib/types";

export default function CountdownPage() {
  const { couple, profile } = useCouple();
  const [items, setItems] = useState<Countdown[]>([]);
  const [title, setTitle] = useState("");
  const [target, setTarget] = useState("");
  const [emoji, setEmoji] = useState("✨");
  const [open, setOpen] = useState(false);

  async function load() {
    const supabase = createClient();
    const { data } = await supabase
      .from("countdowns")
      .select("*")
      .eq("couple_id", couple.id)
      .order("target_at");
    setItems((data as Countdown[]) ?? []);
  }

  useEffect(() => {
    load();
  }, [couple.id]);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    const supabase = createClient();
    await supabase.from("countdowns").insert({
      couple_id: couple.id,
      created_by: profile.id,
      title,
      emoji,
      target_at: new Date(target).toISOString(),
    });
    setTitle("");
    setTarget("");
    setOpen(false);
    load();
  }

  return (
    <div>
      <PageHeader kicker="lo que esperáis" title="Cuentas atrás" copy="Un viaje, un aniversario, un viernes." />
      <Button className="mb-5" onClick={() => setOpen((v) => !v)}>
        {open ? "Cerrar" : "Nueva cuenta"}
      </Button>
      {open ? (
        <Card className="mb-5">
          <form onSubmit={save} className="grid gap-4">
            <Field label="Título">
              <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
            </Field>
            <Field label="Cuándo">
              <Input type="datetime-local" value={target} onChange={(e) => setTarget(e.target.value)} required />
            </Field>
            <Field label="Emoji">
              <Input value={emoji} onChange={(e) => setEmoji(e.target.value)} maxLength={4} />
            </Field>
            <Button type="submit">Guardar</Button>
          </form>
        </Card>
      ) : null}
      <div className="grid gap-3">
        {items.length === 0 ? <Empty>Añadid lo siguiente que os haga ilusión.</Empty> : null}
        {items.map((item) => {
          const left = remaining(item.target_at);
          return (
            <Card key={item.id} className={left.past ? "opacity-60" : ""}>
              <p className="font-serif text-3xl">
                {item.emoji} {item.title}
              </p>
              <p className="mt-2 text-ink-soft">
                {left.past ? "Ya llegó." : `${left.days} días y ${left.hours} horas`}
              </p>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
