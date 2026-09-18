"use client";

import { useEffect, useMemo, useState } from "react";
import { useCouple } from "@/components/couple-context";
import { Button, Card, Field, Input, PageHeader } from "@/components/ui";
import { euros, monthLabel, monthStart, parseAmount } from "@/lib/money";
import { createClient } from "@/lib/supabase/client";
import type { SavingsEntry, SavingsGoal } from "@/lib/types";

function toNumber(value: number | string) {
  return Number(value);
}

export default function SavingsPage() {
  const { couple, profile } = useCouple();
  const [goal, setGoal] = useState<SavingsGoal | null>(null);
  const [entries, setEntries] = useState<SavingsEntry[]>([]);
  const [title, setTitle] = useState("");
  const [target, setTarget] = useState("");
  const [monthly, setMonthly] = useState("");
  const [extra, setExtra] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const thisMonth = monthStart();

  async function load() {
    const supabase = createClient();
    const { data: goalData } = await supabase
      .from("savings_goals")
      .select("*")
      .eq("couple_id", couple.id)
      .maybeSingle();
    const current = (goalData as SavingsGoal | null) ?? null;
    setGoal(current);
    if (current) {
      setTitle(current.title);
      setTarget(String(toNumber(current.target_amount)));
      setMonthly(String(toNumber(current.monthly_amount)));
      const { data: entryData } = await supabase
        .from("savings_entries")
        .select("*")
        .eq("goal_id", current.id)
        .order("for_month", { ascending: false })
        .order("created_at", { ascending: false });
      setEntries((entryData as SavingsEntry[]) ?? []);
    } else {
      setEntries([]);
    }
  }

  useEffect(() => {
    load();
  }, [couple.id]);

  const saved = useMemo(
    () => entries.reduce((sum, entry) => sum + toNumber(entry.amount), 0),
    [entries],
  );
  const targetAmount = goal ? toNumber(goal.target_amount) : 0;
  const monthlyAmount = goal ? toNumber(goal.monthly_amount) : 0;
  const remaining = Math.max(targetAmount - saved, 0);
  const progress = targetAmount > 0 ? Math.min(100, (saved / targetAmount) * 100) : 0;
  const monthsLeft = monthlyAmount > 0 ? Math.ceil(remaining / monthlyAmount) : 0;
  const monthAlreadyAdded = entries.some((entry) => entry.for_month.startsWith(thisMonth.slice(0, 7)));

  async function saveGoal(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    const targetAmountValue = parseAmount(target);
    const monthlyAmountValue = parseAmount(monthly);
    if (!title.trim() || !(targetAmountValue > 0) || !(monthlyAmountValue > 0)) {
      setError("Pon un nombre, una meta y cuánto queréis ahorrar cada mes.");
      return;
    }
    const supabase = createClient();
    if (goal) {
      const { error: updateError } = await supabase
        .from("savings_goals")
        .update({
          title: title.trim(),
          target_amount: targetAmountValue,
          monthly_amount: monthlyAmountValue,
          updated_at: new Date().toISOString(),
        })
        .eq("id", goal.id);
      if (updateError) {
        setError("No se ha podido actualizar la meta.");
        return;
      }
    } else {
      const { error: insertError } = await supabase.from("savings_goals").insert({
        couple_id: couple.id,
        created_by: profile.id,
        title: title.trim(),
        target_amount: targetAmountValue,
        monthly_amount: monthlyAmountValue,
      });
      if (insertError) {
        setError("No se ha podido crear la meta.");
        return;
      }
    }
    setEditing(false);
    load();
  }

  async function addMonth() {
    if (!goal) return;
    setError(null);
    const supabase = createClient();
    const { error: insertError } = await supabase.from("savings_entries").insert({
      couple_id: couple.id,
      goal_id: goal.id,
      created_by: profile.id,
      amount: monthlyAmount,
      for_month: thisMonth,
      note: "Cuota del mes",
    });
    if (insertError) {
      setError("No se ha podido apuntar este mes.");
      return;
    }
    load();
  }

  async function addExtra(event: React.FormEvent) {
    event.preventDefault();
    if (!goal) return;
    const amount = parseAmount(extra);
    if (!(amount > 0)) {
      setError("Pon una cantidad extra.");
      return;
    }
    setError(null);
    const supabase = createClient();
    const { error: insertError } = await supabase.from("savings_entries").insert({
      couple_id: couple.id,
      goal_id: goal.id,
      created_by: profile.id,
      amount,
      for_month: thisMonth,
      note: "Extra",
    });
    if (insertError) {
      setError("No se ha podido añadir el extra.");
      return;
    }
    setExtra("");
    load();
  }

  async function removeEntry(id: string) {
    const supabase = createClient();
    await supabase.from("savings_entries").delete().eq("id", id);
    load();
  }

  return (
    <div>
      <PageHeader
        kicker="para los dos"
        title="Ahorros"
        copy="Una meta, una cuota cada mes, y vais viendo cómo se llena."
      />

      {!goal || editing ? (
        <Card className="mb-5">
          <form onSubmit={saveGoal} className="grid gap-4">
            <Field label="¿Para qué ahorráis?">
              <Input value={title} onChange={(event) => setTitle(event.target.value)} required placeholder="Viaje, casa, sorpresa…" />
            </Field>
            <Field label="Meta">
              <Input
                inputMode="decimal"
                value={target}
                onChange={(event) => setTarget(event.target.value)}
                required
                placeholder="2000"
              />
            </Field>
            <Field label="Cada mes">
              <Input
                inputMode="decimal"
                value={monthly}
                onChange={(event) => setMonthly(event.target.value)}
                required
                placeholder="100"
              />
            </Field>
            {error ? <p className="text-sm text-rose">{error}</p> : null}
            <Button type="submit">{goal ? "Guardar cambios" : "Crear meta"}</Button>
          </form>
        </Card>
      ) : (
        <>
          <Card tone="dark" className="mb-5">
            <p className="card-kicker text-[11px] tracking-[0.22em] uppercase">{goal.title}</p>
            <p className="mt-3 font-serif text-4xl">{euros(saved)}</p>
            <p className="card-muted mt-1">de {euros(targetAmount)}</p>
            <div className="progress-track mt-5">
              <div className="progress-fill" style={{ width: `${progress}%` }} />
            </div>
            <p className="card-muted mt-3 text-sm">
              {remaining <= 0
                ? "Lo habéis conseguido."
                : `${euros(remaining)} por llegar · ${monthsLeft} ${monthsLeft === 1 ? "mes" : "meses"} si seguís con ${euros(monthlyAmount)}/mes`}
            </p>
          </Card>

          <div className="mb-5 flex flex-wrap gap-2">
            <Button onClick={addMonth} disabled={monthAlreadyAdded}>
              {monthAlreadyAdded ? "Este mes ya está" : `Añadir ${euros(monthlyAmount)} de este mes`}
            </Button>
            <Button tone="ghost" onClick={() => setEditing(true)}>
              Cambiar meta
            </Button>
          </div>

          <Card className="mb-5">
            <form onSubmit={addExtra} className="grid gap-4">
              <Field label="Añadir extra">
                <Input
                  inputMode="decimal"
                  value={extra}
                  onChange={(event) => setExtra(event.target.value)}
                  placeholder="50"
                />
              </Field>
              <Button type="submit" tone="rose">
                Sumar extra
              </Button>
            </form>
          </Card>

          {error ? <p className="mb-4 text-sm text-rose">{error}</p> : null}

          <div className="grid gap-3">
            {entries.length === 0 ? (
              <p className="text-sm text-ink-soft">Todavía no hay aportaciones. El primer mes puede ser este.</p>
            ) : (
              entries.map((entry) => (
                <Card key={entry.id} className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-serif text-xl">{euros(toNumber(entry.amount))}</p>
                    <p className="text-sm text-ink-soft capitalize">
                      {monthLabel(entry.for_month)}
                      {entry.note ? ` · ${entry.note}` : ""}
                    </p>
                  </div>
                  <button className="text-sm text-ink-soft" onClick={() => removeEntry(entry.id)}>
                    Quitar
                  </button>
                </Card>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
