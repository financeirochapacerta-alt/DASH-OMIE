export const USER_ROLES = [
  "ADMIN",
  "DIRETORIA",
  "FINANCEIRO",
  "COMERCIAL",
  "PRODUCAO",
  "VIEWER",
] as const;

export type UserRole = (typeof USER_ROLES)[number];

export type Profile = {
  id: string;
  full_name: string | null;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export function isUserRole(value: unknown): value is UserRole {
  return typeof value === "string" && USER_ROLES.some((role) => role === value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function parseProfile(value: unknown): Profile | null {
  if (
    !isRecord(value) ||
    typeof value.id !== "string" ||
    !(typeof value.full_name === "string" || value.full_name === null) ||
    !isUserRole(value.role) ||
    typeof value.is_active !== "boolean" ||
    typeof value.created_at !== "string" ||
    typeof value.updated_at !== "string"
  ) {
    return null;
  }

  return {
    id: value.id,
    full_name: value.full_name,
    role: value.role,
    is_active: value.is_active,
    created_at: value.created_at,
    updated_at: value.updated_at,
  };
}

export type AuthUserContext = {
  userId: string;
  email: string | null;
  profile: Profile | null;
};
