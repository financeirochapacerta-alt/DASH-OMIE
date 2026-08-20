import { redirect } from "next/navigation";

import { logout } from "@/features/auth/actions";
import { getAuthUserContext } from "@/features/auth/session";

export default async function Home() {
  const auth = await getAuthUserContext();
  if (!auth) redirect("/login");

  if (!auth.profile?.is_active) {
    return (
      <main className="shell">
        <section className="login-panel" aria-labelledby="blocked-title">
          <div className="brand-mark" aria-hidden="true">CC</div>
          <p className="eyebrow">ACESSO BLOQUEADO</p>
          <h1 id="blocked-title" className="login-title">Perfil inativo</h1>
          <p className="status">Solicite a ativação do seu perfil a um administrador.</p>
          <form action={logout}><button className="secondary-button">Sair</button></form>
        </section>
      </main>
    );
  }

  return (
    <main className="shell">
      <section className="hero" aria-labelledby="page-title">
        <div className="brand-mark" aria-hidden="true">CC</div>
        <p className="eyebrow">CHAPA CERTA</p>
        <h1 id="page-title">Central de Gestão</h1>
        <p className="status">Sessão autenticada e autorização ativa</p>

        <div className="session-card">
          <span>Usuário</span><strong>{auth.profile.full_name ?? auth.email ?? auth.userId}</strong>
          <span>Perfil</span><strong>{auth.profile.role}</strong>
          <span>Status</span><strong className="active-status">Ativo</strong>
        </div>
        <form action={logout}><button className="secondary-button">Sair</button></form>
        <p className="stage">Etapa 3 · Auth e autorização</p>
      </section>
    </main>
  );
}
