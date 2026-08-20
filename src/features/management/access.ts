import "server-only";

import { notFound, redirect } from "next/navigation";
import { canAccess, type AccessArea } from "@/features/auth/authorization";
import { getAuthUserContext } from "@/features/auth/session";

export async function requireManagementAccess(area: AccessArea) {
  const auth = await getAuthUserContext(); if (!auth) redirect("/login");
  if (!auth.profile?.is_active || !canAccess(auth.profile.role, true, area)) notFound();
  return auth;
}
