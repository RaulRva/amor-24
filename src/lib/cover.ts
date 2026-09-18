import { createClient } from "@/lib/supabase/client";

export function albumPublicUrl(path: string | null) {
  if (!path) return null;
  return createClient().storage.from("album").getPublicUrl(path).data.publicUrl;
}

export async function uploadCoupleCover(coupleId: string, file: File, previousPath: string | null) {
  if (!file.type.startsWith("image/")) {
    throw new Error("Elige una imagen.");
  }
  if (file.size > 5 * 1024 * 1024) {
    throw new Error("La foto pesa demasiado (máx. 5 MB).");
  }

  const ext = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  const path = `${coupleId}/home/${crypto.randomUUID()}.${ext}`;
  const supabase = createClient();
  const { error } = await supabase.storage.from("album").upload(path, file, { upsert: false });
  if (error) throw error;

  const { error: updateError } = await supabase.from("couples").update({ cover_path: path }).eq("id", coupleId);
  if (updateError) throw updateError;

  if (previousPath && previousPath !== path) {
    await supabase.storage.from("album").remove([previousPath]);
  }

  return path;
}
