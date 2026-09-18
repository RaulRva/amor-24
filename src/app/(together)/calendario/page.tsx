"use client";

import { useEffect, useMemo, useState } from "react";
import { useCouple } from "@/components/couple-context";
import { Button, Card, Field, Input, PageHeader, Textarea } from "@/components/ui";
import { formatDay, toISODate, todayISO } from "@/lib/dates";
import { createClient } from "@/lib/supabase/client";
import type { CalendarEvent, CalendarHeart } from "@/lib/types";

const WEEKDAYS = ["L", "M", "X", "J", "V", "S", "D"];

function monthCells(year: number, month: number) {
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: Array<{ day: number; iso: string } | null> = [];
  for (let i = 0; i < firstWeekday; i += 1) cells.push(null);
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push({ day, iso: toISODate(year, month, day) });
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export default function CalendarPage() {
  const { couple, profile } = useCouple();
  const today = todayISO();
  const now = new Date();
  const [cursor, setCursor] = useState({ year: now.getFullYear(), month: now.getMonth() });
  const [selected, setSelected] = useState(today);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [hearts, setHearts] = useState<CalendarHeart[]>([]);
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [markHeart, setMarkHeart] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cells = useMemo(() => monthCells(cursor.year, cursor.month), [cursor]);
  const monthLabel = new Intl.DateTimeFormat("es-ES", { month: "long", year: "numeric" }).format(
    new Date(cursor.year, cursor.month, 1),
  );

  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const event of events) {
      const list = map.get(event.happens_on) ?? [];
      list.push(event);
      map.set(event.happens_on, list);
    }
    return map;
  }, [events]);

  const heartDays = useMemo(() => new Set(hearts.map((heart) => heart.happens_on)), [hearts]);
  const selectedEvents = eventsByDay.get(selected) ?? [];
  const selectedHasHeart = heartDays.has(selected);

  async function load() {
    const supabase = createClient();
    const start = toISODate(cursor.year, cursor.month, 1);
    const end = toISODate(cursor.year, cursor.month, new Date(cursor.year, cursor.month + 1, 0).getDate());
    const [{ data: eventData }, { data: heartData }] = await Promise.all([
      supabase
        .from("calendar_events")
        .select("*")
        .eq("couple_id", couple.id)
        .gte("happens_on", start)
        .lte("happens_on", end)
        .order("created_at"),
      supabase
        .from("calendar_hearts")
        .select("*")
        .eq("couple_id", couple.id)
        .gte("happens_on", start)
        .lte("happens_on", end),
    ]);
    setEvents((eventData as CalendarEvent[]) ?? []);
    setHearts((heartData as CalendarHeart[]) ?? []);
  }

  useEffect(() => {
    load();
  }, [couple.id, cursor.year, cursor.month]);

  async function addEvent(formEvent: React.FormEvent) {
    formEvent.preventDefault();
    setError(null);
    const supabase = createClient();
    const { error: insertError } = await supabase.from("calendar_events").insert({
      couple_id: couple.id,
      created_by: profile.id,
      title,
      note: note || null,
      happens_on: selected,
    });
    if (insertError) {
      setError("No se ha podido guardar el evento.");
      return;
    }
    if (markHeart && !selectedHasHeart) {
      await supabase.from("calendar_hearts").insert({
        couple_id: couple.id,
        created_by: profile.id,
        happens_on: selected,
      });
    }
    setTitle("");
    setNote("");
    setMarkHeart(false);
    load();
  }

  async function toggleHeart() {
    setError(null);
    const supabase = createClient();
    if (selectedHasHeart) {
      const { error: deleteError } = await supabase
        .from("calendar_hearts")
        .delete()
        .eq("couple_id", couple.id)
        .eq("happens_on", selected);
      if (deleteError) setError("No se ha podido quitar el corazón.");
    } else {
      const { error: insertError } = await supabase.from("calendar_hearts").insert({
        couple_id: couple.id,
        created_by: profile.id,
        happens_on: selected,
      });
      if (insertError) setError("No se ha podido añadir el corazón.");
    }
    load();
  }

  async function removeEvent(id: string) {
    const supabase = createClient();
    await supabase.from("calendar_events").delete().eq("id", id);
    load();
  }

  function shiftMonth(delta: number) {
    setCursor((current) => {
      const date = new Date(current.year, current.month + delta, 1);
      return { year: date.getFullYear(), month: date.getMonth() };
    });
  }

  return (
    <div>
      <PageHeader
        kicker="vuestros días"
        title="Calendario"
        copy="Planes, citas y un corazón los días que queráis marcar."
      />

      <Card className="mb-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <button className="rounded-full px-3 py-2 text-ink-soft hover:bg-paper-2" onClick={() => shiftMonth(-1)}>
            ←
          </button>
          <h3 className="font-serif text-2xl capitalize">{monthLabel}</h3>
          <button className="rounded-full px-3 py-2 text-ink-soft hover:bg-paper-2" onClick={() => shiftMonth(1)}>
            →
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-xs tracking-[0.18em] text-ink-soft">
          {WEEKDAYS.map((day) => (
            <div key={day} className="py-2">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((cell, index) => {
            if (!cell) return <div key={`empty-${index}`} />;
            const isToday = cell.iso === today;
            const isSelected = cell.iso === selected;
            const hasHeart = heartDays.has(cell.iso);
            const hasEvents = (eventsByDay.get(cell.iso) ?? []).length > 0;
            return (
              <button
                key={cell.iso}
                onClick={() => setSelected(cell.iso)}
                className={`flex min-h-14 flex-col items-center rounded-2xl py-2 text-sm transition ${
                  isSelected ? "bg-ink text-paper" : isToday ? "bg-blush/40" : "hover:bg-paper-2"
                }`}
              >
                <span>{cell.day}</span>
                <span className={`mt-1 text-[11px] ${isSelected ? "text-blush" : "text-rose"}`}>
                  {hasHeart ? "♥" : hasEvents ? "•" : ""}
                </span>
              </button>
            );
          })}
        </div>
      </Card>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="font-serif text-xl leading-tight">{formatDay(selected)}</p>
        <button
          onClick={toggleHeart}
          className={`min-h-11 shrink-0 rounded-full px-4 text-sm ${
            selectedHasHeart ? "bg-rose text-paper" : "bg-paper-2 text-ink"
          }`}
        >
          {selectedHasHeart ? "♥ Relación" : "♡ Añadir corazón"}
        </button>
      </div>

      <div className="mb-5 grid gap-3">
        {selectedEvents.length === 0 ? (
          <p className="text-sm text-ink-soft">No hay eventos este día.</p>
        ) : (
          selectedEvents.map((event) => (
            <Card key={event.id} className="flex items-start justify-between gap-3">
              <div>
                <p className="font-serif text-xl">{event.title}</p>
                {event.note ? <p className="mt-1 text-sm text-ink-soft">{event.note}</p> : null}
              </div>
              <button className="text-sm text-ink-soft" onClick={() => removeEvent(event.id)}>
                Quitar
              </button>
            </Card>
          ))
        )}
      </div>

      <Card>
        <form onSubmit={addEvent} className="grid gap-4">
          <Field label="Evento">
            <Input value={title} onChange={(event) => setTitle(event.target.value)} required placeholder="Cena, viaje, cita…" />
          </Field>
          <Field label="Nota">
            <Textarea value={note} onChange={(event) => setNote(event.target.value)} />
          </Field>
          <label className="flex items-center gap-3 text-sm">
            <input
              type="checkbox"
              checked={markHeart}
              onChange={(event) => setMarkHeart(event.target.checked)}
              className="size-5 accent-[var(--rose)]"
            />
            Añadir corazón (relación)
          </label>
          {error ? <p className="text-sm text-rose">{error}</p> : null}
          <Button type="submit">Guardar evento</Button>
        </form>
      </Card>
    </div>
  );
}
