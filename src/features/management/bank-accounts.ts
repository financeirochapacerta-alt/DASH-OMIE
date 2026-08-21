"use server";

import "server-only";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireManagementAccess } from "./access";

export type BankAccountReconciliationRow = {
  id: number;
  omieId: string;
  description: string;
  selectedForCash: boolean;
  blocked: boolean;
  inactive: boolean;
  balanceDate: string | null;
  initialBalance: number;
  computedBalance: number;
};

export async function listBankAccountsForReconciliation(): Promise<BankAccountReconciliationRow[]> {
  await requireManagementAccess("configuration");
  const supabase = await createClient();
  const result = await supabase.schema("analytics").from("bank_account_reconciliation").select("*").order("bank_account_id");
  if (result.error) throw new Error("Não foi possível consultar as contas correntes.");
  return (result.data ?? []).map((row) => ({
    id: Number(row.bank_account_id),
    omieId: String(row.omie_id ?? ""),
    description: String(row.description ?? "Conta sem nome"),
    selectedForCash: row.selected_for_cash === true,
    blocked: row.blocked === true,
    inactive: row.inactive === true,
    balanceDate: typeof row.balance_date === "string" ? row.balance_date : null,
    initialBalance: Number(row.initial_balance ?? 0),
    computedBalance: Number(row.computed_balance ?? 0),
  }));
}

// selected_for_cash is the only column this action ever touches — the DB grant itself is
// column-scoped (grant update (selected_for_cash) on bank_accounts to authenticated), so this
// is enforced twice, not just here. The Omie sync always runs as service_role and never
// includes selected_for_cash in its upsert payload, so it can never undo this choice.
export async function updateBankAccountSelection(formData: FormData) {
  await requireManagementAccess("configuration");
  const id = Number(formData.get("bank_account_id"));
  const selected = formData.get("selected_for_cash") === "true";
  if (!Number.isFinite(id) || id <= 0) throw new Error("Conta corrente inválida.");
  const supabase = await createClient();
  const { error } = await supabase.from("bank_accounts").update({ selected_for_cash: selected }).eq("id", id);
  if (error) throw new Error("Não foi possível atualizar a seleção da conta.");
  revalidatePath("/configuracoes");
  revalidatePath("/fluxo-de-caixa");
  revalidatePath("/");
}
