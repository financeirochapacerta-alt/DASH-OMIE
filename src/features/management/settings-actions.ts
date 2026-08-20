"use server";

import { revalidatePath } from "next/cache";
import { requireManagementAccess } from "./access";
import { createClient } from "@/lib/supabase/server";

const fields = ["monthly_revenue_goal", "minimum_cash", "cash_projection_days", "customer_concentration_threshold"] as const;
export async function updateManagementSettings(formData: FormData) {
  await requireManagementAccess("configuration"); const supabase = await createClient();
  const rows = fields.map((key) => { const value = Number(formData.get(key));
    if (!Number.isFinite(value) || value < 0) throw new Error("Parâmetro gerencial inválido");
    return { setting_key: key, value, value_type: "number" as const, description: null };
  });
  const { error } = await supabase.from("management_settings").upsert(rows, { onConflict: "setting_key" });
  if (error) throw new Error("Não foi possível salvar os parâmetros gerenciais."); revalidatePath("/configuracoes");
}
