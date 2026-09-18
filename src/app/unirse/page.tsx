"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Field, Input } from "@/components/ui";
import { ThemeReset } from "@/components/theme-reset";
import { createClient } from "@/lib/supabase/client";

export default function JoinPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [invite, setInvite] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function createCouple() {
    setBusy(true);
    setError(null);
    const supabase = createClient();
    const { data, error: rpcError } = await supabase.rpc("create_couple");
    setBusy(false);
    if (rpcError) {
      setError(rpcError.message);
      return;
    }
    const payload = typeof data === "string" ? JSON.parse(data) : data;
    setInvite(payload?.invite_code ?? payload?.inviteCode ?? null);
    router.refresh();
  }

  async function joinCouple(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const supabase = createClient();
    const { error: rpcError } = await supabase.rpc("join_couple", { invite: code });
    setBusy(false);
    if (rpcError) {
      setError(rpcError.message);
      return;
    }
    router.replace("/");
    router.refresh();
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-5 pt-[max(2.5rem,env(safe-area-inset-top))] pb-[max(2rem,env(safe-area-inset-bottom))]">
      <ThemeReset />
      <p className="text-[11px] tracking-[0.28em] text-rose uppercase">el primer paso</p>
      <h1 className="mt-2 font-serif text-4xl">Uniros</h1>
      <p className="mt-3 mb-8 text-ink-soft">
        Uno crea el espacio y comparte el código. El otro lo escribe. Así de simple.
      </p>
      <div className="grid gap-4">
        <Card>
          <h2 className="font-serif text-2xl">Crear nuestro sitio</h2>
          <p className="mt-2 mb-4 text-sm text-ink-soft">Saldrá un código de 6 letras para tu pareja.</p>
          <Button disabled={busy} onClick={createCouple}>
            Crear
          </Button>
          {invite ? (
            <>
              <p className="mt-4 rounded-2xl bg-paper-2 px-4 py-3 text-center font-serif text-3xl tracking-[0.3em]">
                {invite}
              </p>
              <a href="/" className="mt-4 inline-block text-sm text-rose">
                Entrar al sitio →
              </a>
            </>
          ) : null}
        </Card>
        <Card>
          <h2 className="font-serif text-2xl">Tengo un código</h2>
          <form onSubmit={joinCouple} className="mt-4 grid gap-4">
            <Field label="Código">
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="A1B2C3"
                required
              />
            </Field>
            <Button disabled={busy} tone="rose">
              Unirme
            </Button>
          </form>
        </Card>
        {error ? <p className="text-sm text-rose">{error}</p> : null}
      </div>
    </div>
  );
}
