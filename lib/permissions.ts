import { createClient } from "@/lib/supabase/server";
import type { AppRole } from "@/lib/database.types";

/**
 * Papel do usuário autenticado. A checagem real de acesso acontece via RLS
 * no banco (policies baseadas em public.has_role) — esta função serve para
 * decidir o que renderizar na interface, nunca como única barreira de segurança.
 */
export async function getCurrentUserRole(): Promise<AppRole | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  return (data?.role as AppRole | undefined) ?? null;
}

export async function isCurrentUserAdmin(): Promise<boolean> {
  const role = await getCurrentUserRole();
  return role === "admin";
}
