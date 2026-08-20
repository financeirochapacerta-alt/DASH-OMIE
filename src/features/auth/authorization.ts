import { isUserRole, type UserRole } from "@/types/auth";

export const ACCESS_AREAS = [
  "dashboard",
  "profiles",
  "customers",
  "sellers",
  "categories",
  "bank_accounts",
  "sales_orders",
  "service_orders",
  "financial",
  "dre",
  "analytics_financial",
  "analytics_commercial",
  "configuration",
] as const;

export type AccessArea = (typeof ACCESS_AREAS)[number];
export type AccessAction = "read" | "write";

const readAccess: Record<UserRole, readonly AccessArea[]> = {
  ADMIN: ACCESS_AREAS,
  DIRETORIA: ACCESS_AREAS.filter((area) => area !== "profiles"),
  FINANCEIRO: [
    "dashboard",
    "customers",
    "sellers",
    "categories",
    "bank_accounts",
    "financial",
    "dre",
    "analytics_financial",
  ],
  COMERCIAL: [
    "dashboard",
    "customers",
    "sellers",
    "sales_orders",
    "service_orders",
    "analytics_commercial",
  ],
  PRODUCAO: ["dashboard", "customers", "sellers", "sales_orders", "service_orders"],
  VIEWER: ["dashboard"],
};

const writeAccess: Record<UserRole, readonly AccessArea[]> = {
  ADMIN: ["profiles", "configuration"],
  DIRETORIA: [],
  FINANCEIRO: [],
  COMERCIAL: [],
  PRODUCAO: [],
  VIEWER: [],
};

export function canAccess(
  role: unknown,
  isActive: boolean,
  area: AccessArea,
  action: AccessAction = "read",
) {
  if (!isActive || !isUserRole(role)) return false;

  const matrix = action === "write" ? writeAccess : readAccess;
  return matrix[role].includes(area);
}
