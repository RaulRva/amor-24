"use client";

import { useEffect, useState } from "react";
import { useCouple } from "@/components/couple-context";
import { Button, Card, Empty, Field, Input, PageHeader, Textarea } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import { spotifyEmbedUrl, spotifySearchUrl, trackIdFromSpotifyUrl, type SongPick } from "@/lib/spotify";
import type { Echo } from "@/lib/types";

export default function EcosPage() {
  const { couple, profile } = useCouple();
  const [items, setItems] = useState<Echo[]>([]);
  const [kind, setKind] = useState<"song" | "phrase">("song");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [why, setWhy] = useState("");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SongPick[]>([]);
  const [selected, setSelected] = useState<SongPick | null>(null);
  const [searching, setSearching] = useState(false);
  const [open, setOpen] = useState(false);

  async function load() {
    const supabase = createClient();
    const { data } = await supabase
      .from("echoes")
      .select("*")
      .eq("couple_id", couple.id)
      .order("created_at", { ascending: false });
    setItems((data as Echo[]) ?? []);
  }

  useEffect(() => {
    load();
  }, [couple.id]);

  useEffect(() => {
    if (kind !== "song" || !open) return;
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setSearching(false);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setSearching(true);
      try {
        const response = await fetch(`/api/spotify/search?q=${encodeURIComponent(q)}`, {
          signal: controller.signal,
        });
        const data = (await response.json()) as { tracks?: SongPick[] };
        if (controller.signal.aborted) return;
        const tracks = data.tracks ?? [];
        if (tracks.length === 1 && /open\.spotify\.com|spotify\.link|spotify:track:/i.test(q)) {
          setSelected(tracks[0]);
          setResults([]);
        } else {
          setResults(tracks);
        }
      } catch {
        if (!controller.signal.aborted) setResults([]);
      } finally {
        if (!controller.signal.aborted) setSearching(false);
      }
    }, 350);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [query, kind, open]);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (kind === "song" && !selected) return;
    const supabase = createClient();
    await supabase.from("echoes").insert({
      couple_id: couple.id,
      created_by: profile.id,
      kind,
      title: kind === "song" ? selected!.title : title,
      body: kind === "song" ? selected!.artist || null : body || null,
      why: why || null,
      image_url: kind === "song" ? selected!.imageUrl : null,
      spotify_url: kind === "song" ? selected!.spotifyUrl : null,
    });
    setTitle("");
    setBody("");
    setWhy("");
    setQuery("");
    setResults([]);
    setSelected(null);
    setOpen(false);
    load();
  }

  return (
    <div>
      <PageHeader
        kicker="lo que os recuerda"
        title="Ecos"
        copy="Canciones de Spotify, frases, esa tontería que solo entendéis vosotros."
      />
      <Button className="mb-5" onClick={() => setOpen((v) => !v)}>
        {open ? "Cerrar" : "Añadir"}
      </Button>
      {open ? (
        <Card className="mb-5">
          <form onSubmit={save} className="grid gap-4">
            <div className="flex gap-2">
              {(["song", "phrase"] as const).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => {
                    setKind(item);
                    setSelected(null);
                    setResults([]);
                    setQuery("");
                  }}
                  className={`rounded-full px-4 py-2 text-sm ${kind === item ? "bg-ink text-paper" : "bg-paper-2"}`}
                >
                  {item === "song" ? "Canción" : "Frase"}
                </button>
              ))}
            </div>
            {kind === "song" ? (
              <>
                <Field label="Busca en Spotify o pega el enlace">
                  <Input
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value);
                      setSelected(null);
                    }}
                    placeholder="Nombre, artista o https://open.spotify.com/..."
                    autoComplete="off"
                    enterKeyHint="search"
                  />
                </Field>
                {searching ? <p className="text-sm text-ink-soft">Buscando…</p> : null}
                {selected ? (
                  <SelectedSong
                    song={selected}
                    onClear={() => {
                      setSelected(null);
                    }}
                  />
                ) : null}
                {!selected && results.length > 0 ? (
                  <div className="grid gap-2">
                    {results.map((track) => (
                      <button
                        key={track.id}
                        type="button"
                        onClick={() => {
                          setSelected(track);
                          setResults([]);
                        }}
                        className="rounded-2xl border border-[var(--line)] bg-white/70 p-2 text-left"
                      >
                        <SongPreview song={track} />
                      </button>
                    ))}
                  </div>
                ) : null}
                {!selected && !searching && query.trim().length >= 2 && results.length === 0 ? (
                  <p className="text-sm text-ink-soft">No sale nada con eso. Prueba el enlace de Spotify.</p>
                ) : null}
              </>
            ) : (
              <>
                <Field label="Frase">
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
                </Field>
                <Field label="Quién la dijo">
                  <Input value={body} onChange={(e) => setBody(e.target.value)} />
                </Field>
              </>
            )}
            <Field label="Por qué os recuerda">
              <Textarea value={why} onChange={(e) => setWhy(e.target.value)} />
            </Field>
            <Button type="submit" disabled={kind === "song" && !selected}>
              Guardar
            </Button>
          </form>
        </Card>
      ) : null}
      <div className="grid gap-3">
        {items.length === 0 ? <Empty>Todavía no hay ecos. El primero suele ser una canción.</Empty> : null}
        {items.map((item) =>
          item.kind === "song" ? (
            <SongCard key={item.id} item={item} />
          ) : (
            <Card key={item.id}>
              <p className="text-[11px] tracking-[0.2em] text-rose uppercase">frase</p>
              <p className="mt-1 font-serif text-2xl">{item.title}</p>
              {item.body ? <p className="mt-1 text-ink-soft">{item.body}</p> : null}
              {item.why ? <p className="mt-3 text-sm">{item.why}</p> : null}
            </Card>
          ),
        )}
      </div>
    </div>
  );
}

