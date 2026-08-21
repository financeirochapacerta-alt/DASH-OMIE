import Image from "next/image";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/management/app-shell";
import { logout } from "@/features/auth/actions";
import { getAuthUserContext } from "@/features/auth/session";

export default async function ManagementLayout({ children }: { children: React.ReactNode }) {
  const auth = await getAuthUserContext(); if (!auth) redirect("/login");
  if (!auth.profile?.is_active) return <main className="auth-state"><section className="login-panel"><Image className="brand-mark" src="/branding/logo-chapa-certa-fundo-claro.png" alt="Chapa Certa" width={65} height={68} /><p className="eyebrow">ACESSO BLOQUEADO</p><h1>Perfil inativo</h1><p>Solicite a ativação do seu perfil a um administrador.</p><form action={logout}><button className="secondary-button">Sair</button></form></section></main>;
  return <AppShell role={auth.profile.role} userName={auth.profile.full_name ?? auth.email ?? "Usuário"} logoutAction={logout}>{children}</AppShell>;
}
