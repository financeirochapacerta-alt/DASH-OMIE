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
  manualBalanceEnabled: boolean;
  manualOpeningBalance: number | null;
  manualBalanceDate: string | null;
  manualBalanceUpdatedAt: string | null;
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
    manualBalanceEnabled: row.manual_balance_enabled === true,
    manualOpeningBalance: typeof row.manual_opening_balance === "number" ? row.manual_opening_balance : row.manual_opening_balance !== null ? Number(row.manual_opening_balance) : null,
    manualBalanceDate: typeof row.manual_balance_date === "string" ? row.manual_balance_date : null,
    manualBalanceUpdatedAt: typeof row.manual_balance_updated_at === "string" ? row.manual_balance_updated_at : null,
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

// manual_opening_balance/manual_balance_date/manual_balance_enabled/manual_balance_updated_at
// are the only columns this action ever touches — same column-scoped grant pattern as
// selected_for_cash, and the Omie sync never includes them in its upsert payload either, so a
// resync can never overwrite a manual anchor.
export async function updateBankAccountManualBalance(formData: FormData) {
  await requireManagementAccess("configuration");
  const id = Number(formData.get("bank_account_id"));
  if (!Number.isFinite(id) || id <= 0) throw new Error("Conta corrente inválida.");
  const enabled = formData.get("manual_balance_enabled") === "true";

  if (!enabled) {
    const supabase = await createClient();
    const { error } = await supabase.from("bank_accounts").update({ manual_balance_enabled: false }).eq("id", id);
    if (error) throw new Error("Não foi possível desativar o saldo manual.");
    revalidatePath("/configuracoes");
    revalidatePath("/fluxo-de-caixa");
    revalidatePath("/");
    return;
  }

  const openingRaw = formData.get("manual_opening_balance");
  const dateRaw = formData.get("manual_balance_date");
  const opening = typeof openingRaw === "string" ? Number(openingRaw.replace(",", ".")) : NaN;
  const date = typeof dateRaw === "string" ? dateRaw : "";
  if (!Number.isFinite(opening) || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error("Informe saldo inicial e data-base válidos para ativar o saldo manual.");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("bank_accounts")
    .update({
      manual_balance_enabled: true,
      manual_opening_balance: opening,
      manual_balance_date: date,
      manual_balance_updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw new Error("Não foi possível salvar o saldo manual.");
  revalidatePath("/configuracoes");
  revalidatePath("/fluxo-de-caixa");
  revalidatePath("/");
}
