export type AppTheme = {
  paper: string;
  paper2: string;
  ink: string;
  inkSoft: string;
  rose: string;
  roseDeep: string;
  blush: string;
  gold: string;
};

export const DEFAULT_THEME: AppTheme = {
  paper: "#f3ebe1",
  paper2: "#eee3d6",
  ink: "#2b1a14",
  inkSoft: "#6a5148",
  rose: "#b44a4a",
  roseDeep: "#8e2f32",
  blush: "#e7c3b8",
  gold: "#c4a574",
};

export const THEME_PRESETS: { id: string; label: string; theme: AppTheme }[] = [
  { id: "arena", label: "Arena", theme: DEFAULT_THEME },
  {
    id: "noche",
    label: "Noche",
    theme: {
      paper: "#1c1412",
      paper2: "#2a1e1b",
      ink: "#f4ece4",
      inkSoft: "#c4b2a8",
      rose: "#d97878",
      roseDeep: "#b44a4a",
      blush: "#8e4a4a",
      gold: "#c4a574",
    },
  },
  {
    id: "olivo",
    label: "Olivo",
    theme: {
      paper: "#eef0e6",
      paper2: "#e2e6d6",
      ink: "#1f2a1c",
      inkSoft: "#5b6b54",
      rose: "#6d7a4f",
      roseDeep: "#4d5a34",
      blush: "#c5cbb0",
      gold: "#b8a06a",
    },
  },
  {
    id: "mar",
    label: "Mar",
    theme: {
      paper: "#e8f0f3",
      paper2: "#d5e4ea",
      ink: "#14303a",
      inkSoft: "#4d6a73",
      rose: "#3d7a8c",
      roseDeep: "#245864",
      blush: "#b7d0d8",
      gold: "#c4a574",
    },
  },
  {
    id: "cereza",
    label: "Cereza",
    theme: {
      paper: "#f7e8ea",
      paper2: "#f0d6db",
      ink: "#3a1420",
      inkSoft: "#7a4a58",
      rose: "#c23b5a",
      roseDeep: "#8e2240",
      blush: "#e8b4c0",
      gold: "#d4a574",
    },
  },
  {
    id: "lila",
    label: "Lila",
    theme: {
      paper: "#f0eaf4",
      paper2: "#e4d8ec",
      ink: "#2a1838",
      inkSoft: "#6a5478",
      rose: "#7a4aa0",
      roseDeep: "#5a2e78",
      blush: "#d4c0e4",
      gold: "#c4a574",
    },
  },
];

export const THEME_FIELDS: { key: keyof AppTheme; label: string }[] = [
  { key: "paper", label: "Fondo" },
  { key: "paper2", label: "Tarjetas" },
  { key: "ink", label: "Texto" },
  { key: "inkSoft", label: "Texto suave" },
  { key: "rose", label: "Acento" },
  { key: "roseDeep", label: "Acento oscuro" },
  { key: "blush", label: "Detalle" },
  { key: "gold", label: "Secundario" },
];

const HEX = /^#([0-9a-f]{6})$/i;

function hex(value: unknown, fallback: string) {
  return typeof value === "string" && HEX.test(value) ? value.toLowerCase() : fallback;
}

export function parseTheme(raw: unknown): AppTheme {
  const value = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  return {
    paper: hex(value.paper, DEFAULT_THEME.paper),
    paper2: hex(value.paper2, DEFAULT_THEME.paper2),
    ink: hex(value.ink, DEFAULT_THEME.ink),
    inkSoft: hex(value.inkSoft, DEFAULT_THEME.inkSoft),
    rose: hex(value.rose, DEFAULT_THEME.rose),
    roseDeep: hex(value.roseDeep, DEFAULT_THEME.roseDeep),
    blush: hex(value.blush, DEFAULT_THEME.blush),
    gold: hex(value.gold, DEFAULT_THEME.gold),
  };
}

export function applyTheme(theme: AppTheme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.style.setProperty("--paper", theme.paper);
  root.style.setProperty("--paper-2", theme.paper2);
  root.style.setProperty("--ink", theme.ink);
  root.style.setProperty("--ink-soft", theme.inkSoft);
  root.style.setProperty("--rose", theme.rose);
  root.style.setProperty("--rose-deep", theme.roseDeep);
  root.style.setProperty("--blush", theme.blush);
  root.style.setProperty("--gold", theme.gold);
  root.style.setProperty("--line", `color-mix(in srgb, ${theme.ink} 12%, transparent)`);
  root.style.setProperty("--shadow", `0 18px 50px color-mix(in srgb, ${theme.ink} 12%, transparent)`);
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", theme.paper);
}

export function cssVar(name: string) {
  if (typeof document === "undefined") return "";
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}
