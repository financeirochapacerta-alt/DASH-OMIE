import type { UserRole } from "@/types/auth";

export type NavigationItem = { href: string; label: string; area: "dashboard" | "financial" | "dre" | "analytics_commercial" | "configuration"; roles: readonly UserRole[] };
const ALL: readonly UserRole[] = ["ADMIN", "DIRETORIA", "FINANCEIRO", "COMERCIAL", "PRODUCAO", "VIEWER"];
export const MANAGEMENT_NAVIGATION: readonly NavigationItem[] = [
  { href: "/", label: "Visão Geral", area: "dashboard", roles: ALL },
  { href: "/financeiro", label: "Financeiro", area: "financial", roles: ["ADMIN", "DIRETORIA", "FINANCEIRO"] },
  { href: "/fluxo-de-caixa", label: "Fluxo de Caixa", area: "financial", roles: ["ADMIN", "DIRETORIA", "FINANCEIRO"] },
  { href: "/dre", label: "DRE", area: "dre", roles: ["ADMIN", "DIRETORIA", "FINANCEIRO"] },
  { href: "/comercial", label: "Comercial", area: "analytics_commercial", roles: ["ADMIN", "DIRETORIA", "COMERCIAL"] },
  { href: "/alertas", label: "Alertas", area: "dashboard", roles: ["ADMIN", "DIRETORIA", "FINANCEIRO", "COMERCIAL"] },
  { href: "/configuracoes", label: "Configurações", area: "configuration", roles: ["ADMIN"] },
] as const;
export const navigationForRole = (role: UserRole) => MANAGEMENT_NAVIGATION.filter((item) => item.roles.includes(role));
