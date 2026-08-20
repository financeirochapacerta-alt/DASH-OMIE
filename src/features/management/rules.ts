export type GoalProgress = { percentage: number; remaining: number; requiredPerBusinessDay: number; pace: "ahead" | "on_track" | "behind" };

function dateOnly(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year!, month! - 1, day!));
}

export function businessDaysRemaining(currentDate: string, monthEnd: string) {
  const current = dateOnly(currentDate); const end = dateOnly(monthEnd); let count = 0;
  for (const day = new Date(current); day <= end; day.setUTCDate(day.getUTCDate() + 1)) {
    if (day.getUTCDay() !== 0 && day.getUTCDay() !== 6) count += 1;
  }
  return count;
}

export function goalProgress(goal: number, actual: number, elapsedBusinessShare: number, remainingBusinessDays: number): GoalProgress {
  if (goal <= 0) return { percentage: 0, remaining: 0, requiredPerBusinessDay: 0, pace: "on_track" };
  const percentage = actual / goal * 100; const remaining = Math.max(goal - actual, 0);
  const expected = Math.max(0, Math.min(elapsedBusinessShare, 1)) * 100;
  return { percentage, remaining, requiredPerBusinessDay: remainingBusinessDays ? remaining / remainingBusinessDays : remaining,
    pace: percentage + 0.5 < expected ? "behind" : percentage > expected + 0.5 ? "ahead" : "on_track" };
}

export function delinquency(overdue: number, open: number) {
  return { amount: overdue, percentage: open > 0 ? overdue / open * 100 : 0 };
}

export type AlertPriority = "critical" | "warning" | "info";
export type ManagementAlert = { type: string; priority: AlertPriority; area: "cash" | "financial" | "commercial" | "data_quality"; title: string; value?: number };
export function customerConcentrationAlert(share: number, threshold: number): ManagementAlert | null {
  if (threshold <= 0 || share <= threshold) return null;
  return { type: "CUSTOMER_CONCENTRATION", priority: share >= threshold * 1.25 ? "critical" : "warning", area: "commercial", title: "Concentração elevada em um cliente", value: share };
}
export function alertPriority(type: string, value = 0): AlertPriority {
  if (type === "CASH_NEGATIVE" || type === "HIGH_OVERDUE_AMOUNT") return "critical";
  if (["CASH_BELOW_MINIMUM", "OVERDUE_RECEIVABLES", "REVENUE_TARGET_BEHIND", "CUSTOMER_CONCENTRATION", "PAYMENT_CONCENTRATION"].includes(type)) return "warning";
  return value > 0 ? "warning" : "info";
}

export type AlertSignals = { negativeCashDate?: string | null; belowMinimumDate?: string | null; overdueReceivables: number; highOverdueThreshold: number; goalBehind: boolean; customerShare: number; customerThreshold: number; paymentConcentration: number; paymentThreshold: number; unmappedCategories: number; pendingEnrichment: number };
export function generateManagementAlerts(signals: AlertSignals): ManagementAlert[] {
  const alerts: ManagementAlert[] = [];
  if (signals.negativeCashDate) alerts.push({ type:"CASH_NEGATIVE",priority:"critical",area:"cash",title:"Caixa projetado negativo" });
  if (signals.belowMinimumDate) alerts.push({ type:"CASH_BELOW_MINIMUM",priority:"warning",area:"cash",title:"Caixa abaixo do mínimo" });
  if (signals.overdueReceivables > 0) alerts.push({ type:"OVERDUE_RECEIVABLES",priority:"warning",area:"financial",title:"Recebíveis vencidos",value:signals.overdueReceivables });
  if (signals.highOverdueThreshold > 0 && signals.overdueReceivables >= signals.highOverdueThreshold) alerts.push({ type:"HIGH_OVERDUE_AMOUNT",priority:"critical",area:"financial",title:"Valor vencido elevado",value:signals.overdueReceivables });
  if (signals.goalBehind) alerts.push({ type:"REVENUE_TARGET_BEHIND",priority:"warning",area:"commercial",title:"Meta de receita atrasada" });
  const concentration=customerConcentrationAlert(signals.customerShare,signals.customerThreshold); if(concentration) alerts.push(concentration);
  if(signals.paymentThreshold>0&&signals.paymentConcentration>signals.paymentThreshold) alerts.push({type:"PAYMENT_CONCENTRATION",priority:"warning",area:"cash",title:"Concentração de pagamentos",value:signals.paymentConcentration});
  if(signals.unmappedCategories>0) alerts.push({type:"UNMAPPED_DRE_CATEGORIES",priority:"info",area:"data_quality",title:"Categorias DRE não classificadas",value:signals.unmappedCategories});
  if(signals.pendingEnrichment>0) alerts.push({type:"DATA_QUALITY_PENDING_ENRICHMENT",priority:"info",area:"data_quality",title:"Pedidos aguardando enriquecimento",value:signals.pendingEnrichment});
  return alerts;
}
