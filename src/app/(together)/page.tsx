"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CoverPhoto } from "@/components/cover-photo";
import { useCouple } from "@/components/couple-context";
import { Card } from "@/components/ui";
import { remaining } from "@/lib/dates";
import { euros } from "@/lib/money";
import { createClient } from "@/lib/supabase/client";
import type { Countdown, SavingsEntry, SavingsGoal } from "@/lib/types";

const tiles = [
  { href: "/mapa", title: "Mapa", copy: "Sitios que son vuestros" },
  { href: "/album", title: "Álbum", copy: "Fechas que merecen foto" },
  { href: "/ahorros", title: "Ahorros", copy: "Meta y cuota de cada mes" },
  { href: "/calendario", title: "Calendario", copy: "Eventos y corazones" },
  { href: "/ecos", title: "Ecos", copy: "Canciones y frases" },
  { href: "/cuenta-atras", title: "Cuentas atrás", copy: "Lo que estáis esperando" },
  { href: "/suenos", title: "Sueños", copy: "La lista de los dos" },
];

export default function HomePage() {
  const { couple } = useCouple();
  const [countdown, setCountdown] = useState<Countdown | null>(null);
  const [savings, setSavings] = useState<{ goal: SavingsGoal; saved: number } | null>(null);

  useEffect(() => {
    const supabase = createClient();

    async function load() {
      const [{ data: countData }, { data: goalData }] = await Promise.all([
        supabase
          .from("countdowns")
          .select("*")
          .eq("couple_id", couple.id)
          .gte("target_at", new Date().toISOString())
          .order("target_at")
          .limit(1)
          .maybeSingle(),
        supabase.from("savings_goals").select("*").eq("couple_id", couple.id).maybeSingle(),
      ]);
      setCountdown((countData as Countdown) ?? null);
      const goal = (goalData as SavingsGoal | null) ?? null;
      if (goal) {
        const { data: entryData } = await supabase.from("savings_entries").select("amount").eq("goal_id", goal.id);
        const saved = ((entryData as Pick<SavingsEntry, "amount">[]) ?? []).reduce(
          (sum, entry) => sum + Number(entry.amount),
          0,
        );
        setSavings({ goal, saved });
      }
    }

    load();
  }, [couple.id]);

  const left = countdown ? remaining(countdown.target_at) : null;

  return (
    <div className="grid gap-5">
      <CoverPhoto />

      {countdown && left ? (
        <Card tone="dark">
          <p className="card-kicker text-[11px] tracking-[0.28em] uppercase">próximo</p>
          <p className="mt-3 font-serif text-4xl">
            {countdown.emoji} {countdown.title}
          </p>
          <p className="card-muted mt-3">
            {left.past ? "Es hoy." : `${left.days} días y ${left.hours} horas`}
          </p>
        </Card>
      ) : null}

      {savings ? (
        <Link href="/ahorros">
          <Card>
            <p className="text-[11px] tracking-[0.22em] text-rose uppercase">{savings.goal.title}</p>
            <p className="mt-2 font-serif text-2xl leading-snug">
              {euros(savings.saved)} de {euros(Number(savings.goal.target_amount))}
            </p>
          </Card>
        </Link>
      ) : null}

      <div className="grid grid-cols-2 gap-3">
        {tiles.map((tile) => (
          <Link key={tile.href} href={tile.href}>
            <Card className="h-full">
              <p className="font-serif text-xl">{tile.title}</p>
              <p className="mt-1 text-sm text-ink-soft">{tile.copy}</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
