import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { CoupleProvider } from "@/components/couple-context";
import { createClient } from "@/lib/supabase/server";
import type { Couple, Profile } from "@/lib/types";

export default async function TogetherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) {
    await supabase.from("profiles").insert({
      id: user.id,
      display_name: user.user_metadata?.display_name || user.email?.split("@")[0] || "tú",
    });
    redirect("/unirse");
  }

  if (!profile?.couple_id) redirect("/unirse");

  const [{ data: couple }, { data: people }] = await Promise.all([
    supabase.from("couples").select("*").eq("id", profile.couple_id).single(),
    supabase.from("profiles").select("*").eq("couple_id", profile.couple_id),
  ]);

  const partner = (people ?? []).find((person: Profile) => person.id !== profile.id) ?? null;

  return (
    <CoupleProvider
      value={{
        profile: profile as Profile,
        partner,
        couple: couple as Couple,
      }}
    >
      <AppShell>{children}</AppShell>
    </CoupleProvider>
  );
}
