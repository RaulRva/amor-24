"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Field, Input } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";

export function LoginForm() {
  const router = useRouter();
  const [mode, setMode] = useState<"entrar" | "crear">("entrar");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const supabase = createClient();

    try {
      if (mode === "crear") {
        const { data, error: signError } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { display_name: name } },
        });
        if (signError) throw signError;
        if (!data.session) {
          setError("Revisa el email para confirmar la cuenta, o desactiva “Confirm email” en Supabase Auth.");
          return;
        }
        if (data.user) {
          await supabase.from("profiles").update({ display_name: name }).eq("id", data.user.id);
        }
      } else {
        const { error: signError } = await supabase.auth.signInWithPassword({ email, password });
        if (signError) throw signError;
      }
      router.replace("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se ha podido entrar.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      <div className="flex rounded-full bg-paper-2 p-1">
        {(["entrar", "crear"] as const).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setMode(item)}
            className={`flex-1 rounded-full py-2 text-sm ${mode === item ? "bg-ink text-paper" : "text-ink-soft"}`}
          >
            {item === "entrar" ? "Entrar" : "Crear cuenta"}
          </button>
        ))}
      </div>
      {mode === "crear" ? (
        <Field label="Cómo te llama tu persona">
          <Input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Tu nombre" />
        </Field>
      ) : null}
      <Field label="Email">
        <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
      </Field>
      <Field label="Contraseña">
        <Input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          autoComplete={mode === "crear" ? "new-password" : "current-password"}
        />
      </Field>
      {error ? <p className="text-sm text-rose">{error}</p> : null}
      <Button disabled={busy}>{busy ? "Un segundo…" : mode === "entrar" ? "Entrar" : "Crear cuenta"}</Button>
    </form>
  );
}
