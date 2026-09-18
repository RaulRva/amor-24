"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { applyTheme, parseTheme } from "@/lib/theme";
import type { Couple, Profile } from "@/lib/types";

type CoupleContextValue = {
  profile: Profile;
  partner: Profile | null;
  couple: Couple;
  setCouple: (couple: Couple) => void;
};

const CoupleContext = createContext<CoupleContextValue | null>(null);

export function CoupleProvider({
  value,
  children,
}: {
  value: Omit<CoupleContextValue, "setCouple">;
  children: React.ReactNode;
}) {
  const [couple, setCouple] = useState(value.couple);

  useEffect(() => {
    setCouple(value.couple);
  }, [value.couple]);

  useEffect(() => {
    applyTheme(parseTheme(couple.theme));
  }, [couple.theme]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`couple-${value.couple.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "couples", filter: `id=eq.${value.couple.id}` },
        (payload) => {
          setCouple(payload.new as Couple);
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [value.couple.id]);

  const context = useMemo(
    () => ({
      profile: value.profile,
      partner: value.partner,
      couple,
      setCouple,
    }),
    [couple, value.partner, value.profile],
  );

  return <CoupleContext.Provider value={context}>{children}</CoupleContext.Provider>;
}

export function useCouple() {
  const value = useContext(CoupleContext);
  if (!value) {
    throw new Error("useCouple tiene que usarse dentro de la app.");
  }
  return value;
}
