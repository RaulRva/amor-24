import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  extractSpotifyInput,
  isSpotifyQuery,
  spotifyEmbedUrl,
  spotifySearchUrl,
  spotifyTrackUrl,
  trackIdFromSpotifyUrl,
  type SongPick,
} from "@/lib/spotify";

const SPOTIFY_UA = "Mozilla/5.0 (compatible; Amor24/1.0)";

let spotifyTokenCache: { token: string; exp: number } | null = null;

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Necesitas entrar." }, { status: 401 });

  const query = extractSpotifyInput(request.nextUrl.searchParams.get("q") ?? "");
  if (query.length < 2) return Response.json({ tracks: [] as SongPick[] });

  try {
    if (isSpotifyQuery(query)) {
      const track = await resolveSpotify(query);
      return Response.json({ tracks: track ? [track] : [] });
    }

    const fromSpotify = await searchSpotify(query);
    if (fromSpotify.length) return Response.json({ tracks: fromSpotify });

    return Response.json({ tracks: await searchCatalog(query) });
  } catch {
    return Response.json({ error: "No se ha podido buscar ahora." }, { status: 502 });
  }
}

async function searchSpotify(query: string): Promise<SongPick[]> {
  const token = await getSpotifyToken();
  if (!token) return [];

  const url = new URL("https://api.spotify.com/v1/search");
  url.searchParams.set("q", query);
  url.searchParams.set("type", "track");
  url.searchParams.set("limit", "8");
  url.searchParams.set("market", "ES");

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) return [];

  const data = (await response.json()) as {
    tracks?: {
      items?: {
        id: string;
        name: string;
        artists: { name: string }[];
        album: { images?: { url: string }[] };
        external_urls?: { spotify?: string };
      }[];
    };
  };

  return (data.tracks?.items ?? []).map((item) => ({
    id: item.id,
    title: item.name,
    artist: item.artists.map((artist) => artist.name).join(", "),
    imageUrl: item.album.images?.[1]?.url ?? item.album.images?.[0]?.url ?? null,
    spotifyUrl: item.external_urls?.spotify ?? spotifyTrackUrl(item.id),
    embedUrl: spotifyEmbedUrl(item.id),
  }));
}

async function getSpotifyToken() {
  const id = process.env.SPOTIFY_CLIENT_ID;
  const secret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!id || !secret) return null;
  if (spotifyTokenCache && spotifyTokenCache.exp > Date.now() + 30_000) {
    return spotifyTokenCache.token;
  }

  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  if (!response.ok) return null;

  const data = (await response.json()) as { access_token: string; expires_in: number };
  spotifyTokenCache = {
    token: data.access_token,
    exp: Date.now() + data.expires_in * 1000,
  };
  return spotifyTokenCache.token;
}

async function resolveSpotify(input: string): Promise<SongPick | null> {
  const directId = trackIdFromSpotifyUrl(input);
  const oembedUrl = directId ? spotifyTrackUrl(directId) : input;
  const oembed = await fetch(
    `https://open.spotify.com/oembed?url=${encodeURIComponent(oembedUrl)}`,
    { headers: { "User-Agent": SPOTIFY_UA, Accept: "application/json" } },
  );
  if (!oembed.ok) return null;

  const data = (await oembed.json()) as {
    title?: string;
    thumbnail_url?: string;
    iframe_url?: string;
    html?: string;
  };

  const id =
    directId ||
    trackIdFromSpotifyUrl(data.iframe_url ?? "") ||
    trackIdFromSpotifyUrl(data.html ?? "");
  if (!id && !data.title) return null;

  const artist = id ? await artistFromSpotifyPage(id) : "";
  const trackId = id ?? `oembed-${encodeURIComponent(data.title ?? input)}`;

  return {
    id: trackId,
    title: data.title || "Canción de Spotify",
    artist,
    imageUrl: data.thumbnail_url ?? null,
    spotifyUrl: id ? spotifyTrackUrl(id) : oembedUrl,
    embedUrl: id ? spotifyEmbedUrl(id) : null,
  };
}

async function artistFromSpotifyPage(id: string) {
  try {
    const response = await fetch(spotifyTrackUrl(id), {
      headers: { "User-Agent": SPOTIFY_UA },
    });
    if (!response.ok) return "";
    const html = await response.text();
    const og = html.match(/property="og:description" content="([^"]+)"/);
    if (og?.[1]) return decodeHtml(og[1].split("·")[0]?.trim() ?? "");
    const lyrics = html.match(/song and lyrics by ([^|<]+)/i);
    return lyrics?.[1] ? decodeHtml(lyrics[1].trim()) : "";
  } catch {
    return "";
  }
}

async function searchCatalog(query: string): Promise<SongPick[]> {
  const url = new URL("https://itunes.apple.com/search");
  url.searchParams.set("term", query);
  url.searchParams.set("entity", "song");
  url.searchParams.set("limit", "8");
  url.searchParams.set("country", "ES");

  const response = await fetch(url);
  if (!response.ok) return [];

  const data = (await response.json()) as {
    results?: {
      trackId: number;
      trackName: string;
      artistName: string;
      artworkUrl100?: string;
    }[];
  };

  return (data.results ?? []).map((item) => ({
    id: `itunes-${item.trackId}`,
    title: item.trackName,
    artist: item.artistName,
    imageUrl: item.artworkUrl100 ? item.artworkUrl100.replace("100x100bb", "300x300bb") : null,
    spotifyUrl: spotifySearchUrl(item.trackName, item.artistName),
    embedUrl: null,
  }));
}

function decodeHtml(value: string) {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">");
}
