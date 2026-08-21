"use client";

import { useState } from "react";
import { updateBankAccountManualBalance } from "@/features/management/bank-accounts";

export function BankAccountManualBalanceForm({
  bankAccountId,
  manualBalanceEnabled,
  manualOpeningBalance,
  manualBalanceDate,
}: {
  bankAccountId: number;
  manualBalanceEnabled: boolean;
  manualOpeningBalance: number | null;
  manualBalanceDate: string | null;
}) {
  const [enabled, setEnabled] = useState(manualBalanceEnabled);
  return (
    <form action={updateBankAccountManualBalance} className="inline-form manual-balance-form">
      <input type="hidden" name="bank_account_id" value={bankAccountId} />
      <input type="hidden" name="manual_balance_enabled" value={String(enabled)} />
      <label>
        <input type="checkbox" name="manual_balance_enabled_checkbox" checked={enabled} onChange={(event) => setEnabled(event.target.checked)} />
        <span>Usar saldo real manual</span>
      </label>
      {enabled && (
        <>
          <label>
            <span>Saldo inicial real</span>
            <input type="number" step="0.01" name="manual_opening_balance" defaultValue={manualOpeningBalance ?? undefined} required />
          </label>
          <label>
            <span>Data-base</span>
            <input type="date" name="manual_balance_date" defaultValue={manualBalanceDate ?? undefined} required />
          </label>
        </>
      )}
      <button className="secondary-button small">Salvar</button>
    </form>
  );
}
