import "server-only";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { canAccess } from "@/features/auth/authorization";
import { isUserRole, USER_ROLES, type UserRole } from "@/types/auth";
import { requireManagementAccess } from "./access";

async function requireProfileWriteAccess() {
  const auth = await requireManagementAccess("profiles");
  if (!auth.profile || !canAccess(auth.profile.role, auth.profile.is_active, "profiles", "write")) {
    throw new Error("Apenas ADMIN pode alterar usuários.");
  }
  return auth;
}

export type ManagedUser = {
  id: string;
  fullName: string | null;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
};

export async function listUsers(): Promise<ManagedUser[]> {
  const client = await createClient();
  const result = await client.from("profiles").select("id,full_name,role,is_active,created_at").order("created_at", { ascending: false });
  if (result.error) throw new Error("Não foi possível consultar os usuários.");
  return result.data.map((row) => ({ id: row.id, fullName: row.full_name, role: row.role, isActive: row.is_active, createdAt: row.created_at }));
}

// Server-side only. RLS (profiles_update_admin) already requires the caller to be an active
// ADMIN, so this never needs service_role — the write goes through the same authenticated
// client and is rejected by Postgres itself for anyone else, not just hidden by the UI.
export async function updateUserRole(formData: FormData) {
  "use server";
  const auth = await requireProfileWriteAccess();
  const userId = String(formData.get("userId") ?? "");
  const role = formData.get("role");
  if (!userId || !isUserRole(role)) throw new Error("Dados inválidos para atualização de usuário.");
  if (userId === auth.userId) throw new Error("Você não pode alterar sua própria role.");

  const client = await createClient();
  const { error } = await client.from("profiles").update({ role }).eq("id", userId);
  if (error) throw new Error("Não foi possível atualizar a role do usuário.");
  revalidatePath("/usuarios");
}

export async function toggleUserActive(formData: FormData) {
  "use server";
  const auth = await requireProfileWriteAccess();
  const userId = String(formData.get("userId") ?? "");
  const nextActive = formData.get("active") === "true";
  if (!userId) throw new Error("Usuário inválido.");
  if (userId === auth.userId) throw new Error("Você não pode desativar sua própria conta.");

  const client = await createClient();
  const { error } = await client.from("profiles").update({ is_active: nextActive }).eq("id", userId);
  if (error) throw new Error("Não foi possível atualizar o status do usuário.");
  revalidatePath("/usuarios");
}

export const MANAGED_ROLES = USER_ROLES;