function SelectedSong({ song, onClear }: { song: SongPick; onClear: () => void }) {
  return (
    <div className="grid gap-3">
      <div className="overflow-hidden rounded-2xl border border-[var(--line)] bg-white/70">
        {song.embedUrl ? (
          <iframe
            src={`${song.embedUrl}?utm_source=generator&theme=0`}
            title={`${song.title} — ${song.artist}`}
            className="block w-full border-0"
            height={152}
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
          />
        ) : (
          <div className="p-3">
            <SongPreview song={song} large showLink />
          </div>
        )}
      </div>
      <button type="button" onClick={onClear} className="text-sm text-ink-soft">
        Elegir otra
      </button>
    </div>
  );
}

function SongCard({ item }: { item: Echo }) {
  const song: SongPick = {
    id: item.id,
    title: item.title,
    artist: item.body ?? "",
    imageUrl: item.image_url,
    spotifyUrl: item.spotify_url ?? spotifySearchUrl(item.title, item.body ?? ""),
    embedUrl: item.spotify_url ? spotifyEmbedFromUrl(item.spotify_url) : null,
  };

  return (
    <Card padded={false}>
      {song.embedUrl ? (
        <iframe
          src={`${song.embedUrl}?utm_source=generator&theme=0`}
          title={`${song.title} — ${song.artist}`}
          className="block w-full border-0"
          height={152}
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
        />
      ) : (
        <div className="p-3">
          <SongPreview song={song} large showLink />
        </div>
      )}
      {item.why ? <p className="px-4 pb-4 pt-1 text-sm">{item.why}</p> : null}
    </Card>
  );
}

function SongPreview({
  song,
  large = false,
  showLink = false,
}: {
  song: SongPick;
  large?: boolean;
  showLink?: boolean;
}) {
  const size = large ? "h-20 w-20" : "h-14 w-14";
  return (
    <div className="flex items-center gap-3">
      {song.imageUrl ? (
        <img src={song.imageUrl} alt="" className={`${size} shrink-0 rounded-xl object-cover`} />
      ) : (
        <div className={`${size} shrink-0 rounded-xl bg-paper-2`} />
      )}
      <div className="min-w-0">
        <p className={`truncate font-serif ${large ? "text-2xl" : "text-lg"}`}>{song.title}</p>
        <p className="truncate text-sm text-ink-soft">{song.artist || "Spotify"}</p>
        {showLink && song.spotifyUrl ? (
          <a
            href={song.spotifyUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-1 inline-block text-xs tracking-wide text-rose"
          >
            Abrir en Spotify
          </a>
        ) : null}
      </div>
    </div>
  );
}

function spotifyEmbedFromUrl(url: string) {
  const id = trackIdFromSpotifyUrl(url);
  return id ? spotifyEmbedUrl(id) : null;
}

