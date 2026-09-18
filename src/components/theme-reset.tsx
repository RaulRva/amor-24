"use client";

import { useEffect } from "react";
import { applyTheme, DEFAULT_THEME } from "@/lib/theme";

export function ThemeReset() {
  useEffect(() => {
    applyTheme(DEFAULT_THEME);
  }, []);
  return null;
}
