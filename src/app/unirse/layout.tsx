import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function UnirseLayout({
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
    .select("couple_id")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.couple_id) redirect("/");

  return children;
}
