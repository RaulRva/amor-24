export type SongPick = {
  id: string;
  title: string;
  artist: string;
  imageUrl: string | null;
  spotifyUrl: string;
  embedUrl: string | null;
};

export function extractSpotifyInput(raw: string) {
  const url = raw.match(/https?:\/\/(?:open\.spotify\.com|spotify\.link)\/\S+/i);
  if (url) return url[0].replace(/[),.;]+$/g, "");
  const uri = raw.match(/spotify:track:[a-zA-Z0-9]+/i);
  if (uri) return uri[0];
  return raw.trim();
}

export function isSpotifyQuery(raw: string) {
  return /open\.spotify\.com|spotify\.link|spotify:track:/i.test(raw);
}

export function trackIdFromSpotifyUrl(input: string) {
  const uri = input.match(/spotify:track:([a-zA-Z0-9]+)/i);
  if (uri) return uri[1];
  const web = input.match(
    /open\.spotify\.com\/(?:intl-[a-z]{2}\/)?(?:embed\/)?track\/([a-zA-Z0-9]+)/i,
  );
  return web?.[1] ?? null;
}

export function spotifyTrackUrl(id: string) {
  return `https://open.spotify.com/track/${id}`;
}

export function spotifyEmbedUrl(id: string) {
  return `https://open.spotify.com/embed/track/${id}`;
}

export function spotifySearchUrl(title: string, artist: string) {
  return `https://open.spotify.com/search/${encodeURIComponent(`${title} ${artist}`.trim())}`;
}
