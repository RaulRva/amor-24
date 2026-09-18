"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { useCouple } from "@/components/couple-context";
import { Button, Card, Empty, Field, Input, PageHeader, Textarea } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import type { Place } from "@/lib/types";
import "leaflet/dist/leaflet.css";

const PlacesMap = dynamic(() => import("@/components/places-map").then((mod) => mod.PlacesMap), {
  ssr: false,
});

function mapsDirectionsUrl(lat: number, lng: number) {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}

async function placeName(lat: number, lng: number) {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18`,
      { headers: { "Accept-Language": "es" } },
    );
    if (!response.ok) throw new Error("geocode");
    const data = (await response.json()) as { name?: string; display_name?: string };
    const label = data.name || data.display_name?.split(",")[0];
    return label?.trim() || "Sitio";
  } catch {
    return "Sitio";
  }
}

export default function MapPage() {
  const { couple, profile } = useCouple();
  const [places, setPlaces] = useState<Place[]>([]);
  const [focus, setFocus] = useState<Place | null>(null);
  const [draft, setDraft] = useState<{ lat: number; lng: number } | null>(null);
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const skipMapClick = useRef(0);

  async function load() {
    const supabase = createClient();
    const { data } = await supabase
      .from("places")
      .select("*")
      .eq("couple_id", couple.id)
      .order("created_at", { ascending: false });
    setPlaces((data as Place[]) ?? []);
  }

  useEffect(() => {
    load();
  }, [couple.id]);

  async function onPick(lat: number, lng: number) {
    if (Date.now() - skipMapClick.current < 400) return;
    setError(null);
    setFocus(null);
    setDraft({ lat, lng });
    setSaving(true);
    const title = await placeName(lat, lng);
    setName(title);
    const supabase = createClient();
    const { data, error: insertError } = await supabase
      .from("places")
      .insert({
        couple_id: couple.id,
        created_by: profile.id,
        name: title,
        lat,
        lng,
      })
      .select("*")
      .single();
    setSaving(false);
    if (insertError || !data) {
      setError("No se ha podido guardar. Prueba otra vez.");
      return;
    }
    const saved = data as Place;
    setPlaces((current) => [saved, ...current.filter((place) => place.id !== saved.id)]);
    setFocus(saved);
    setDraft(null);
    setNote("");
  }

  async function rename(event: React.FormEvent) {
    event.preventDefault();
    if (!focus) return;
    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("places")
      .update({ name, note: note || null })
      .eq("id", focus.id);
    if (updateError) {
      setError("No se ha podido actualizar.");
      return;
    }
    const next = { ...focus, name, note: note || null };
    setFocus(next);
    setPlaces((current) => current.map((place) => (place.id === next.id ? next : place)));
  }

  function selectPlace(place: Place) {
    skipMapClick.current = Date.now();
    setDraft(null);
    setFocus(place);
    setName(place.name);
    setNote(place.note ?? "");
    setError(null);
  }

  return (
    <div>
      <PageHeader
        kicker="vuestros sitios"
        title="Mapa"
        copy="Toca el mapa para guardar un punto. Toca uno guardado para ir hasta él."
      />
      <div className="mb-5 overflow-hidden rounded-3xl border border-[var(--line)]">
        <PlacesMap
          places={places}
          focus={focus}
          draft={draft}
          onPick={onPick}
          onSelect={selectPlace}
        />
      </div>
      {saving ? <p className="mb-4 text-sm text-ink-soft">Guardando el sitio…</p> : null}
      {error ? <p className="mb-4 text-sm text-rose">{error}</p> : null}
      {focus ? (
        <Card className="mb-5">
          <form onSubmit={rename} className="grid gap-4">
            <Field label="Nombre">
              <Input value={name} onChange={(event) => setName(event.target.value)} required />
            </Field>
            <Field label="Nota">
              <Textarea value={note} onChange={(event) => setNote(event.target.value)} />
            </Field>
            <div className="grid gap-2">
              <Button type="submit">Guardar nombre</Button>
              <a
                href={mapsDirectionsUrl(focus.lat, focus.lng)}
                target="_blank"
                rel="noreferrer"
                className="flex min-h-11 items-center justify-center rounded-full bg-rose px-5 py-3 text-sm text-paper"
              >
                Llévame allí
              </a>
            </div>
          </form>
        </Card>
      ) : null}
      <div className="grid gap-3">
        {places.length === 0 ? (
          <Empty>El mapa está vacío. Toca donde quieras guardar el primer punto.</Empty>
        ) : null}
        {places.map((place) => (
          <button key={place.id} className="text-left" onClick={() => selectPlace(place)}>
            <Card className={focus?.id === place.id ? "border-ink" : ""}>
              <p className="font-serif text-2xl">{place.name}</p>
              {place.note ? <p className="mt-1 text-ink-soft">{place.note}</p> : null}
              <p className="mt-3 text-xs tracking-[0.18em] text-rose uppercase">Ir al punto</p>
            </Card>
          </button>
        ))}
      </div>
    </div>
  );
}
