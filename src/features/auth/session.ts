import "server-only";

import { createClient } from "@/lib/supabase/server";
import { parseProfile, type AuthUserContext } from "@/types/auth";

export async function getAuthUserContext(): Promise<AuthUserContext | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;
  const userId = claims?.sub;

  if (error || !claims || typeof userId !== "string") return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, role, is_active, created_at, updated_at")
    .eq("id", userId)
    .maybeSingle();

  const email = typeof claims.email === "string" ? claims.email : null;

  return {
    userId,
    email,
    profile: parseProfile(profile),
  };
}
