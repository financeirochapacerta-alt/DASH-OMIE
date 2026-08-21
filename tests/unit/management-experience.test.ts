import { describe, expect, it } from "vitest";
import { alertPriority, businessDaysRemaining, customerConcentrationAlert, delinquency, generateManagementAlerts, goalProgress } from "@/features/management/rules";
import { formatBRL, formatDate, formatInteger, formatPercent } from "@/features/management/format";
import { navigationForRole } from "@/features/management/navigation";

describe("management experience rules", () => {
  it("calculates goal percentage, remaining amount, daily requirement and pace", () => {
    expect(goalProgress(100000, 45000, .6, 10)).toEqual({ percentage: 45, remaining: 55000, requiredPerBusinessDay: 5500, pace: "behind" });
    expect(goalProgress(0, 0, .5, 0).pace).toBe("on_track");
  });
  it("counts remaining business days without timezone drift", () => {
    expect(businessDaysRemaining("2026-08-20", "2026-08-31")).toBe(8);
  });
  it("calculates managerial delinquency safely", () => {
    expect(delinquency(200, 1000)).toEqual({ amount: 200, percentage: 20 });
    expect(delinquency(0, 0).percentage).toBe(0);
  });
  it("assigns deterministic alert priorities and configurable concentration", () => {
    expect(alertPriority("CASH_NEGATIVE")).toBe("critical"); expect(alertPriority("UNMAPPED_DRE_CATEGORIES", 3)).toBe("warning");
    expect(customerConcentrationAlert(31, 30)?.priority).toBe("warning"); expect(customerConcentrationAlert(20, 30)).toBeNull();
  });
  it("generates every configured alert family without AI", () => {
    const alerts=generateManagementAlerts({negativeCashDate:"2026-09-01",belowMinimumDate:"2026-08-28",overdueReceivables:5000,highOverdueThreshold:4000,goalBehind:true,customerShare:45,customerThreshold:30,paymentConcentration:7000,paymentThreshold:6000,unmappedCategories:2,pendingEnrichment:3});
    expect(alerts.map((alert)=>alert.type)).toEqual(["CASH_NEGATIVE","CASH_BELOW_MINIMUM","OVERDUE_RECEIVABLES","HIGH_OVERDUE_AMOUNT","REVENUE_TARGET_BEHIND","CUSTOMER_CONCENTRATION","PAYMENT_CONCENTRATION","UNMAPPED_DRE_CATEGORIES","DATA_QUALITY_PENDING_ENRICHMENT"]);
  });
  it("centralizes pt-BR formatting and preserves DATE semantics", () => {
    expect(formatBRL(1234.5)).toContain("1.234,50"); expect(formatPercent(45)).toContain("45");
    expect(formatInteger(1200)).toBe("1.200"); expect(formatDate("2026-08-20")).toBe("20/08/2026");
  });
  it("keeps navigation consistent with role permissions", () => {
    expect(navigationForRole("ADMIN")).toHaveLength(9);
    expect(navigationForRole("FINANCEIRO").map((item) => item.href)).not.toContain("/comercial");
    expect(navigationForRole("COMERCIAL").map((item) => item.href)).toEqual(["/", "/comercial", "/alertas"]);
    expect(navigationForRole("VIEWER").map((item) => item.href)).toEqual(["/"]);
  });
});
